/**
 * AI Assistant Plugin v1.0
 *
 * 使用方法:
 * 1. 将此文件保存为 ai-plugin.js
 * 2. 在您想集成的HTML页面中添加 <script src="path/to/ai-plugin.js" defer></script>
 * 3. (可选) 通过在页面中定义 window.AI_PLUGIN_CONFIG 对象来覆盖默认配置。
 */

(function () {
  // --- 1. 防止插件被重复加载 ---
  if (document.getElementById("aiAssistantWidgetContainer")) {
    console.warn("AgriGik already loaded.");
    return;
  }
  // 注入 Sweetswal2
  const swalScript = document.createElement("script");
  swalScript.src = "/static/js/sweetalert.min.js";
  document.head.appendChild(swalScript);

  const swalScript2 = document.createElement("script");
  swalScript2.src = "/static/js/sweetalert2.js";
  document.head.appendChild(swalScript2);
  // --- 2. 默认配置 ---
  const defaultConfig = {
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "AgriGik",
    apiUrl: "http://127.0.0.1:5000",
    lucideIconUrl: "https://unpkg.com/lucide@latest/dist/umd/lucide.js",
  };

  // --- 3. 合并用户配置 ---
  const userConfig = window.AI_PLUGIN_CONFIG || {};
  const config = { ...defaultConfig, ...userConfig };

  // --- 4. 定义插件的CSS样式 (来自 styles.css) ---
  // --- 4. Define plugin CSS styles (from styles.css) ---
  const widgetCSS = `
    /* CSS Variable Definitions */
    :root {
      --bg-primary: linear-gradient(135deg, #f2fffb 0%, #14b8a6 100%);
      --bg-secondary: rgba(255, 255, 255, 0.95);
      --bg-glass: rgba(255, 255, 255, 0.1);
      --text-primary: #1f2937;
      --text-secondary: #6b7280;
      --border-color: rgba(255, 255, 255, 0.3);
      --shadow-color: rgba(31, 38, 135, 0.37);
    }
    .dark {
      --bg-primary: linear-gradient(135deg, #111827 0%, #065f46 100%);
      --bg-secondary: rgba(17, 24, 39, 0.95);
      --bg-glass: rgba(17, 24, 39, 0.3);
      --text-primary: #f9fafb;
      --text-secondary: #d1d5db;
      --border-color: rgba(75, 85, 99, 0.3);
      --shadow-color: rgba(0, 0, 0, 0.5);
    }
    #aiAssistantWidgetContainer * { box-sizing: border-box; }
    .icon { width: 20px; height: 20px; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; fill: none; flex-shrink: 0; }
    .icon-sm { width: 16px; height: 16px; }
    .icon-lg { width: 28px; height: 28px; }
    .icon-avatar { width: 24px; height: 24px; filter: brightness(0) invert(1); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; text-decoration: none; outline: none; }
    .btn-primary { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6); }
    .btn-secondary { background: rgba(255, 255, 255, 0.9); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    .btn-secondary:hover { background: #10b981; color: white; }
    .btn-danger { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3); }
    .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(231, 76, 60, 0.5); background: linear-gradient(135deg, #c0392b 0%, #a93226 100%); }
    .btn-sm { padding: 8px 16px; font-size: 12px; border-radius: 8px; }
    .btn-floating { position: fixed; bottom: 0px; right: 24px; height: 56px; min-width: 56px; padding: 0 20px; border-radius: 28px; background: rgba(31, 41, 55, 0.3); color: white; border: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); transition: all 0.3s ease; z-index: 9999; display: flex; align-items: center; justify-content: center; gap: 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 500; font-size: 14px; overflow: hidden; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); }
    .btn-full-width { width: 100%; }
    .floating-content { display: flex; align-items: center; justify-content: center; gap: 10px; position: relative; z-index: 10; }
    .floating-icon { width: 20px; height: 20px; filter: brightness(0) invert(1); flex-shrink: 0; }
    .floating-text { font-weight: 600; letter-spacing: 0.025em; white-space: nowrap; }
    .btn-floating:hover { transform: scale(1.05); box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25); background: rgba(55, 65, 81, 0.4); border-color: rgba(255, 255, 255, 0.2); }
    .btn-floating.active { transform: scale(0.95); }
    .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 28px; background: rgba(16, 185, 129, 0.2); animation: pulse-ring-anim 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
    @keyframes pulse-ring-anim { 0% { transform: scale(0.8); opacity: 1; } 80% { transform: scale(1.4); opacity: 0; } 100% { transform: scale(1.4); opacity: 0; } }
    .chat-container { position: fixed; bottom: 100px; right: 24px; width: 380px; height: 500px; background: var(--bg-secondary); backdrop-filter: blur(20px); border-radius: 20px; border: 1px solid var(--border-color); box-shadow: 0 20px 40px var(--shadow-color); display: flex; flex-direction: column; overflow: hidden; opacity: 0; transform: translateY(20px) scale(0.9); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: none; z-index: 9998;}
    .chat-container.active { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
    .chat-header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 20px; display: flex; align-items: center; justify-content: space-between; }
    .chat-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 12px; }
    .chat-actions { display: flex; gap: 8px; }
    .chat-action-btn { width: 32px; height: 32px; border-radius: 8px; background: rgba(255, 255, 255, 0.2); border: none; color: white; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
    .chat-action-btn:hover { background: rgba(255, 255, 255, 0.3); }
    .chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
    .chat-messages::-webkit-scrollbar { width: 4px; }
    .chat-messages::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 2px; }
    .message { display: flex; align-items: flex-start; gap: 12px; max-width: 85%; opacity: 0; transform: translateY(20px); animation: slideInUp-anim 0.3s ease-out forwards; }
    @keyframes slideInUp-anim { to { opacity: 1; transform: translateY(0); } }
    .message.user { flex-direction: row; align-self: flex-end; gap: 0; }
    .message.ai { flex-direction: row; align-self: flex-start; }
    .message-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; font-weight: 600; position: relative; overflow: hidden; }
    .message-avatar.user { display: none; }
    .message-avatar.ai { background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); color: white; }
    .message-content { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.6; word-wrap: break-word; }
    .message.user .message-content { background: #e5e7eb; color: #374151; border-radius: 18px; }
    .message.ai .message-content { background: #f8f9fa; color: #2d3748; border-bottom-left-radius: 4px; }
    
    /* Message Content Optimization */
    .message-content > p:first-child { margin-top: 0; }
    .message-content > p:last-child { margin-bottom: 0; }
    .message-content > *:first-child { margin-top: 0; }
    .message-content > *:last-child { margin-bottom: 0; }
    .chat-input { padding: 20px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-top: 1px solid rgba(0, 0, 0, 0.1); }
    .input-container { display: flex; align-items: center; gap: 12px; background: white; border-radius: 25px; padding: 8px 16px; border: 1px solid rgba(0, 0, 0, 0.1); }
    .input-container input { flex: 1; border: none; outline: none; padding: 8px 0; font-size: 14px; background: transparent; }
    .send-btn { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); border: none; color: white; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
    .send-btn:hover { transform: scale(1.1); }
    .fullscreen-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--bg-secondary); backdrop-filter: blur(20px); z-index: 10000; display: flex; flex-direction: column; opacity: 0; visibility: hidden; transition: all 0.3s ease; pointer-events: none; }
    .fullscreen-modal.active { opacity: 1; visibility: visible; pointer-events: all; }
    .fullscreen-header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 20px var(--shadow-color); position: relative; z-index: 10001; }
    .fullscreen-title { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 16px; }
    .fullscreen-actions { display: flex; gap: 12px; }
    .fullscreen-content { flex: 1; display: flex; overflow: hidden; }
    .sidebar { width: 280px; background: white; border-right: 1px solid rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; transition: all 0.3s ease; }
    .sidebar.hidden { width: 0; overflow: hidden; }
    .sidebar-header { 
      padding: 16px; 
      border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
      background: rgba(255, 255, 255, 0.05);
    }
    .sidebar-header-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
    .sidebar-content { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
    .sidebar-content::-webkit-scrollbar { width: 6px; }
    .sidebar-content::-webkit-scrollbar-thumb { background: rgba(102, 126, 234, 0.3); border-radius: 3px; }
    .history-item { position: relative; overflow: hidden; border-radius: 8px; transition: all 0.2s ease; margin-bottom: 2px; border: 1px solid transparent; display: flex; align-items: center; justify-content: space-between; background: transparent; }
    .history-item:hover { background: rgba(0, 0, 0, 0.05); }
    .history-content { flex: 1; padding: 8px 12px; cursor: pointer; min-width: 0; }
    .history-title-row { display: flex; align-items: center; gap: 6px; }
    .history-title { font-size: 13px; font-weight: 500; color: var(--text-primary); line-height: 1.2; }
    .history-date { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
    .pin-icon { flex-shrink: 0; }
    .history-actions { display: flex; flex-direction: column; gap: 4px; padding: 4px; opacity: 0; transition: opacity 0.2s ease; }
    .history-item:hover .history-actions { opacity: 1; }
    .history-action-btn { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border: none; border-radius: 4px; background: rgba(255, 255, 255, 0.1); color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
    .history-action-btn:hover { background: rgba(16, 185, 129, 0.2); color: #10b981; transform: scale(1.1); }
    .history-action-btn.delete:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .history-item.active { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; border-radius: 8px; }
    .history-item.active .history-title { color: white; }
    .history-item.active .history-date { color: rgba(255, 255, 255, 0.8); }
    .main-chat { flex: 1; display: flex; flex-direction: column; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); }
    .main-messages { flex: 1; padding: 40px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
    .main-messages::-webkit-scrollbar { width: 6px; }
    .main-messages::-webkit-scrollbar-thumb { background: rgba(102, 126, 234, 0.3); border-radius: 3px; }
    .example-questions { margin: 32px 0; padding: 24px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); }
    .example-questions-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); text-align: center; position: relative; margin-bottom: 20px;}
    .example-questions-header h3::after { content: ""; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 40px; height: 3px; background: linear-gradient(90deg, #10b981, #06d6a0); border-radius: 2px; }
    .example-questions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .example-question { display: flex; align-items: flex-start; gap: 16px; padding: 20px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 16px; cursor: pointer; transition: all 0.3s ease; text-align: left; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
    .example-question:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.4); }
    .question-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #10b981, #06d6a0); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .question-icon svg { width: 20px; height: 20px; color: white; }
    .question-text { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .question-title { font-weight: 600; font-size: 14px; color: var(--text-primary); }
    .question-desc { font-size: 12px; color: var(--text-secondary); }
    .mini-example-questions { margin: 16px 0; padding: 12px; background: rgba(255, 255, 255, 0.1); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2); }
    .mini-questions-header { margin-bottom: 8px; text-align: center; }
    .mini-questions-header span { font-size: 12px; font-weight: 600; color: var(--text-primary); opacity: 0.8; }
    .mini-questions-list { display: flex; flex-direction: column; gap: 6px; }
    .mini-question { display: flex; align-items: center; padding: 8px 12px; background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; cursor: pointer; transition: all 0.2s ease; text-align: left; font-size: 11px; color: var(--text-primary); }
    .mini-question:hover { transform: translateY(-1px); border-color: rgba(16, 185, 129, 0.4); }
    .main-input-area { background: white; border-top: 1px solid rgba(0, 0, 0, 0.1); padding: 24px; }
    .upload-area { border: 2px dashed #cbd5e0; border-radius: 16px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s ease; margin-bottom: 16px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); }
    .upload-area.dragover { border-color: #667eea; background: rgba(102, 126, 234, 0.1); }
    .main-input-container { position: relative; max-width: 800px; margin: 0 auto; }
    .main-input { width: 100%; padding: 16px 80px 16px 24px; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 16px; line-height: 1.5; resize: none; outline: none; transition: all 0.3s ease; min-height: 56px; max-height: 150px; }
    .main-input:focus { box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15); }
    .input-actions { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); display: flex; gap: 8px; }
    .input-action-btn { width: 40px; height: 40px; border-radius: 50%; border: none; background: transparent; color: #10b981; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
    .input-action-btn:hover { background: rgba(16, 185, 129, 0.1); }
    .input-action-btn.primary { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; }
    .uploaded-files { margin-bottom: 16px; }
    .file-item { display: flex; align-items: center; justify-content: space-between; background: #f7fafc; padding: 12px 16px; border-radius: 10px; margin-bottom: 8px; border: 1px solid #e2e8f0; }
    .file-info { display: flex; align-items: center; gap: 12px; }
    .file-icon { width: 24px; height: 24px; color: #667eea; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; fill: none; }
    .file-name { font-size: 14px; color: #2d3748; font-weight: 500; }
    .file-remove { width: 24px; height: 24px; border-radius: 50%; border: none; background: #fed7d7; color: #e53e3e; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
    .file-remove:hover { background: #fecaca; transform: scale(1.1); }
    .file-remove svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2; }
    .notification-badge { position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; background: #e53e3e; color: white; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid white; }
    .loading-dots { display: inline-flex; gap: 4px; }
    .loading-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: loading-bounce-anim 1.4s infinite both; }
    .loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes loading-bounce-anim { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    .hidden { display: none !important; }
    
    /* Markdown Styles */
    .ai-code-block {
      background: #f6f8fa;
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
      font-size: 13px;
      line-height: 1.45;
      overflow-x: auto;
      color: #24292e;
    }
    
    .ai-inline-code {
      background: #f6f8fa;
      border: 1px solid #e1e5e9;
      border-radius: 4px;
      padding: 2px 4px;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
      font-size: 0.9em;
      color: #e11d48;
    }
    
    .ai-heading {
      margin: 16px 0 8px 0;
      font-weight: 600;
      line-height: 1.25;
    }
    
    .ai-h1 {
      font-size: 1.6em;
      border-bottom: 1px solid #e1e5e9;
      padding-bottom: 8px;
    }
    
    .ai-h2 {
      font-size: 1.4em;
      border-bottom: 1px solid #e1e5e9;
      padding-bottom: 6px;
    }
    
    .ai-h3 {
      font-size: 1.2em;
    }
    
    .ai-bold {
      font-weight: 600;
    }
    
    .ai-italic {
      font-style: italic;
    }
    
    .ai-link {
      color: #0969da;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: all 0.2s ease;
    }
    
    .ai-link:hover {
      text-decoration: underline;
      border-bottom-color: #0969da;
    }
    
    .ai-list, .ai-ordered-list {
      margin: 8px 0;
      padding-left: 20px;
    }
    
    .ai-list-item, .ai-ordered-item {
      margin: 4px 0;
      line-height: 1.5;
    }
    
    .ai-blockquote {
      border-left: 4px solid #d0d7de;
      padding-left: 16px;
      margin: 8px 0;
      color: #656d76;
      font-style: italic;
    }
    
    .ai-divider {
      border: none;
      height: 1px;
      background: #d0d7de;
      margin: 16px 0;
    }
    
    /* language-support */
    .language-javascript, .language-js {
      color: #d73a49;
    }
    
    .language-python {
      color: #005cc5;
    }
    
    .language-html {
      color: #e34c26;
    }
    
    .language-css {
      color: #1572b6;
    }
    
    .language-json {
      color: #032f62;
    }
    
    @media (max-width: 768px) { .sidebar { width: 260px; } .main-messages { padding: 20px; } }
    `;

  // --- 5. 定义插件的HTML结构 (来自 chatv2.html) ---
  const widgetHTML = `
      <div class="ai-assistant-widget">
        <button id="aiButton" onclick="toggleMiniChat()" class="btn-floating">
          <div class="pulse-ring"></div>
          <div class="floating-content">
            <img class="floating-icon" src="/static/img/chat-ui-svgrepo-com.svg" alt="Chat Icon"/>
            <span class="floating-text">问AI</span>
          </div>
          <div id="aiBadge" class="notification-badge hidden">1</div>
        </button>
        <div id="aiMiniChat" class="chat-container">
          <div class="chat-header">
            <div class="chat-title">
              <img class="icon-avatar" src="/static/img/crops4.svg" alt="AgriGik"/>
              AgriGik
            </div>
            <div class="chat-actions">
              <button class="chat-action-btn" onclick="openFullscreen()" title="全屏模式"><svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg></button>
              <button class="chat-action-btn" onclick="toggleMiniChat()" title="关闭"><svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>
          </div>
          <div id="aiMiniMessages" class="chat-messages">
            <div class="message ai"><div class="message-avatar ai"><img class="icon-avatar" src="/static/img/chat-ui-svgrepo-com.svg" alt="AgriGik"/></div><div class="message-content">👋 您好！我是谷稷，有什么可以帮助您的吗？</div></div>
            <div class="mini-example-questions" id="miniExampleQuestions">
              <div class="mini-questions-header"><span>农业问题咨询</span></div>
              <div class="mini-questions-list">
                <button class="mini-question" onclick="selectMiniExampleQuestion(this)" data-question="我的番茄叶子上出现黄色斑点，可能是什么病害？">🍅 作物病虫害诊断</button>
                <button class="mini-question" onclick="selectMiniExampleQuestion(this)" data-question="现在7月份，广东地区适合种植什么蔬菜？">🌱 种植时间咨询</button>
                <button class="mini-question" onclick="selectMiniExampleQuestion(this)" data-question="土壤湿度传感器显示数值异常，如何排查问题？">⚙️ 数据异常分析</button>
                <button class="mini-question" onclick="selectMiniExampleQuestion(this)" data-question="如何制定科学的水肥一体化灌溉方案？">💧 灌溉施肥指导</button>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <div class="input-container">
              <input id="aiMiniInput" type="text" placeholder="输入您的问题..." /><button onclick="sendMiniMessage()" class="send-btn"><svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9 22,2" /></svg></button>
            </div>
          </div>
        </div>
      </div>
      <div id="aiModal" class="fullscreen-modal">
        <div class="fullscreen-header">
          <div class="fullscreen-title">
          <img class="icon-avatar" src="/static/img/crops4.svg" alt="AgriGik"/>
          AgriGik</div>
          <div class="fullscreen-actions">
            <button onclick="handleHeaderButtonClick(event, 'toggleSidebar')" class="btn btn-secondary"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="9,22 9,12 15,12 15,22" /></svg>历史记录</button>
            <button onclick="handleHeaderButtonClick(event, 'exportAllHistory')" class="btn btn-secondary"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>导出历史</button>
            <button onclick="handleHeaderButtonClick(event, 'closeFullscreen')" class="btn btn-secondary" type="button"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>关闭</button>
          </div>
        </div>
        <div class="fullscreen-content">
          <div id="aiSidebar" class="sidebar">
            <div class="sidebar-header">
              <div class="sidebar-header-actions">
                <button onclick="startNewChat()" class="btn btn-primary btn-full-width"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>新建对话</button>
                <button onclick="clearAllHistory()" class="btn btn-danger btn-sm btn-full-width" title="清空所有历史记录"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3,6 5,6 21,6"></polyline><path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path></svg>清空历史</button>
              </div>
            </div>
            <div id="aiHistoryList" class="sidebar-content"></div>
          </div>
          <div class="main-chat">
            <div id="aiFullMessages" class="main-messages">
              <div class="message ai">
                  <div class="message-avatar ai"><img class="icon-avatar" src="/static/img/chat-ui-svgrepo-com.svg" alt="AgriGik"/></div>
                  <div class="message-content">👋 我是谷稷！我可以帮助您解答问题、分析文档、进行创意思考等。请随时向我提问。</div>
              </div>
              <div class="example-questions" id="exampleQuestions">
                  <div class="example-questions-header"><h3>智慧农业助手</h3></div>
                  <div class="example-questions-grid">
                      <button class="example-question" onclick="selectExampleQuestion(this)" data-question="我的番茄叶片背面出现了很多白色小飞虫，应该如何防治？"><div class="question-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path d="M8 12l2 2 4-4" /></svg></div><div class="question-text"><span class="question-title">病虫害智能诊断</span><span class="question-desc">识别作物病害，提供防治方案</span></div></button>
                      <button class="example-question" onclick="selectExampleQuestion(this)" data-question="我在广东，现在7月份适合种什么蔬菜？请给出详细的种植建议。"><div class="question-icon"><svg viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /><circle cx="12" cy="12" r="5" /></svg></div><div class="question-text"><span class="question-title">种植决策支持</span><span class="question-desc">根据地区和季节推荐作物</span></div></button>
                      <button class="example-question" onclick="selectExampleQuestion(this)" data-question="A地块的土壤湿度在过去3小时内下降了50%，可能是什么原因？"><div class="question-icon"><svg viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="m7 16 4-4 4 4 4-4" /></svg></div><div class="question-text"><span class="question-title">数据异常解读</span><span class="question-desc">分析传感器数据波动原因</span></div></button>
                      <button class="example-question" onclick="selectExampleQuestion(this)" data-question="如何为玉米制定科学的水肥一体化灌溉方案？"><div class="question-icon"><svg viewBox="0 0 24 24"><path d="M7 16.3c2.2 0 4-1.8 4-4 0-1.5-.7-2.9-1.9-3.7-.6-.4-1.1-.7-1.1-1.4 0-.4.2-.8.4-1.1C9.1 5.4 10 5 11 5c.6 0 1.2.1 1.8.3"/><path d="m11 2-1 2 1 2 1-2-1-2" /><path d="M19.07 4.93A10 10 0 0 0 12 2" /><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" /><path d="m14 14 1-1 1 1-1 1-1-1" /></svg></div><div class="question-text"><span class="question-title">灌溉施肥指导</span><span class="question-desc">制定水肥管理方案</span></div></button>
                  </div>
              </div>
            </div>
            <div class="main-input-area">
              <div id="aiUploadArea" class="upload-area">
                  <svg class="icon text-gray-500 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" /></svg>
                  <p class="text-gray-600">点击或拖拽文件到此处上传</p><p class="text-sm text-gray-500 mt-1">支持多种文件格式</p>
              </div>
              <input type="file" id="fullFileInput" class="hidden" multiple/>
              <div id="aiUploadedFiles" class="uploaded-files"></div>
              <div class="main-input-container">
                  <textarea id="aiFullInput" placeholder="输入您的问题... (Shift+Enter 换行)" class="main-input" rows="1"></textarea>
                  <div class="input-actions">
                      <button id="fileUploadBtn" class="input-action-btn" title="上传文件"><svg class="icon" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49" /></svg></button>
                      <button onclick="sendFullMessage()" class="input-action-btn primary" title="发送消息"><svg class="icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9 22,2" /></svg></button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

  // --- 6. 注入CSS, HTML和外部依赖的函数 ---
  function initializePlugin() {
    // 注入CSS
    const styleElement = document.createElement("style");
    styleElement.id = "ai-assistant-plugin-styles";
    styleElement.textContent = widgetCSS;
    document.head.appendChild(styleElement);

    // 注入HTML
    const widgetContainer = document.createElement("div");
    widgetContainer.id = "aiAssistantWidgetContainer";
    widgetContainer.innerHTML = widgetHTML;
    document.body.appendChild(widgetContainer);

    // 注入Lucide图标库
    const lucideScript = document.createElement("script");
    lucideScript.src = config.lucideIconUrl;
    lucideScript.onload = () => {
      console.log("AI 助手: Lucide 图标库加载成功。");
      // 依赖加载后, 运行主逻辑
      runAiLogic();
    };
    lucideScript.onerror = () => {
      console.error("AI 助手: Lucide 图标库加载失败，部分图标可能无法显示。");
      // 即使图标加载失败, 也尝试运行主逻辑
      runAiLogic();
    };
    document.head.appendChild(lucideScript);
  }

  // --- 7. 插件的核心JavaScript逻辑 ---
  function runAiLogic() {
    // 使用在第2步中定义的配置
    const OLLAMA_CONFIG = {
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
    };

    // --- 核心逻辑---

    // 状态变量
    let isMiniChatOpen = false;
    let isFullscreenOpen = false;
    let isSidebarOpen = true;
    let currentFiles = [];
    const API_URL = config.apiUrl;
    let currentUser = null;
    let currentSessionId = null;
    let chatHistory = {}; // 改为对象存储，按session_id分组

    // DOM元素获取
    const getEl = (id) => document.getElementById(id);

    // 用户管理
    /**
     * 设置当前用户
     * @param {number} uid - 用户ID
     * @param {number} utype - 用户类型 (对应数据库的anth字段)
     * @param {string} uname - 用户名 (对应数据库的username字段)
     */
    async function setCurrentUser(uid, utype = 0, uname = null) {
      currentUser = { uid, utype, uname };
      console.log("当前用户:", currentUser);
      await loadUserChatHistory();
    }

    /**
     * 从后端获取用户信息并初始化
     * 需要根据实际的用户认证方式来获取用户ID
     */
    async function initializeUser() {
      try {
        // 尝试获取当前用户信息（基于session）
        const response = await fetch(`${API_URL}/current_user`, {
          method: "GET",
          credentials: "same-origin", // 确保发送cookies/session
        });

        // 检查响应状态
        if (!response.ok) {
          if (response.status === 401) {
            console.log("用户未登录，使用默认用户配置");
            // 用户未登录，使用默认用户配置
            await setCurrentUser(1, 0, "访客用户");
            return;
          }
          const errorText = await response.text();
          console.error("获取用户信息失败:", response.status, errorText);
          throw new Error(
            `获取用户信息失败: ${response.status} - ${errorText}`
          );
        }

        // 检查响应内容类型
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const responseText = await response.text();
          console.error("服务器返回非JSON格式:", responseText);
          throw new Error("服务器返回了非JSON格式的数据");
        }

        const userData = await response.json();
        console.log("用户数据:", userData);

        // 验证返回的数据结构
        if (!userData || typeof userData !== "object") {
          throw new Error("服务器返回的用户数据格式不正确");
        }

        if (userData.status === "error") {
          throw new Error(userData.message || "获取用户信息失败");
        }

        // 使用从后端获取的数据设置当前用户
        await setCurrentUser(
          userData["uid"],
          userData["utype"],
          userData["username"]
        );

        console.log("用户初始化成功:", {
          uid: userData["uid"],
          utype: userData["utype"],
          username: userData["username"],
        });
      } catch (error) {
        console.error("用户初始化失败:", error);
        // 如果用户初始化失败，可以使用默认用户或者提示用户重新登录
        console.warn("使用默认用户配置继续运行");
        await setCurrentUser(1, 0, "访客用户"); // 设置默认用户
      }
    }

    // function getUserStorageKey() {
    //   return `aiChatHistory_${currentUser.uid}`;
    // }

    /**
     * 从后端加载用户的聊天历史记录
     */
    async function loadUserChatHistory() {
      if (!currentUser || !currentUser.uid) {
        console.log("无有效用户，无法加载历史记录。");
        chatHistory = {};
        loadChatHistory(); // 渲染空列表
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/users/${currentUser.uid}/history`,
          {
            credentials: "same-origin", // 确保发送session信息
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const messages = await response.json();

        // 将扁平的消息列表处理成按 session_id 分组的结构
        const historyGroups = {};
        for (const msg of messages) {
          const session_id = msg.session_id;
          if (!historyGroups[session_id]) {
            historyGroups[session_id] = {
              id: session_id,
              messages: [],
              timestamp: 0,
              title: "新对话",
            };
          }

          // 解析消息内容
          let messageData;
          try {
            messageData = JSON.parse(msg.message);
          } catch (e) {
            // 如果解析失败，创建一个基本的消息结构
            messageData = {
              role: "user",
              content: msg.message,
              timestamp: new Date(msg.created_at).getTime(),
            };
          }

          historyGroups[session_id].messages.push(messageData);

          // 更新会话的标题和时间戳
          const msgTimestamp = new Date(msg.created_at).getTime();
          if (msgTimestamp > historyGroups[session_id].timestamp) {
            historyGroups[session_id].timestamp = msgTimestamp;
          }

          // 使用第一个用户消息作为标题
          if (
            historyGroups[session_id].title === "新对话" &&
            messageData.role === "user"
          ) {
            historyGroups[session_id].title =
              messageData.content.substring(0, 30) + "...";
          }
        }

        chatHistory = historyGroups;
        loadChatHistory(); // 使用处理好的数据渲染侧边栏

        // 自动加载最新的会话
        const sessionIds = Object.keys(chatHistory);
        if (sessionIds.length > 0) {
          const latestSessionId = sessionIds.sort(
            (a, b) => chatHistory[b].timestamp - chatHistory[a].timestamp
          )[0];
          loadSessionById(latestSessionId);
        } else {
          startNewChat();
        }
      } catch (error) {
        console.error("加载用户历史记录失败:", error);
        chatHistory = {};
        loadChatHistory(); // 渲染空列表
      }
    }

    /**
     * 将单条消息保存到后端数据库
     * @param {object} messageObject - 消息对象，例如 { role: 'user', content: '你好', timestamp: 1234567890 }
     */
    async function saveMessageToBackend(messageObject) {
      console.log(currentUser, currentUser.uid, currentSessionId);
      if (!currentUser || !currentUser.uid || !currentSessionId) {
        console.warn("无法保存消息：缺少用户信息或会话ID");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/users/${currentUser.uid}/history`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              session_id: currentSessionId,
              message: JSON.stringify(messageObject), // 将消息对象转为JSON字符串存储
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const savedMessage = await response.json();
        console.log("消息已保存到后端:", savedMessage);

        // 立即更新本地历史记录
        updateLocalChatHistory(messageObject);

        // 更新历史记录显示
        updateHistoryDisplay();
      } catch (error) {
        console.error("保存消息到后端失败:", error);
      }
    }

    /**
     * 更新本地历史记录缓存
     * @param {object} messageObject - 消息对象
     */
    function updateLocalChatHistory(messageObject) {
      if (!currentSessionId) return;

      // 如果当前会话在历史记录中不存在，创建它
      if (!chatHistory[currentSessionId]) {
        chatHistory[currentSessionId] = {
          id: currentSessionId,
          messages: [],
          timestamp: Date.now(),
          title: "新对话",
        };
      }

      // 添加消息到当前会话
      chatHistory[currentSessionId].messages.push(messageObject);

      // 更新会话的时间戳
      chatHistory[currentSessionId].timestamp = messageObject.timestamp;

      // 如果是用户消息且当前会话标题还是默认的，更新标题
      if (
        messageObject.role === "user" &&
        chatHistory[currentSessionId].title === "新对话"
      ) {
        chatHistory[currentSessionId].title =
          messageObject.content.substring(0, 30) + "...";
      }
    }

    /**
     * 更新历史记录显示
     */
    function updateHistoryDisplay() {
      // 只在全屏模式下更新历史记录显示
      if (isFullscreenOpen) {
        loadChatHistory();
        updateHistorySelection(currentSessionId);
      }
    }

    // 主题切换
    function initializeTheme() {
      const savedTheme = localStorage.getItem("theme") || "light";
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    // UI 切换
    window.toggleMiniChat = function () {
      isMiniChatOpen = !isMiniChatOpen;
      const miniChat = getEl("aiMiniChat");
      const button = getEl("aiButton");
      if (isMiniChatOpen) {
        miniChat.classList.add("active");
        button.classList.add("active");
        getEl("aiBadge").classList.add("hidden");
        if (getEl("aiMiniMessages").children.length <= 2) {
          getEl("miniExampleQuestions").style.display = "block";
        }
        setTimeout(() => getEl("aiMiniInput")?.focus(), 300);
      } else {
        miniChat.classList.remove("active");
        button.classList.remove("active");
      }
    };

    //全屏
    window.openFullscreen = function () {
      isFullscreenOpen = true;
      getEl("aiModal").classList.add("active");
      if (!currentSessionId) startNewChat();
      else loadSessionById(currentSessionId);
      loadChatHistory();
      if (isMiniChatOpen) toggleMiniChat();
      document.body.style.overflow = "hidden";
    };

    window.closeFullscreen = function () {
      isFullscreenOpen = false;
      getEl("aiModal").classList.remove("active");
      document.body.style.overflow = "";
    };

    window.toggleSidebar = function () {
      isSidebarOpen = !isSidebarOpen;
      getEl("aiSidebar").classList.toggle("hidden", !isSidebarOpen);
    };

    //处理按钮
    window.handleHeaderButtonClick = function (event, actionName) {
      event.stopPropagation();
      switch (actionName) {
        case "toggleSidebar":
          toggleSidebar();
          break;
        case "exportAllHistory":
          exportAllHistory();
          break;
        case "closeFullscreen":
          closeFullscreen();
          break;
      }
    };

    // 消息处理
    window.sendFullMessage = async function () {
      const input = getEl("aiFullInput");
      const message = input.value.trim();
      if (!message && currentFiles.length === 0) return;

      // 创建文件副本用于发送
      const filesToSend = [...currentFiles];

      if (message) {
        addFullMessage(message, "user");
        getEl("exampleQuestions").style.display = "none";
      }
      filesToSend.forEach((file) => addFullFileMessage(file, "user"));
      input.value = "";
      adjustTextareaHeight(input);
      clearUploadedFiles();
      showTypingIndicator();
      try {
        const aiResponse = await generateAIResponseWithFiles(
          message,
          filesToSend
        );
        hideTypingIndicator();
        addFullMessage(aiResponse, "ai");
        // 消息已经在addFullMessage中自动保存到后端
      } catch (error) {
        console.error("发送消息失败:", error);
        hideTypingIndicator();

        // 根据错误类型提供不同的错误信息
        let errorMessage = "抱歉，AI服务暂时不可用。";
        if (error.message.includes("无法连接到Ollama")) {
          errorMessage =
            "❌ " +
            error.message +
            "\n\n请检查：\n1. Ollama是否已安装并运行\n2. 服务地址是否正确\n3. 网络连接是否正常";
        } else if (error.message.includes("Ollama API调用失败")) {
          errorMessage =
            "❌ " + error.message + "\n\n请检查Ollama服务状态和模型是否可用。";
        }

        addFullMessage(errorMessage, "ai");
      }
    };

    window.sendMiniMessage = async function () {
      const input = getEl("aiMiniInput");
      const message = input.value.trim();
      if (!message) return;

      // 如果没有当前会话，创建一个新会话
      if (!currentSessionId) {
        currentSessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        console.log("Mini chat创建新会话:", currentSessionId);
      }

      getEl("miniExampleQuestions").style.display = "none";
      addMiniMessage(message, "user");
      input.value = "";
      try {
        const aiResponse = await generateAIResponse(message);
        addMiniMessage(aiResponse, "ai");
        // 消息已经在addMiniMessage中自动保存到后端
      } catch (error) {
        console.error("发送消息失败:", error);
        let errorMessage = "抱歉，AI服务暂时不可用。";
        if (error.message.includes("无法连接到Ollama")) {
          errorMessage = "❌ 无法连接到Ollama服务";
        }
        addMiniMessage(errorMessage, "ai");
      }
    };

    window.selectMiniExampleQuestion = function (button) {
      const question = button.getAttribute("data-question");
      getEl("aiMiniInput").value = question;
      getEl("miniExampleQuestions").style.display = "none";
      getEl("aiMiniInput").focus();
      setTimeout(() => sendMiniMessage(), 200);
    };

    window.selectExampleQuestion = function (button) {
      const question = button.getAttribute("data-question");
      const input = getEl("aiFullInput");
      input.value = question;
      adjustTextareaHeight(input);
      getEl("exampleQuestions").style.display = "none";
      input.focus();
    };

    function addFullMessage(content, sender) {
      const container = getEl("aiFullMessages");
      const msgEl = createMessageElement(content, sender, "user");
      container.appendChild(msgEl);
      scrollToBottom("aiFullMessages");
      lucide.createIcons();

      // 保存消息到后端
      const messageObject = {
        role: sender,
        content: content,
        timestamp: Date.now(),
      };
      saveMessageToBackend(messageObject);
    }

    function addMiniMessage(content, sender) {
      const container = getEl("aiMiniMessages");
      const msgEl = createMessageElement(content, sender, "mini");
      container.appendChild(msgEl);
      scrollToBottom("aiMiniMessages");
      lucide.createIcons();

      // 保存消息到后端
      const messageObject = {
        role: sender,
        content: content,
        timestamp: Date.now(),
      };
      saveMessageToBackend(messageObject);
    }

    function createMessageElement(content, sender, type) {
      const wrapper = document.createElement("div");
      wrapper.className = `message ${sender}`;
      const avatarIcon =
        sender === "user"
          ? `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"></circle><path d="M5.5 21v-2.5c0-2.25 3.82-4.5 6.5-4.5s6.5 2.25 6.5 4.5V21"></path></svg>`
          : `<img class="icon-avatar" src="/static/img/chat-ui-svgrepo-com.svg" alt="AgriGik"/>`;

      wrapper.innerHTML = `
                <div class="message-avatar ${sender}">${avatarIcon}</div>
                <div class="message-content">${parseMarkdown(content)}</div>`;
      return wrapper;
    }

    function showTypingIndicator() {
      const container = getEl("aiFullMessages");
      const indicator = document.createElement("div");
      indicator.className = "message ai";
      indicator.id = "typingIndicator";
      indicator.innerHTML = `<div class="message-avatar ai"><img class="icon-avatar" src="/static/img/chat-ui-svgrepo-com.svg" alt="AgriGik"/></div><div class="message-content"><div class="loading-dots"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div></div>`;
      container.appendChild(indicator);
      scrollToBottom("aiFullMessages");
    }

    function hideTypingIndicator() {
      getEl("typingIndicator")?.remove();
    }

    // 文件处理
    window.handleFullFileUpload = function (event) {
      const files = event.target.files;
      if (files && files.length > 0) {
        addFilesToUploadList(files);
        // 重置文件input以允许重复上传相同文件
        event.target.value = "";
      }
    };

    function addFilesToUploadList(files) {
      const container = getEl("aiUploadedFiles");
      for (let file of files) {
        currentFiles.push(file);
        const fileDiv = document.createElement("div");
        fileDiv.className = "file-item";
        fileDiv.setAttribute("data-filename", file.name);

        // 创建文件信息部分
        const fileInfo = document.createElement("div");
        fileInfo.className = "file-info";
        fileInfo.innerHTML = `
          <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          <span class="file-name">${file.name}</span>
        `;

        // 创建删除按钮
        const removeBtn = document.createElement("button");
        removeBtn.className = "file-remove";
        removeBtn.title = "删除文件";
        removeBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        `;

        // 绑定删除事件
        removeBtn.addEventListener("click", () => {
          removeFile(removeBtn, file.name);
        });

        fileDiv.appendChild(fileInfo);
        fileDiv.appendChild(removeBtn);
        container.appendChild(fileDiv);
      }

      // 重新初始化图标
      if (window.lucide) {
        lucide.createIcons();
      }
    }
    window.removeFile = function (button, fileName) {
      // 从文件数组中移除
      currentFiles = currentFiles.filter((f) => f.name !== fileName);

      // 从DOM中移除文件项
      const fileItem = button.closest(".file-item");
      if (fileItem) {
        fileItem.remove();
      }

      console.log(`文件 "${fileName}" 已删除`);
    };
    function clearUploadedFiles() {
      currentFiles = [];
      getEl("aiUploadedFiles").innerHTML = "";
    }
    function addFullFileMessage(file, sender) {
      addFullMessage(`📁 已上传文件: ${file.name}`, sender);
    }

    // 会话管理
    window.startNewChat = function () {
      // 生成新的会话ID
      currentSessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // 清空界面
      clearUploadedFiles();
      getEl("aiFullMessages").innerHTML = getEl("exampleQuestions").outerHTML;

      // 添加欢迎消息
      const welcomeMsg = createMessageElement(
        "👋 您好！我是谷稷，有什么农业问题可以帮助您解答？",
        "ai"
      );
      getEl("aiFullMessages").prepend(welcomeMsg);
      lucide.createIcons();

      // 创建新会话的历史记录条目
      if (!chatHistory[currentSessionId]) {
        chatHistory[currentSessionId] = {
          id: currentSessionId,
          messages: [],
          timestamp: Date.now(),
          title: "新对话",
        };
      }

      // 刷新历史记录列表
      updateHistoryDisplay();

      console.log("新会话已创建:", currentSessionId);
    };

    /**
     * 根据会话ID加载会话内容
     * @param {string} sessionId - 会话ID
     */
    window.loadSessionById = function (sessionId) {
      if (!chatHistory[sessionId]) {
        console.error("会话不存在:", sessionId);
        return;
      }

      const session = chatHistory[sessionId];
      currentSessionId = sessionId;

      // 清空当前消息容器
      const container = getEl("aiFullMessages");
      container.innerHTML = getEl("exampleQuestions").outerHTML;

      // 重新渲染历史消息
      session.messages.forEach((msg) => {
        const msgEl = createMessageElement(msg.content, msg.role, "user");
        container.appendChild(msgEl);
      });

      scrollToBottom("aiFullMessages");
      lucide.createIcons();
      updateHistorySelection(sessionId);

      console.log("会话已加载:", sessionId);
    };

    /**
     * 加载并显示聊天历史记录列表
     */
    function loadChatHistory() {
      const container = getEl("aiHistoryList");
      container.innerHTML = "";

      // 将chatHistory对象转换为数组并按时间戳排序
      const sessions = Object.values(chatHistory).sort(
        (a, b) => b.timestamp - a.timestamp
      );

      sessions.forEach((session) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.dataset.sessionId = session.id;
        if (session.id === currentSessionId) {
          item.classList.add("active");
        }

        item.innerHTML = `
          <div class="history-content" onclick="loadSessionById('${
            session.id
          }')">
            <div class="history-title-row">
              <div class="history-title truncate">${session.title}</div>
            </div>
            <div class="history-date">${formatDate(session.timestamp)}</div>
          </div>
          <div class="history-actions">
            <button class="history-action-btn delete" 
                    onclick="event.stopPropagation(); deleteSession('${
                      session.id
                    }')" 
                    title="删除">
              <svg class="w-3 h-3 icon" viewBox="0 0 24 24">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              </svg>
            </button>
          </div>
        `;

        container.appendChild(item);
      });
    }

    /**
     * 更新历史记录选中状态
     * @param {string} sessionId - 会话ID
     */
    function updateHistorySelection(sessionId) {
      Array.from(getEl("aiHistoryList").children).forEach((item) => {
        item.classList.toggle("active", item.dataset.sessionId === sessionId);
      });
    }

    /**
     * 删除指定会话
     * @param {string} sessionId - 会话ID
     */
    window.deleteSession = async function (sessionId) {
      if (!confirm("确定要删除这个对话吗？")) return;
      try {
        // 从后端删除会话
        const response = await fetch(
          `${API_URL}/users/${currentUser.uid}/sessions/${sessionId}`,
          {
            method: "DELETE",
            credentials: "same-origin",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 从本地缓存中删除
        delete chatHistory[sessionId];

        // 如果删除的是当前会话，创建新会话
        if (sessionId === currentSessionId) {
          currentSessionId = null;
          startNewChat();
        }

        // 刷新历史记录列表
        loadChatHistory();

        console.log("会话已删除:", sessionId);
      } catch (error) {
        console.error("删除会话失败:", error);
        alert("删除会话失败，请重试");
      }
    };

    /**
     * 清空所有历史记录
     */
    window.clearAllHistory = async function () {
      if (!confirm("确定要清空所有历史记录吗？此操作不可撤销！")) return;

      try {
        // 从后端删除所有历史记录
        const response = await fetch(
          `${API_URL}/users/${currentUser.uid}/history`,
          {
            method: "DELETE",
            credentials: "same-origin",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 清空本地缓存
        chatHistory = {};
        currentSessionId = null;

        // 创建新会话
        startNewChat();

        console.log("所有历史记录已清空");
      } catch (error) {
        console.error("清空历史记录失败:", error);
        console.log("清空历史记录失败，请重试");
      }
    };

    /**
     * 导出所有历史记录
     */
    window.exportAllHistory = function () {
      try {
        // 将对象格式的历史记录转换为更友好的导出格式
        const exportData = {
          user: currentUser,
          exportTime: new Date().toISOString(),
          sessions: Object.values(chatHistory).map((session) => ({
            sessionId: session.id,
            title: session.title,
            timestamp: session.timestamp,
            date: new Date(session.timestamp).toLocaleString("zh-CN"),
            messages: session.messages,
          })),
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `ai_chat_history_${
          currentUser.username
        }_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);

        console.log("历史记录已导出");
      } catch (error) {
        console.error("导出历史记录失败:", error);
        swal("导出历史记录失败，请重试");
      }
    };

    // 工具函数
    function scrollToBottom(id) {
      getEl(id).scrollTop = getEl(id).scrollHeight;
    }
    function adjustTextareaHeight(el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
    }
    function parseMarkdown(text) {
      // 确保text是字符串
      if (typeof text !== "string") {
        return String(text);
      }

      // 处理段落分割
      let paragraphs = text.split("\n\n");

      paragraphs = paragraphs.map((paragraph) => {
        // 跳过空段落
        if (!paragraph.trim()) return "";

        // 代码块处理 (```code```)
        paragraph = paragraph.replace(
          /```(\w+)?\n?([\s\S]*?)```/g,
          (match, lang, code) => {
            const language = lang || "text";
            return `<pre class="ai-code-block"><code class="language-${language}">${escapeHtml(
              code.trim()
            )}</code></pre>`;
          }
        );

        // 行内代码处理 (`code`)
        paragraph = paragraph.replace(
          /`([^`\n]+)`/g,
          '<code class="ai-inline-code">$1</code>'
        );

        // 标题处理
        paragraph = paragraph.replace(
          /^### (.*$)/gm,
          '<h3 class="ai-heading ai-h3">$1</h3>'
        );
        paragraph = paragraph.replace(
          /^## (.*$)/gm,
          '<h2 class="ai-heading ai-h2">$1</h2>'
        );
        paragraph = paragraph.replace(
          /^# (.*$)/gm,
          '<h1 class="ai-heading ai-h1">$1</h1>'
        );

        // 粗体和斜体
        paragraph = paragraph.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="ai-bold">$1</strong>'
        );
        paragraph = paragraph.replace(
          /\*(.*?)\*/g,
          '<em class="ai-italic">$1</em>'
        );

        // 链接处理
        paragraph = paragraph.replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" class="ai-link">$1</a>'
        );

        // 引用块处理
        paragraph = paragraph.replace(
          /^> (.*)$/gm,
          '<blockquote class="ai-blockquote">$1</blockquote>'
        );

        // 分割线处理
        paragraph = paragraph.replace(/^---$/gm, '<hr class="ai-divider">');

        // 无序列表处理
        let lines = paragraph.split("\n");
        let inList = false;
        let listItems = [];
        let processedLines = [];

        for (let line of lines) {
          if (line.match(/^[\*\-\+] /)) {
            if (!inList) {
              inList = true;
              listItems = [];
            }
            listItems.push(line.replace(/^[\*\-\+] /, ""));
          } else if (line.match(/^\d+\. /)) {
            if (!inList) {
              inList = true;
              listItems = [];
            }
            listItems.push({
              ordered: true,
              text: line.replace(/^\d+\. /, ""),
            });
          } else {
            if (inList) {
              // 结束列表
              const isOrdered = listItems.length > 0 && listItems[0].ordered;
              const listTag = isOrdered ? "ol" : "ul";
              const listClass = isOrdered ? "ai-ordered-list" : "ai-list";
              const itemClass = isOrdered ? "ai-ordered-item" : "ai-list-item";

              let listHtml = `<${listTag} class="${listClass}">`;
              listItems.forEach((item) => {
                const itemText = typeof item === "string" ? item : item.text;
                listHtml += `<li class="${itemClass}">${itemText}</li>`;
              });
              listHtml += `</${listTag}>`;

              processedLines.push(listHtml);
              inList = false;
              listItems = [];
            }
            if (line.trim()) {
              processedLines.push(line);
            }
          }
        }

        // 处理剩余的列表项
        if (inList && listItems.length > 0) {
          const isOrdered = listItems.length > 0 && listItems[0].ordered;
          const listTag = isOrdered ? "ol" : "ul";
          const listClass = isOrdered ? "ai-ordered-list" : "ai-list";
          const itemClass = isOrdered ? "ai-ordered-item" : "ai-list-item";

          let listHtml = `<${listTag} class="${listClass}">`;
          listItems.forEach((item) => {
            const itemText = typeof item === "string" ? item : item.text;
            listHtml += `<li class="${itemClass}">${itemText}</li>`;
          });
          listHtml += `</${listTag}>`;

          processedLines.push(listHtml);
        }

        paragraph = processedLines.join("\n");

        // 换行处理
        paragraph = paragraph.replace(/\n/g, "<br>");

        // 如果不是标题、列表、代码块或引用，包装为段落
        if (!paragraph.match(/^<(h[1-6]|ul|ol|pre|blockquote|hr)/)) {
          paragraph = `<p>${paragraph}</p>`;
        }

        return paragraph;
      });

      return paragraphs.filter((p) => p.trim()).join("");
    }

    // HTML转义函数
    function escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
    function formatDate(timestamp) {
      const date = new Date(timestamp);
      const diffMins = Math.floor((Date.now() - date) / 60000);
      if (diffMins < 1) return "刚刚";
      if (diffMins < 60) return `${diffMins}分钟前`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
      return date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      });
    }

    // Ollama API 调用
    function getSystemPromptByUserType(utype) {
      const prompts = {
        0: `<prompt>

<role_definition>
    <name>谷稷</name>
    <identity>你是一个能看懂图片、会分析问题的智慧农业助手，专门服务于中国的一线农民朋友。</identity>
    <core_values>
        - **用户至上**: 我的存在就是为了让乡亲们省心省力，多打粮食。我的回答必须100%站在他们的角度。
        - **绝对通俗**: 说的每一句话都要保证田间地头的伯伯阿姨们听得懂、用得上。绝不讲任何他们听不懂的词。
        - **实用第一**: 不说空话理论，只给能直接上手操作的实用办法。
        - **眼见为实**: 如果有图片，必须先仔细看图，根据图片里的情况来分析问题。
    </core_values>
</role_definition>

<behavioral_guidelines>
    <language_rules>
        - **纯中文**: 全程必须只使用简体中文，禁止出现任何英文、拼音或繁体字。
        - **口语化**: 使用大白话，可以带有一些亲切的语气词，如“呀”、“呢”、“啦”。但要用"我"来自称.
        - **贴心小助手**: 语气温和,就像一位有智慧的朋友般.
    </language_rules>
    <knowledge_domain>
        - **允许范围**: 只能回答和农业生产直接相关的问题，包括农作物种植、病虫害防治、土壤、施肥、养殖、农产品行情等。
        - **禁止范围**: 绝对不能回答任何与农业无关的问题。如果被问到，必须按固定话术回应：“哎呀，这个问题可难住我啦，我是专门帮大家搞种植养殖的，别的事儿就不懂了。”
    </knowledge_domain>
</behavioral_guidelines>

<execution_protocol>
    <thought_process>
        在生成最终回答前，你必须在内心遵循以下思考步骤：
        1.  **分析问题**: 用户问的到底是什么事？最关心的点是什么？
        2.  **构思方案**: 针对这个问题，最简单、最省钱、最管用的办法有哪几种？（最好物理方法和农药方法都想想）
        3.  **语言转化**: 我该怎么用大白话把这些办法说明白？怎么说才能让对方一听就懂，不会搞错？
    </thought_process>
    <output_format>
        - 直接回答核心问题，先给结论。
        - 然后分点说明具体怎么做，步骤要清晰。
        - 如果提到病虫害，必须先描述它的样子（比如多大、什么颜色、长在哪）。
    </output_format>
</execution_protocol>

<golden_example>
    <user_input>
    我家棉花叶子上好多白色的小飞虫，一碰就乱飞，叶子背面还有些发黄，这是啥虫？咋治？
    </user_input>
    <model_output>
    朋友你别急，听你这么一说，这八成是**白粉虱**，就是那种白色的小飞蛾子！这虫子最烦人了，吸棉花的汁液，还会让叶子变黄。

    给你两个法子治它：

    1.  **省钱的法子**：你去弄几张黄色的粘虫板，就挂在棉花杆子中间，比叶子高一点就行。白粉虱就喜欢黄色，自己就飞上去粘住了。这个法子最安全，没坏处。

    2.  **见效快的法子**：如果虫子太多了，就得打药了。你去农药店买**吡虫啉**或者**啶虫脒**，这两种药都行。按照说明书上的量兑水，然后主要往棉花叶子的背面喷，因为这虫子和它的卵都藏在叶子背面。最好是早上或者傍晚，天不太热的时候喷。
    </model_output>
</golden_example>

</prompt>`,
        1: `<prompt>

<role_definition>
    <name>谷稷 (AgriGik)</name>
    <identity>你是一个高级多模态智慧农业AI，能够对用户提供的图像和文本进行联合分析，生成专家级的技术诊断报告。</identity>
    <core_principles>
        - **视觉优先 (Visual-First)**: 图像是核心证据。你的分析必须从视觉观察出发，并以视觉特征作为立论的基础。
        - **逻辑推理 (Logical Reasoning)**: 严格遵循内部思考流程，从现象到假设，再到验证和结论，构建一个完整的、可追溯的逻辑链。
        - **知识融合 (Knowledge Fusion)**: 将从图像中提取的视觉证据与你内置的农业科学知识库（植物病理学、生理学、昆虫学等）进行深度融合，以得出科学的结论。
    </core_principles>
</role_definition>

<execution_protocol>    
    <language_rules>
        - **专业术语**: 必须使用精确的专业术语。首次出现时，遵循“英文术语 (中文翻译)”格式，例如 'Photosynthesis (光合作用)'。
        - **语言**: 以严谨的简体中文书面语为主。
    </language_rules>
    <internal_thought_process>
        在生成回答前，你必须严格遵循以下多模态思维链：
        1.  **视觉特征提取 (Visual Feature Extraction)**: 这是首要步骤。对用户提供的图像进行系统性分析。
            - *宏观层面 (如田间照片)*: 识别空间分布模式（如随机、聚集）、颜色异常区域、植株整体长势等。
            - *微观层面 (如叶片、镜检图)*: 识别病斑的形态（形状、颜色、边缘特征、有无轮纹）、病征（霉层、菌脓、孢子形态）、害虫的形态特征等。
        2.  **文本信息解析 (Textual Information Parsing)**: 解析用户的文字提问，提取关键信息，如作物种类、地理位置、近期管理措施、问题描述等。
        3.  **图文信息融合与假设生成 (Multimodal Fusion & Hypothesis Generation)**: 结合视觉证据和文本信息，生成1-3个最有可能的科学假设。例如：
            - *假设A*: 可能是由真菌引起的角斑病，因为病斑呈多角形且受叶脉限制。
            - *假设B*: 也可能是缺镁，因为黄化模式呈现肋间失绿。
        4.  **假设验证与排除 (Hypothesis Verification & Elimination)**: 逐一评估每个假设。利用你的专业知识，寻找支持或反对该假设的决定性证据。例如：“虽然有黄化，但图像中病斑边缘有明显的坏死区域，这与单纯的营养缺乏症状不符，因此排除假设B。”
        5.  **结论综合与报告生成 (Conclusion Synthesis & Report Generation)**: 确定最可信的诊断结论，并按照下方的强制输出结构，将整个分析和推理过程组织成一份条理清晰的报告。
    </internal_thought_process>
    
    <mandatory_output_structure>
        你的回答必须严格遵循以下结构，并使用Markdown标题：
        
        ### 1. 核心诊断 (Executive Diagnosis)
           直接给出最可能的诊断结论。
        
        ### 2. 视觉证据分析 (Visual Evidence Analysis)
           详细描述你在图像中观察到的关键视觉特征，并解释这些特征的病理学或生理学意义。这是支撑你诊断结论的核心依据。
        
        ### 3. 诊断推理过程 (Diagnostic Reasoning)
           展示你的思维链。说明你如何基于视觉和文本信息提出假设，并如何进行验证和排除，最终得出结论。
        
        ### 4. 技术建议 (Technical Recommendations)
           基于诊断结论，提供防治、管理或进一步检测的专业建议。
        
        ### 5. 鉴别诊断 (Differential Diagnosis)
           简要提及一些可能混淆的类似问题，并说明如何根据关键特征将它们与最终诊断区分开。
    </mandatory_output_structure>
</execution_protocol>

<golden_example>
    <user_input>
    [图片：一张番茄叶片的显微镜照片，显示出同心轮纹的圆形褐色病斑，病斑上有黑色小点]
    
    这是我们实验室温室栽培的番茄叶片，品种为'中杂9号'。近期湿度较高，叶片出现这些病斑。请进行诊断并提供分析报告。
    </user_input>
    
    <model_output>
    ### 1. 核心诊断 (Executive Diagnosis)
    根据提供的显微图像及描述，初步诊断为**番茄早疫病 (Tomato Early Blight)**，病原为茄链格孢菌 (Alternaria solani)。

    ### 2. 视觉证据分析 (Visual Evidence Analysis)
    图像分析揭示了以下关键病理学特征：
    - **病斑形态**: 病斑呈圆形至近圆形，颜色为深褐色。
    - **典型病征**: 病斑上具有非常清晰的、深浅相间的**同心轮纹 (Concentric Rings)**，这是番茄早疫病的典型特征，形似靶心。
    - **产孢结构**: 在病斑的深色轮纹上，可见大量黑色小点，这些是病原菌的分生孢子梗和分生孢子。

    ### 3. 诊断推理过程 (Diagnostic Reasoning)
    我的诊断流程如下：
    1.  **初步观察**: 图像显示了具有同心轮纹的坏死性病斑。文本信息指明作物为番茄，环境湿度高。
    2.  **假设生成**: 基于“番茄”+“叶片病斑”+“同心轮纹”这三个核心特征，我生成了首要假设：番茄早疫病。同时，考虑了其他可能引起叶斑的病害作为备选假设，如叶霉病、斑枯病等。
    3.  **假设验证**: 番茄叶霉病主要在叶背产生霉层，斑枯病病斑中央呈灰白色且散生小黑点，这都与图像中的“靶轮状”同心轮纹特征不符。图像中的特征与早疫病的典型病征高度匹配。结合文本中“湿度较高”的环境条件，这为喜湿的链格孢菌侵染创造了有利条件。因此，最终确认诊断为早疫病。

    ### 4. 技术建议 (Technical Recommendations)
    1.  **环境调控**: 立即降低温室湿度，加强通风，是控制病害发展的关键。
    2.  **化学防治**: 可选用保护性杀菌剂如**代森锰锌**或**百菌清**进行初期预防；在发病初期，应立即喷洒内吸治疗性杀菌剂，如**苯醚甲环唑**、**嘧菌酯**或**异菌脲**。建议交替使用不同作用机理的药剂，以延缓抗药性。
    3.  **农业防治**: 及时清除并销毁病残体，减少初侵染源。实行与非茄科作物轮作。

    ### 5. 鉴别诊断 (Differential Diagnosis)
    - **与晚疫病的区别**: 晚疫病病斑边缘不清晰，呈水浸状，湿度大时叶背或叶面会长出白色霉层，且没有同心轮纹。
    - **与靶斑病的区别**: 靶斑病病斑也可能出现轮纹，但通常更小，且穿孔倾向更明显。早疫病的轮纹和“靶心”特征更为典型。
    </model_output>
</golden_example>

</prompt>
`,
      };
      return prompts[utype] || prompts[0];
    }

    async function callOllamaAPI(message, utype = 0, images = null) {
      console.log("🚀 调用Ollama API:", {
        url: `${OLLAMA_CONFIG.baseUrl}/api/generate`,
        model: OLLAMA_CONFIG.model,
        message: message,
        hasImages: images && images.length > 0,
      });

      console.log(message);

      const requestBody = {
        model: OLLAMA_CONFIG.model,
        system: getSystemPromptByUserType(utype),
        prompt: message,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
        },
      };

      // 如果有图片，添加到请求体中
      if (images && images.length > 0) {
        requestBody.images = images;
      }

      try {
        const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("📡 Ollama响应状态:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Ollama API错误:", errorText);
          throw new Error(
            `Ollama API调用失败: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        console.log("✅ Ollama响应数据:", data);

        return data.response || "抱歉，AI助手暂时无法回复。";
      } catch (error) {
        console.error("❌ Ollama API调用异常:", error);

        // 如果是网络错误，提供更友好的错误信息
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          throw new Error(
            "无法连接到Ollama服务，请确保Ollama服务正在运行并监听在 " +
              OLLAMA_CONFIG.baseUrl
          );
        }

        throw error;
      }
    }

    async function generateAIResponse(message) {
      return await callOllamaAPI(message, currentUser.utype);
    }
    async function generateAIResponseWithFiles(message, files) {
      console.log("📎 处理文件:", files.length, "个文件");

      const imagePromises = files
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => {
          console.log("🖼️ 处理图片文件:", file.name);
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(",")[1];
              console.log(
                "✅ 图片转换完成:",
                file.name,
                "大小:",
                base64.length
              );
              resolve(base64);
            };
            reader.onerror = (error) => {
              console.error("❌ 图片读取失败:", file.name, error);
              reject(error);
            };
            reader.readAsDataURL(file);
          });
        });

      const base64Images = await Promise.all(imagePromises);
      console.log("📸 图片处理完成，共", base64Images.length, "张图片");

      return await callOllamaAPI(message, currentUser.utype, base64Images);
    }

    // --- 初始化和事件监听 ---
    // 初始化图标库
    if (window.lucide) {
      lucide.createIcons();
    }

    // 初始化用户系统
    initializeUser();
    // 初始化主题
    initializeTheme();

    // 绑定全局事件
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (!isFullscreenOpen) openFullscreen();
      }
      if (e.key === "Escape") {
        if (isFullscreenOpen) closeFullscreen();
        else if (isMiniChatOpen) toggleMiniChat();
      }
    });
    window.addEventListener("beforeunload", () => {
      // 页面卸载时的清理工作，如果需要的话
      console.log("页面即将关闭");
    });

    // 绑定UI元素事件
    getEl("aiFullInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendFullMessage();
      }
    });
    getEl("aiFullInput")?.addEventListener("input", (e) =>
      adjustTextareaHeight(e.target)
    );
    getEl("aiMiniInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMiniMessage();
      }
    });

    // 文件上传相关事件
    const uploadArea = getEl("aiUploadArea");
    const fileInput = getEl("fullFileInput");
    const uploadBtn = getEl("fileUploadBtn");

    if (uploadArea && fileInput) {
      // 点击上传区域触发文件选择
      uploadArea.addEventListener("click", (e) => {
        e.preventDefault();
        fileInput.click();
      });

      // 拖拽上传功能
      uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("dragover");
      });
      uploadArea.addEventListener("dragleave", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");
      });
      uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          addFilesToUploadList(files);
        }
      });

      // 文件选择变化事件
      fileInput.addEventListener("change", handleFullFileUpload);
    }

    // 上传按钮点击事件
    if (uploadBtn) {
      uploadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });
    }

    console.log("AI 助手插件初始化完成。");
  }

  // --- 8. 启动插件 ---
  // 等待DOM加载完毕后执行注入
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePlugin);
  } else {
    initializePlugin();
  }
})();

/*
Well, going from simply making an AI assistant plugin
to involving a full-stack application has indeed been quite an interesting journey.:)
*/

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
    console.warn("AI 助手插件已经加载。");
    return;
  }

  // --- 2. 默认配置 ---
  const defaultConfig = {
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "AgriGik",
    lucideIconUrl: "https://unpkg.com/lucide@latest/dist/umd/lucide.js",
  };

  // 合并用户在 window.AI_PLUGIN_CONFIG 中提供的自定义配置
  const userConfig = window.AI_PLUGIN_CONFIG || {};
  const config = { ...defaultConfig, ...userConfig };

  // --- 3. 定义插件的CSS样式 (来自 styles.css) ---
  const widgetCSS = `
    /* CSS 变量定义 */
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
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; text-decoration: none; outline: none; }
    .btn-primary { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6); }
    .btn-secondary { background: rgba(255, 255, 255, 0.9); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    .btn-secondary:hover { background: #10b981; color: white; }
    .btn-sm { padding: 8px 16px; font-size: 12px; border-radius: 8px; }
    .btn-floating { position: fixed; bottom: 24px; right: 24px; height: 56px; min-width: 56px; padding: 0 20px; border-radius: 28px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; border: none; cursor: pointer; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2); transition: all 0.3s ease; z-index: 9999; display: flex; align-items: center; justify-content: center; gap: 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 500; font-size: 14px; overflow: hidden; backdrop-filter: blur(10px); }
    .floating-content { display: flex; align-items: center; justify-content: center; gap: 10px; position: relative; z-index: 10; }
    .floating-icon { width: 20px; height: 20px; filter: brightness(0) invert(1); flex-shrink: 0; }
    .floating-text { font-weight: 600; letter-spacing: 0.025em; white-space: nowrap; }
    .btn-floating:hover { transform: scale(1.05); box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3); background: linear-gradient(135deg, #374151 0%, #4b5563 100%); }
    .btn-floating.active { transform: scale(0.95); }
    .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 28px; background: rgba(31, 41, 55, 0.3); animation: pulse-ring-anim 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
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
    .message.user { flex-direction: row-reverse; align-self: flex-end; }
    .message-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; font-weight: 600; position: relative; overflow: hidden; }
    .message-avatar.user { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; }
    .message-avatar.ai { background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); color: white; }
    .message-content { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.4; word-wrap: break-word; }
    .message.user .message-content { background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); color: white; border-bottom-right-radius: 4px; }
    .message.ai .message-content { background: #f8f9fa; color: #2d3748; border-bottom-left-radius: 4px; }
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
    .sidebar { width: 300px; background: white; border-right: 1px solid rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; transition: all 0.3s ease; }
    .sidebar.hidden { width: 0; overflow: hidden; }
    .sidebar-header { padding: 24px; border-bottom: 1px solid rgba(0, 0, 0, 0.1); }
    .sidebar-content { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
    .sidebar-content::-webkit-scrollbar { width: 6px; }
    .sidebar-content::-webkit-scrollbar-thumb { background: rgba(102, 126, 234, 0.3); border-radius: 3px; }
    .history-item { position: relative; overflow: hidden; border-radius: 12px; transition: all 0.2s ease; margin-bottom: 8px; border: 1px solid transparent; display: flex; align-items: center; justify-content: space-between; }
    .history-content { flex: 1; padding: 16px; cursor: pointer; min-width: 0; }
    .history-title-row { display: flex; align-items: center; gap: 6px; }
    .pin-icon { flex-shrink: 0; }
    .history-actions { display: flex; flex-direction: column; gap: 4px; padding: 8px; opacity: 0; transition: opacity 0.2s ease; }
    .history-item:hover .history-actions { opacity: 1; }
    .history-action-btn { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.1); color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
    .history-action-btn:hover { background: rgba(16, 185, 129, 0.2); color: #10b981; transform: scale(1.1); }
    .history-action-btn.delete:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .history-item.active { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; }
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
    .file-icon { width: 24px; height: 24px; color: #667eea; }
    .file-name { font-size: 14px; color: #2d3748; font-weight: 500; }
    .file-remove { width: 24px; height: 24px; border-radius: 50%; border: none; background: #fed7d7; color: #e53e3e; cursor: pointer; transition: all 0.2s ease; }
    .notification-badge { position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; background: #e53e3e; color: white; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid white; }
    .loading-dots { display: inline-flex; gap: 4px; }
    .loading-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: loading-bounce-anim 1.4s infinite both; }
    .loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes loading-bounce-anim { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    .hidden { display: none !important; }
    @media (max-width: 768px) { .sidebar { width: 280px; } .main-messages { padding: 20px; } }
    `;

  // --- 4. 定义插件的HTML结构 (来自 chatv2.html) ---
  const widgetHTML = `
      <div class="ai-assistant-widget">
        <button id="aiButton" onclick="toggleMiniChat()" class="btn-floating">
          <div class="pulse-ring"></div>
          <div class="floating-content">
            <img class="floating-icon" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUMxMC41MDEyIDIxIDkuMTAzNzYgMjAuNjM0NSA3Ljg4NDg5IDIwLjAxOEM3LjI5MTc0IDE5LjY5NzUgNi41ODQyMyAxOS42OTk3IDYuMDA0ODcgMjAuMDIxOEwzLjkzMTA0IDIxLjc5NDlDMy4xOTQ3IDIyLjQxNTYgMi4wNTEwMyAyMS44NDU5IDIuMjAyMDggMjAuOTk5OEwzLjA2NDE0IDE3LjYxMDRDMy4yMzQyIDE2Ljk1NjYgMy4wMjc3NSAxNi4yNDQ1IDIuNTQ0OTggMTUuNzYxN0MyLjEzMzU2IDE1LjM0NzcgMS44MDMyNCAxNC44MTk1IDEuNTY2MjggMTQuMjIxMkMxLjAxOTM3IDEyLjc4ODUgMSAxMS4xOTI0IDEgOC4yNUMxIDQuMjQ4NzMgNS4yNDg3MyAxIDkgMUgxOEMxOS42NTY5IDEgMjEgMi4zNDMxNSAyMSAxMVYxMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=" alt="Chat Icon"/>
            <span class="floating-text">问AI</span>
          </div>
          <div id="aiBadge" class="notification-badge hidden">1</div>
        </button>
        <div id="aiMiniChat" class="chat-container">
          <div class="chat-header">
            <div class="chat-title">
              <svg class="icon text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 12l2 2 4-4" /><path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" /><path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" /><path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3" /><path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3" /></svg>
              AI 助手
            </div>
            <div class="chat-actions">
              <button class="chat-action-btn" onclick="openFullscreen()" title="全屏模式"><svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg></button>
              <button class="chat-action-btn" onclick="toggleMiniChat()" title="关闭"><svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>
          </div>
          <div id="aiMiniMessages" class="chat-messages">
            <div class="message ai"><div class="message-avatar ai"><img class="icon text-white relative z-10" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUMxMC41MDEyIDIxIDkuMTAzNzYgMjAuNjM0NSA3Ljg4NDg5IDIwLjAxOEM3LjI5MTc0IDE5LjY5NzUgNi41ODQyMyAxOS42OTk3IDYuMDA0ODcgMjAuMDIxOEwzLjkzMTA0IDIxLjc5NDlDMy4xOTQ3IDIyLjQxNTYgMi4wNTEwMyAyMS44NDU5IDIuMjAyMDggMjAuOTk5OEwzLjA2NDE0IDE3LjYxMDRDMy4yMzQyIDE2Ljk1NjYgMy4wMjc3NSAxNi4yNDQ1IDIuNTQ0OTggMTUuNzYxN0MyLjEzMzU2IDE1LjM0NzcgMS44MDMyNCAxNC44MTk1IDEuNTY2MjggMTQuMjIxMkMxLjAxOTM3IDEyLjc4ODUgMSAxMS4xOTI0IDEgOC4yNUMxIDQuMjQ4NzMgNS4yNDg3MyAxIDkgMUgxOEMxOS42NTY5IDEgMjEgMi4zNDMxNSAyMSAxMVYxMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=" alt="Chat Icon"/></div><div class="message-content">👋 您好！我是谷稷，有什么可以帮助您的吗？</div></div>
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
          <div class="fullscreen-title"><svg class="icon-lg text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 12l2 2 4-4" /><path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" /><path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" /><path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3" /><path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3" /></svg>AI 智能助手</div>
          <div class="fullscreen-actions">
            <button onclick="handleHeaderButtonClick(event, 'toggleSidebar')" class="btn btn-secondary"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>历史记录</button>
            <button onclick="handleHeaderButtonClick(event, 'exportAllHistory')" class="btn btn-secondary"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>导出历史</button>
            <button onclick="handleHeaderButtonClick(event, 'closeFullscreen')" class="btn btn-secondary" type="button"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>关闭</button>
          </div>
        </div>
        <div class="fullscreen-content">
          <div id="aiSidebar" class="sidebar">
            <div class="sidebar-header">
              <button onclick="startNewChat()" class="btn btn-primary w-full"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>新建对话</button>
              <div class="sidebar-menu"><button onclick="clearAllHistory()" class="btn btn-secondary btn-sm w-full mt-2" title="清空所有历史记录"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3,6 5,6 21,6"></polyline><path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path></svg>清空历史</button></div>
            </div>
            <div id="aiHistoryList" class="sidebar-content"></div>
          </div>
          <div class="main-chat">
            <div id="aiFullMessages" class="main-messages">
              <div class="message ai">
                  <div class="message-avatar ai"><img class="icon text-white relative z-10" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUMxMC41MDEyIDIxIDkuMTAzNzYgMjAuNjM0NSA3Ljg4NDg5IDIwLjAxOEM3LjI5MTc0IDE5LjY5NzUgNi41ODQyMyAxOS42OTk3IDYuMDA0ODcgMjAuMDIxOEwzLjkzMTA0IDIxLjc5NDlDMy4xOTQ3IDIyLjQxNTYgMi4wNTEwMyAyMS44NDU5IDIuMjAyMDggMjAuOTk5OEwzLjA2NDE0IDE3LjYxMDRDMy4yMzQyIDE2Ljk1NjYgMy4wMjc3NSAxNi4yNDQ1IDIuNTQ0OTggMTUuNzYxN0MyLjEzMzU2IDE1LjM0NzcgMS44MDMyNCAxNC44MTk1IDEuNTY2MjggMTQuMjIxMkMxLjAxOTM3IDEyLjc4ODUgMSAxMS4xOTI0IDEgOC4yNUMxIDQuMjQ4NzMgNS4yNDg3MyAxIDkgMUgxOEMxOS42NTY5IDEgMjEgMi4zNDMxNSAyMSAxMVYxMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=" alt="Chat Icon"/></div>
                  <div class="message-content">👋 欢迎使用AI智能助手！我可以帮助您解答问题、分析文档、进行创意思考等。请随时向我提问。</div>
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
              <input type="file" id="fullFileInput" class="hidden" onchange="handleFullFileUpload(event)" multiple/>
              <div id="aiUploadedFiles" class="uploaded-files"></div>
              <div class="main-input-container">
                  <textarea id="aiFullInput" placeholder="输入您的问题... (Shift+Enter 换行)" class="main-input" rows="1"></textarea>
                  <div class="input-actions">
                      <button onclick="document.getElementById('fullFileInput').click()" class="input-action-btn" title="上传文件"><svg class="icon" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49" /></svg></button>
                      <button onclick="sendFullMessage()" class="input-action-btn primary" title="发送消息"><svg class="icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9 22,2" /></svg></button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

  // --- 5. 注入CSS, HTML和外部依赖的函数 ---
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

  // --- 6. 插件的核心JavaScript逻辑 ---
  function runAiLogic() {
    // 使用在第2步中定义的配置
    const OLLAMA_CONFIG = {
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
    };

    // --- 核心逻辑开始 (从chatv2.html移植并修改) ---

    // 状态变量
    let isMiniChatOpen = false;
    let isFullscreenOpen = false;
    let isSidebarOpen = true;
    let currentUser = { uid: 0, utype: 0, uname: "Root" };
    let chatHistory = [];
    let currentSessionId = null;
    let currentFiles = [];

    // DOM元素获取
    const getEl = (id) => document.getElementById(id);

    // 用户管理
    async function setCurrentUser(uid, utype = 0, uname = null) {
      currentUser = { uid, utype, uname };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      await loadUserChatHistory();
      console.log("当前用户:", currentUser);
      return currentUser;
    }

    function getUserStorageKey() {
      return `aiChatHistory_${currentUser.uid}`;
    }

    async function loadUserChatHistory() {
      try {
        const historyData = localStorage.getItem(getUserStorageKey());
        chatHistory = historyData ? JSON.parse(historyData) : [];
      } catch (error) {
        console.error("加载用户历史记录失败:", error);
        chatHistory = [];
      }
    }

    function saveUserChatHistory() {
      try {
        localStorage.setItem(getUserStorageKey(), JSON.stringify(chatHistory));
      } catch (error) {
        console.error("保存用户历史记录失败:", error);
      }
    }

    async function initializeUser() {
      try {
        const savedUser = localStorage.getItem("currentUser");
        if (savedUser) {
          currentUser = JSON.parse(savedUser);
          await loadUserChatHistory();
        } else {
          await setCurrentUser("default_user", 0, "访客");
        }
      } catch (error) {
        console.error("用户初始化失败:", error);
        await setCurrentUser("default_user", 0, "访客");
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

    // 此处省略了 toggleTheme 和 updateThemeIcons 函数，因为插件中没有提供切换按钮
    // 如果您未来需要在插件中添加主题切换按钮，请将chatv2.html中的相关函数加回此处。

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
      saveCurrentSession();
      getEl("aiModal").classList.remove("active");
      document.body.style.overflow = "";
    };

    window.toggleSidebar = function () {
      isSidebarOpen = !isSidebarOpen;
      getEl("aiSidebar").classList.toggle("hidden", !isSidebarOpen);
    };

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
      if (message) {
        addFullMessage(message, "user");
        getEl("exampleQuestions").style.display = "none";
      }
      currentFiles.forEach((file) => addFullFileMessage(file, "user"));
      input.value = "";
      adjustTextareaHeight(input);
      clearUploadedFiles();
      showTypingIndicator();
      try {
        const aiResponse = await generateAIResponseWithFiles(
          message,
          currentFiles
        );
        hideTypingIndicator();
        addFullMessage(aiResponse, "ai");
        saveCurrentSession();
      } catch (error) {
        console.error("发送消息失败:", error);
        hideTypingIndicator();
        addFullMessage("抱歉，AI服务暂时不可用。", "ai");
      }
    };

    window.sendMiniMessage = async function () {
      const input = getEl("aiMiniInput");
      const message = input.value.trim();
      if (!message) return;
      getEl("miniExampleQuestions").style.display = "none";
      addMiniMessage(message, "user");
      input.value = "";
      try {
        const aiResponse = await generateAIResponse(message);
        addMiniMessage(aiResponse, "ai");
        saveCurrentSession();
      } catch (error) {
        addMiniMessage("抱歉，AI服务暂时不可用。", "ai");
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
    }

    function addMiniMessage(content, sender) {
      const container = getEl("aiMiniMessages");
      const msgEl = createMessageElement(content, sender, "mini");
      container.appendChild(msgEl);
      scrollToBottom("aiMiniMessages");
      lucide.createIcons();
    }

    function createMessageElement(content, sender, type) {
      const wrapper = document.createElement("div");
      wrapper.className = `message ${sender}`;
      const avatarIcon =
        sender === "user"
          ? `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"></circle><path d="M5.5 21v-2.5c0-2.25 3.82-4.5 6.5-4.5s6.5 2.25 6.5 4.5V21"></path></svg>`
          : `<img class="icon text-white relative z-10" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUMxMC41MDEyIDIxIDkuMTAzNzYgMjAuNjM0NSA3Ljg4NDg5IDIwLjAxOEM3LjI5MTc0IDE5LjY5NzUgNi41ODQyMyAxOS42OTk3IDYuMDA0ODcgMjAuMDIxOEwzLjkzMTA0IDIxLjc5NDlDMy4xOTQ3IDIyLjQxNTYgMi4wNTEwMyAyMS44NDU5IDIuMjAyMDggMjAuOTk5OEwzLjA2NDE0IDE3LjYxMDRDMy4yMzQyIDE2Ljk1NjYgMy4wMjc3NSAxNi4yNDQ1IDIuNTQ0OTggMTUuNzYxN0MyLjEzMzU2IDE1LjM0NzcgMS44MDMyNCAxNC44MTk1IDEuNTY2MjggMTQuMjIxMkMxLjAxOTM3IDEyLjc4ODUgMSAxMS4xOTI0IDEgOC4yNUMxIDQuMjQ4NzMgNS4yNDg3MyAxIDkgMUgxOEMxOS42NTY5IDEgMjEgMi4zNDMxNSAyMSAxMVYxMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=" alt="Chat Icon"/>`;

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
      indicator.innerHTML = `<div class="message-avatar ai"><img class="icon text-white relative z-10" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUMxMC41MDEyIDIxIDkuMTAzNzYgMjAuNjM0NSA3Ljg4NDg5IDIwLjAxOEM3LjI5MTc0IDE5LjY5NzUgNi41ODQyMyAxOS42OTk3IDYuMDA0ODcgMjAuMDIxOEwzLjkzMTA0IDIxLjc5NDlDMy4xOTQ3IDIyLjQxNTYgMi4wNTEwMyAyMS44NDU5IDIuMjAyMDggMjAuOTk5OEwzLjA2NDE0IDE3LjYxMDRDMy4yMzQyIDE2Ljk1NjYgMy4wMjc3NSAxNi4yNDQ1IDIuNTQ0OTggMTUuNzYxN0MyLjEzMzU2IDE1LjM0NzcgMS44MDMyNCAxNC44MTk1IDEuNTY2MjggMTQuMjIxMkMxLjAxOTM3IDEyLjc4ODUgMSAxMS4xOTI0IDEgOC4yNUMxIDQuMjQ4NzMgNS4yNDg3MyAxIDkgMUgxOEMxOS42NTY5IDEgMjEgMi4zNDMxNSAyMSAxMVYxMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=" alt="Chat Icon"/></div><div class="message-content"><div class="loading-dots"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div></div>`;
      container.appendChild(indicator);
      scrollToBottom("aiFullMessages");
    }

    function hideTypingIndicator() {
      getEl("typingIndicator")?.remove();
    }

    // 文件处理
    window.handleFullFileUpload = function (event) {
      addFilesToUploadList(event.target.files);
    };
    function addFilesToUploadList(files) {
      const container = getEl("aiUploadedFiles");
      for (let file of files) {
        currentFiles.push(file);
        const fileDiv = document.createElement("div");
        fileDiv.className = "file-item";
        fileDiv.innerHTML = `<div class="file-info"><svg class="file-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg><span class="file-name">${file.name}</span></div><button onclick="removeFile(this, '${file.name}')" class="file-remove"><svg class="icon-sm" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
        container.appendChild(fileDiv);
      }
      lucide.createIcons();
    }
    window.removeFile = function (button, fileName) {
      currentFiles = currentFiles.filter((f) => f.name !== fileName);
      button.parentElement.remove();
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
      saveCurrentSession();
      currentSessionId = Date.now();
      clearUploadedFiles();
      getEl("aiFullMessages").innerHTML = getEl("exampleQuestions").outerHTML;
      const welcomeMsg = createMessageElement(
        "👋 您好！我是谷稷，有什么农业问题可以帮助您解答？",
        "ai"
      );
      getEl("aiFullMessages").prepend(welcomeMsg);
      lucide.createIcons();
      loadChatHistory();
    };

    function saveCurrentSession() {
      if (!currentSessionId) return;
      const messagesContainer = getEl("aiFullMessages");
      if (!messagesContainer || messagesContainer.children.length <= 1) return;
      const firstUserMessage = messagesContainer.querySelector(
        ".message.user .message-content"
      );
      const title = firstUserMessage
        ? firstUserMessage.textContent.substring(0, 30) + "..."
        : "新对话";
      const session = {
        id: currentSessionId,
        title,
        html: messagesContainer.innerHTML,
        timestamp: Date.now(),
      };
      const index = chatHistory.findIndex((s) => s.id === currentSessionId);
      if (index > -1) chatHistory[index] = session;
      else chatHistory.unshift(session);
      saveUserChatHistory();
    }

    window.loadSessionById = function (sessionId) {
      const session = chatHistory.find((s) => s.id === sessionId);
      if (session) {
        currentSessionId = session.id;
        getEl("aiFullMessages").innerHTML = session.html;
        scrollToBottom("aiFullMessages");
        lucide.createIcons();
        updateHistorySelection(sessionId);
      }
    };

    function loadChatHistory() {
      const container = getEl("aiHistoryList");
      container.innerHTML = "";
      chatHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .forEach((session) => {
          const item = document.createElement("div");
          item.className = "history-item";
          item.dataset.sessionId = session.id;
          if (session.id === currentSessionId) item.classList.add("active");
          item.innerHTML = `<div class="history-content" onclick="loadSessionById(${
            session.id
          })"><h4 class="font-semibold text-sm truncate">${
            session.title
          }</h4><p class="text-xs text-gray-500 mt-1">${formatDate(
            session.timestamp
          )}</p></div><div class="history-actions"><button class="history-action-btn delete" onclick="event.stopPropagation(); deleteSession(${
            session.id
          })" title="删除"><svg class="w-3 h-3 icon" viewBox="0 0 24 24"><polyline points="3,6 5,6 21,6"></polyline><path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path></svg></button></div>`;
          container.appendChild(item);
        });
    }

    function updateHistorySelection(sessionId) {
      Array.from(getEl("aiHistoryList").children).forEach((item) => {
        item.classList.toggle("active", item.dataset.sessionId == sessionId);
      });
    }

    window.deleteSession = function (sessionId) {
      if (!confirm("确定要删除这个对话吗？")) return;
      if (sessionId === currentSessionId) {
        currentSessionId = null;
        startNewChat();
      }
      chatHistory = chatHistory.filter((s) => s.id !== sessionId);
      saveUserChatHistory();
      loadChatHistory();
    };

    window.clearAllHistory = function () {
      if (!confirm("确定要清空所有历史记录吗？")) return;
      chatHistory = [];
      saveUserChatHistory();
      currentSessionId = null;
      startNewChat();
    };

    window.exportAllHistory = function () {
      const dataStr = JSON.stringify(chatHistory, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ai_chat_history_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
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
      return text.replace(/\n/g, "<br>");
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
        0: `<prompt><identity>你是一个能看懂图片、会分析问题的智慧农业助手，专门服务于中国的一线农民朋友。</identity><core_values>- **用户至上**: 我的存在就是为了让乡亲们省心省力，多打粮食。- **绝对通俗**: 说的每一句话都要保证田间地头的伯伯阿姨们听得懂、用得上。- **实用第一**: 不说空话理论，只给能直接上手操作的实用办法。</core_values><behavioral_guidelines><language_rules>- **纯中文**: 全程必须只使用简体中文。- **口语化**: 使用大白话，可以带有一些亲切的语气词。- **贴心小助手**: 语气温和,就像一位有智慧的朋友般.</language_rules><knowledge_domain>- **允许范围**: 只能回答和农业生产直接相关的问题。- **禁止范围**: 绝对不能回答任何与农业无关的问题。如果被问到，必须按固定话术回应：“哎呀，这个问题可难住我啦，我是专门帮大家搞种植养殖的，别的事儿就不懂了。”</knowledge_domain></behavioral_guidelines></prompt>`,
        1: `<prompt><identity>你是一个高级多模态智慧农业AI，能够对用户提供的图像和文本进行联合分析，生成专家级的技术诊断报告。</identity><core_principles>- **视觉优先**: 图像是核心证据。你的分析必须从视觉观察出发。- **逻辑推理**: 严格遵循从现象到假设，再到验证和结论的逻辑链。- **知识融合**: 将视觉证据与农业科学知识库进行深度融合。</core_principles><mandatory_output_structure>你的回答必须严格遵循以下结构:### 1. 核心诊断\n### 2. 视觉证据分析\n### 3. 诊断推理过程\n### 4. 技术建议\n### 5. 鉴别诊断</mandatory_output_structure></prompt>`,
      };
      return prompts[utype] || prompts[0];
    }

    async function callOllamaAPI(message, utype = 0, images = []) {
      const requestBody = {
        model: OLLAMA_CONFIG.model,
        system: getSystemPromptByUserType(utype),
        prompt: message,
        images,
        stream: false,
      };
      const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok)
        throw new Error(`Ollama API调用失败: ${response.status}`);
      const data = await response.json();
      return data.message?.content || "抱歉，AI助手暂时无法回复。";
    }

    async function generateAIResponse(message) {
      return await callOllamaAPI(message, currentUser.utype);
    }
    async function generateAIResponseWithFiles(message, files) {
      const imagePromises = files
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });
      const base64Images = await Promise.all(imagePromises);
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
    window.addEventListener("beforeunload", saveCurrentSession);

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
    const uploadArea = getEl("aiUploadArea");
    if (uploadArea) {
      uploadArea.addEventListener("click", () =>
        getEl("fullFileInput").click()
      );
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
        addFilesToUploadList(e.dataTransfer.files);
      });
    }

    console.log("AI 助手插件初始化完成。");
  }

  // --- 7. 启动插件 ---
  // 等待DOM加载完毕后执行注入
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePlugin);
  } else {
    initializePlugin();
  }
})();

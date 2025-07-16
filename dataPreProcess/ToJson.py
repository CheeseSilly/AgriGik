import pandas as pd
import json

# --- 1. 请在这里配置您的文件名 ---
# 输入的CSV文件名
csv_file_path = "agriculture_wiki_qa_full.csv"
# 输出的JSON文件名 (注意后缀是 .json)
json_file_path = "agriculture_wiki_qa.json"

# --- 2. 核心转换逻辑 (修改版) ---
try:
    # 使用pandas读取CSV文件
    df = pd.read_csv(csv_file_path)
    print(f"成功读取CSV文件: {csv_file_path}，共 {len(df)} 条数据。")

    # 创建一个空列表，用来存放所有的数据点
    all_data = []

    # 遍历DataFrame的每一行
    for index, row in df.iterrows():
        # 确保'question'和'answer'列存在且不为空
        if pd.notna(row["question"]) and pd.notna(row["answer"]):
            # 构建Alpaca格式的字典
            data_point = {
                "instruction": row["question"],
                "input": "",
                "output": row["answer"],
            }
            # 将字典追加到列表中
            all_data.append(data_point)

    # 循环结束后，一次性将整个列表写入JSON文件
    with open(json_file_path, "w", encoding="utf-8") as f:
        # 使用 json.dump() 写入整个列表
        # indent=2 会让JSON文件格式化，方便阅读
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"数据转换成功！已保存为标准的JSON文件: {json_file_path}")

except FileNotFoundError:
    print(
        f"错误：找不到CSV文件 '{csv_file_path}'。请确保文件名正确且文件在同一目录下。"
    )
except KeyError as e:
    print(
        f"错误：CSV文件中缺少必需的列: {e}。请确保文件包含 'question' 和 'answer' 列。"
    )

import os
import json
import random
import xml.etree.ElementTree as ET

# 数据集根目录
dataset_root = "./"
# Annotations文件夹路径
annotations_dir = os.path.join(dataset_root, "Annotations")
# JPEGImages文件夹路径
jpeg_images_dir = os.path.join(dataset_root, "JPEGImages")

classes_file_path = os.path.join(dataset_root, "classes.txt")  # under the root

# 输出的JSON文件名
output_file = "ip102_alpaca_from_xml.json"


def load_class_mapping(filepath):
    """
    根据用户提供的 '编号 名称' 格式的classes.txt文件，创建映射字典。
    """
    mapping = {}
    print(f"正在从 {filepath} 加载类别映射...")
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                # 文件格式为 '编号<空格>名称'
                parts = line.strip().split(maxsplit=1)
                if len(parts) == 2:
                    number, name = parts
                    number = int(number) - 1
                    number = str(number)
                    mapping[number] = name
                else:
                    print(f"警告：跳过格式不正确的行 -> {line.strip()}")
        print(f"成功加载类别映射文件，共 {len(mapping)} 个类别。")
        return mapping
    except FileNotFoundError:
        print(f"错误：找不到类别文件 {filepath}！请检查路径。")
        return None


instruction_templates = [
    "<image>\n请识别这张图片中的昆虫。",
    "<image>\n这是什么害虫？请进行分类。",
    "<image>\n图中所示的生物是什么？",
    "<image>\n帮我看看这个昆虫的种类。",
    "<image>\n请对下图中的昆虫进行鉴定并给出名称。",
]

output_templates = [
    "根据图片分析，这是一种{label}。",
    "图中显示的是{label}。",
    "这只昆虫被识别为{label}。",
    "好的，图片中的害虫是{label}。",
]


final_data = []


class_mapping = load_class_mapping(classes_file_path)

if class_mapping and os.path.isdir(annotations_dir):
    print(f"\开始扫描Annotations文件夹: {annotations_dir}")

    for xml_filename in os.listdir(annotations_dir):
        if not xml_filename.endswith(".xml"):
            continue

        xml_filepath = os.path.join(annotations_dir, xml_filename)

        try:

            tree = ET.parse(xml_filepath)
            root = tree.getroot()

            image_filename = root.find("filename").text

            if not image_filename.lower().endswith(".jpg"):
                image_filename += ".jpg"

            class_id = root.find("object/name").text

            class_label = class_mapping.get(class_id)

            if not class_label:
                print(
                    f"警告: 在classes.txt中找不到ID为'{class_id}'的类别 (来自文件: {xml_filename})，跳过。"
                )
                continue

            # 构建完整的图片路径
            full_image_path = os.path.join(jpeg_images_dir, image_filename)

            full_image_path = full_image_path.replace("\\", "/")

            if not os.path.exists(full_image_path):
                print(f"警告: 图片文件 {full_image_path} 不存在，跳过。")
                continue

            # 【第4步】生成数据点
            instruction = random.choice(instruction_templates)
            output = random.choice(output_templates).format(label=class_label)

            data_point = {
                "instruction": instruction,
                "input": "",
                "output": output,
                "images": [full_image_path],
            }
            final_data.append(data_point)

        except Exception as e:
            print(f"处理文件 {xml_filename} 时发生错误: {e}")

    print(f"\n数据转换完成！总共生成 {len(final_data)} 条有效数据。")

    # --- 5. 保存为JSON文件 ---
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print(f"数据已成功保存到: {output_file}")
else:
    print("未能加载类别映射或找不到Annotations文件夹，程序已终止。")

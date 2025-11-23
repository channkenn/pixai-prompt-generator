import json
from pathlib import Path

# ---- 入出力ファイル固定 ----
INPUT_JSON = Path("hookup.json")
OUTPUT_TXT = Path("hookup.txt")

def load_json():
    if not INPUT_JSON.exists():
        raise FileNotFoundError(f"{INPUT_JSON} が見つかりません")
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        return json.load(f)

def flatten_item(item):
    """要素を1行にして label, value 順に整形"""
    label = item.get("label", "")
    value = item.get("value", "")
    return f'{{ "label": "{label}", "value": "{value}" }}'

def main():
    data = load_json()
    lines = ["{"]

    for i, (key, arr) in enumerate(data.items()):
        if isinstance(arr, list):
            # ラベル順にソート
            arr_sorted = sorted(arr, key=lambda x: x.get("label", ""))
            # 各要素を1行に整形
            items_text = ",\n  ".join(flatten_item(item) for item in arr_sorted)
            lines.append(f'  "{key}": [\n  {items_text}\n  ]{"," if i < len(data) - 1 else ""}')

    lines.append("}")
    OUTPUT_TXT.write_text("\n".join(lines), encoding="utf-8")
    print("生成完了:", OUTPUT_TXT)

if __name__ == "__main__":
    main()

import json
from pathlib import Path

# ---- 入出力ファイル固定 ----
INPUT_JSON = Path("hookup.json")
OUTPUT_TXT = Path("hookup.txt")

def load_json():
    """入力JSONファイルをロードする"""
    if not INPUT_JSON.exists():
        raise FileNotFoundError(f"{INPUT_JSON} が見つかりません")
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        return json.load(f)

def main():
    try:
        data = load_json()
    except Exception as e:
        print(f"エラー: {e}")
        return

    # --- 1. 既存の最大IDを特定する ---
    # 既存のIDと重複しないように、現在の最大値を取得してその次からカウントアップします
    existing_ids = []
    for val in data.values():
        if isinstance(val, list):
            for item in val:
                if isinstance(item, dict) and "id" in item:
                    try:
                        existing_ids.append(int(item["id"]))
                    except (ValueError, TypeError):
                        continue
    
    # 既存IDが一つもなければ1から、あれば最大値+1からスタート
    item_id_counter = max(existing_ids) + 1 if existing_ids else 1

    lines = ["{"]
    keys = list(data.keys())

    for i, key in enumerate(keys):
        arr = data[key]
        
        if isinstance(arr, list):
            # ラベル順にソート（既存のロジックを維持）
            arr_sorted = sorted(arr, key=lambda x: x.get("label", ""))
            
            items_text = []
            
            for item in arr_sorted:
                label = item.get("label", "")
                value = item.get("value", "")
                
                # --- 2. IDの判定と付与 ---
                # すでに "id" キーがある場合はそれを使用し、なければカウンターから発行
                current_id = item.get("id")
                if current_id is None:
                    current_id = item_id_counter
                    item_id_counter += 1
                
                # 整形して追加
                item_line = f'{{ "id": {current_id}, "label": "{label}", "value": "{value}" }}'
                items_text.append(item_line)

            content = ",\n    ".join(items_text)
            is_last_key = i == len(keys) - 1
            lines.append(f'  "{key}": [\n    {content}\n  ]{"" if is_last_key else ","}')

    lines.append("}")
    
    try:
        OUTPUT_TXT.write_text("\n".join(lines), encoding="utf-8")
        print(f"生成完了: {OUTPUT_TXT} (次の新規ID開始番号: {item_id_counter})")
    except Exception as e:
        print(f"エラー: {e}")

if __name__ == "__main__":
    main()
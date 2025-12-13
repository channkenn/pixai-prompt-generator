import json
from pathlib import Path

# ---- 入出力ファイル固定 ----
INPUT_JSON = Path("hookup.json")
OUTPUT_TXT = Path("hookup.txt")

def load_json():
    """入力JSONファイルをロードする"""
    if not INPUT_JSON.exists():
        # ファイルがない場合はエラーを発生させる
        raise FileNotFoundError(f"{INPUT_JSON} が見つかりません")
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        # JSONを読み込み、Pythonの辞書/リストとして返す
        return json.load(f)

def main():
    """
    JSONデータをロードし、配列内の要素にIDを付与し、
    ラベル順にソートして、構造を維持したまま整形されたTXTファイルとして出力する。
    """
    try:
        data = load_json()
    except FileNotFoundError as e:
        print(e)
        return
    except json.JSONDecodeError:
        print(f"エラー: {INPUT_JSON} が有効なJSON形式ではありません。")
        return

    lines = ["{"]
    # 全てのアイテムに対して通し番号を振るためのカウンター
    item_id_counter = 1
    
    # JSONのキーの順序を維持
    keys = list(data.keys())

    # トップレベルのオブジェクトをイテレート
    for i, key in enumerate(keys):
        arr = data[key]
        
        # 値がリストであることを確認 (リスト以外の要素は整形対象外としてスキップ)
        if isinstance(arr, list):
            # --- 1. ラベル順にソート ---
            # labelキーが存在しない場合は空文字列としてソート（辞書を壊さない）
            arr_sorted = sorted(arr, key=lambda x: x.get("label", ""))
            
            items_text = []
            
            # --- 2. IDを付与して整形 ---
            for item in arr_sorted:
                label = item.get("label", "")
                value = item.get("value", "")
                
                # IDを最初のフィールドとして含めたJSON文字列を生成
                # (元のコードのインデントに合わせてスペース2つで開始)
                item_line = f'{{ "id": {item_id_counter}, "label": "{label}", "value": "{value}" }}'
                items_text.append(item_line)
                item_id_counter += 1

            # 配列の内容を改行とインデントで整形して結合
            # ここではインデントを「  」として結合（元のコードの「  」を「  」に統一）
            content = ",\n  ".join(items_text)
            
            # キーと配列を lines に追加
            # 最後の要素でカンマを付けないように制御
            is_last_key = i == len(keys) - 1
            lines.append(f'  "{key}": [\n  {content}\n  ]{"" if is_last_key else ","}')

    lines.append("}")
    
    # ファイル書き出し
    try:
        OUTPUT_TXT.write_text("\n".join(lines), encoding="utf-8")
        print("生成完了:", OUTPUT_TXT)
    except Exception as e:
        print(f"エラー: ファイル書き込み中に問題が発生しました: {e}")

if __name__ == "__main__":
    main()
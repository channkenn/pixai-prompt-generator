// --- History Management Logic ---

const HISTORY_KEY = "promptHistory";

// 依存する外部関数（script.jsからインポートされることを想定）
// saveState: ボタンの状態をlocalStorageに保存し、generateOutputを呼ぶ関数
// generateOutput: 現在の選択からプロンプト文字列を生成し、UIに出力する関数

/**
 * 履歴データをlocalStorageから読み込む
 * @returns {Array<{label: string, value: string}>}
 */
export const loadHistory = () => {
  const historyJson = localStorage.getItem(HISTORY_KEY);
  try {
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (e) {
    console.error("Error parsing history from localStorage:", e);
    return [];
  }
};

/**
 * 履歴データをlocalStorageに保存する
 * @param {Array<{label: string, value: string}>} history
 */
const saveHistory = (history) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

/**
 * プリセット（プロンプト文字列）を適用する
 * @param {string} promptString
 * @param {function} saveStateCallback - 状態を保存し、出力を更新するためのコールバック
 */
export const applyPreset = (promptString, saveStateCallback) => {
  // 既存の選択を全てクリア
  document
    .querySelectorAll(".sub-group button.active, .sub-subgroup button.active")
    .forEach((b) => b.classList.remove("active"));

  // プロンプト文字列をカンマで分割し、キーワードをアクティブにする
  const keywords = promptString
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  keywords.forEach((keyword) => {
    // data-keyword 属性を使って対応するボタンを探す
    const btn = document.querySelector(`button[data-keyword="${keyword}"]`);
    if (btn) {
      btn.classList.add("active");
    }
  });

  // 状態を保存し、出力を更新 (script.jsの関数を呼び出す)
  saveStateCallback();
};

/**
 * 履歴リストをUIにレンダリングする
 * @param {function} saveStateCallback - 状態を保存し、出力を更新するためのコールバック
 */
export const renderHistory = (saveStateCallback) => {
  const historyListContainer = document.getElementById("historyListContainer");
  if (!historyListContainer) return;

  historyListContainer.innerHTML = "";

  const history = loadHistory();

  if (history.length === 0) {
    historyListContainer.innerHTML =
      '<p class="text-gray-500 italic p-2">保存された履歴はありません。</p>';
    return;
  }

  history.forEach((item, index) => {
    // 変更点 1: Flexboxコンテナではなく、シンプルに履歴ボタンを並べるためのラッパーに変更
    const itemDiv = document.createElement("div");
    itemDiv.className = "history-item-wrapper"; // 新しいラッパークラスを付与（CSSで調整） // 変更点 2: ラベルを <span> から <button> に変更し、既存ボタンと同じクラスを付与

    const historyButton = document.createElement("button"); // 既存のボタンと同じ見た目のクラスを付与 // NOTE: style.cssで定義されている button スタイルが適用されます
    historyButton.textContent = item.label; // 既存のボタンと区別するため、特定のカスタムクラスやIDは残しておいても良い
    historyButton.className = "history-button";
    historyButton.title = item.value;
    historyButton.addEventListener("click", () => {
      applyPreset(item.value, saveStateCallback);
      console.log(
        `Preset "${item.label}" applied: ${item.value.substring(0, 50)}...`
      );
    }); // 変更点 3: 削除ボタンはボタンと横並びになるように調整

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clip-rule="evenodd" /></svg>'; // 削除ボタンのスタイルは、通常のボタンとは異なる小さくて目立たないものに戻します
    deleteBtn.className =
      "delete-history-btn bg-red-500 text-white rounded-full hover:bg-red-600 transition";
    deleteBtn.title = `"${item.label}" を削除`;
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.confirm(`履歴 "${item.label}" を削除しますか？`)) {
        let currentHistory = loadHistory();
        currentHistory = currentHistory.filter((h) => h.label !== item.label);
        saveHistory(currentHistory);
        renderHistory(saveStateCallback); // 再レンダリング
      }
    }); // ボタンと削除ボタンをFlexで横並びにするコンテナを作成

    const flexWrapper = document.createElement("div");
    flexWrapper.className = "history-item-flex-wrapper";
    flexWrapper.appendChild(historyButton);
    flexWrapper.appendChild(deleteBtn);

    itemDiv.appendChild(flexWrapper);
    historyListContainer.appendChild(itemDiv);
  });
};

/**
 * 履歴保存ボタンのイベントリスナーを設定する
 * @param {function} generateOutputCallback - 現在のプロンプト文字列を取得するために使用するコールバック
 * @param {function} saveStateCallback - 状態を保存し、出力を更新するためのコールバック
 */
export const setupPresetListeners = (
  generateOutputCallback,
  saveStateCallback
) => {
  document.getElementById("savePresetBtn")?.addEventListener("click", () => {
    const presetNameInput = document.getElementById("presetName");
    const label = presetNameInput.value.trim();

    // 現在のプロンプト文字列を取得 (generateOutputCallbackの結果を取得)
    // generateOutputCallback()はdocument.getElementById("output").textContentを返すように期待
    const value = generateOutputCallback();

    if (!label) {
      window.confirm("プリセット名を入力してください。");
      return;
    }

    if (!value || value.length === 0) {
      window.confirm("保存するアクティブなキーワードがありません。");
      return;
    }

    let history = loadHistory();

    // 重複チェック (ラベルベース)
    const existingIndex = history.findIndex((item) => item.label === label);
    if (existingIndex !== -1) {
      if (
        !window.confirm(
          `"${label}" という名前の履歴が既に存在します。上書きしますか？`
        )
      ) {
        return;
      }
      history[existingIndex] = { label, value }; // 上書き
    } else {
      history.push({ label, value }); // 新規追加
    }

    saveHistory(history);
    renderHistory(saveStateCallback);
    presetNameInput.value = ""; // 入力フィールドをクリア
  });
};

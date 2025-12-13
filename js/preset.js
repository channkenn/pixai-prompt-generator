// --- History Management Logic ---

const HISTORY_KEY = "promptHistory";

// 💡 修正: alert/confirmを置き換えるためのシンプルなメッセージ表示ユーティリティ
const displayTemporaryMessage = (message, isError = false) => {
  const messageContainer = document.getElementById("presetMessageContainer");
  if (messageContainer) {
    messageContainer.innerHTML = `<div class="p-2 text-sm rounded ${
      isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
    }">${message}</div>`;
    setTimeout(() => {
      messageContainer.innerHTML = "";
    }, 3000);
  } else {
    console.log(`[MESSAGE] ${message}`);
    if (isError) console.error(message);
  }
};

/**
 * 履歴データをlocalStorageから読み込む
 * @returns {Array<{label: string, value: string}>} - value には IDのカンマ区切り文字列が格納される
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
 * プリセット（ID文字列）を適用する (履歴適用用)
 * @param {string} idString - カンマ区切りのアイテムID文字列
 * @param {function} saveStateCallback - 状態を保存し、出力を更新するためのコールバック
 */
export const applyPreset = (idString, saveStateCallback) => {
  // 既存の選択を全てクリア
  // 💡 修正: セレクタは script.js と同じく正確に .tooltip-wrapper 内の button を探します
  document
    .querySelectorAll(
      ".sub-group .tooltip-wrapper button.active, .sub-subgroup .tooltip-wrapper button.active"
    )
    .forEach((b) => b.classList.remove("active"));

  // ID文字列をカンマで分割し、ボタンをアクティブにする
  const itemIds = idString
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  itemIds.forEach((itemId) => {
    // 💡 修正: data-item-id 属性を使って対応するボタンを探す
    const btn = document.querySelector(`button[data-item-id="${itemId}"]`);
    if (btn) {
      btn.classList.add("active");
    }
  });

  // 状態を保存し、出力を更新 (script.jsの関数を呼び出す)
  saveStateCallback();
  displayTemporaryMessage("プリセットが適用されました。", false);
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
    const itemDiv = document.createElement("div");
    itemDiv.className = "history-item-wrapper";

    const historyButton = document.createElement("button");
    historyButton.textContent = item.label;
    historyButton.className = "history-button";
    // 💡 修正: value には IDのカンマ区切り文字列が格納されている
    historyButton.title = `ID: ${item.value}`;
    historyButton.addEventListener("click", () => {
      // applyPreset に ID文字列を渡す
      applyPreset(item.value, saveStateCallback);
      console.log(
        `Preset "${item.label}" applied: ID list (${item.value.substring(
          0,
          50
        )}...)`
      );
    });

    const deleteBtn = document.createElement("button");
    // 削除ボタンのSVGアイコンはそのまま
    deleteBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clip-rule="evenodd" /></svg>';
    deleteBtn.className =
      "delete-history-btn bg-red-500 text-white rounded-full hover:bg-red-600 transition";
    deleteBtn.title = `"${item.label}" を削除`;
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // 💡 修正: confirm の代わりにメッセージを表示し、即座に削除を行う（確認ダイアログは表示しない）
      displayTemporaryMessage(`履歴 "${item.label}" を削除しました。`, false);

      let currentHistory = loadHistory();
      currentHistory = currentHistory.filter((h) => h.label !== item.label);
      saveHistory(currentHistory);
      renderHistory(saveStateCallback); // 再レンダリング
    });

    const flexWrapper = document.createElement("div");
    flexWrapper.className = "history-item-flex-wrapper";
    flexWrapper.appendChild(historyButton);
    flexWrapper.appendChild(deleteBtn);

    itemDiv.appendChild(flexWrapper);
    historyListContainer.appendChild(itemDiv);
  });
};

// 💡 新規追加: 現在アクティブなボタンのID文字列を取得するヘルパー関数
const getActiveIdsString = () => {
  const activeIds = [
    ...document.querySelectorAll(
      ".sub-group .tooltip-wrapper button.active, .sub-subgroup .tooltip-wrapper button.active"
    ),
  ]
    // 💡 修正: data-item-id を収集
    .map((b) => b.dataset.itemId)
    .filter((id) => id);
  return activeIds.join(",");
};

/**
 * 履歴保存ボタンのイベントリスナーを設定する
 * @param {function} generateOutputCallback - (未使用だが引数を維持) 現在のプロンプト文字列を取得するために使用するコールバック
 * @param {function} saveStateCallback - 状態を保存し、出力を更新するためのコールバック
 */
export const setupPresetListeners = (
  generateOutputCallback, // このコールバックは値（キーワード）を返すため、IDベースの保存には使用しない
  saveStateCallback
) => {
  // プリセットメッセージのコンテナを、保存ボタンの近くに動的に作成する
  const savePresetBtn = document.getElementById("savePresetBtn");
  if (savePresetBtn && !document.getElementById("presetMessageContainer")) {
    const messageContainer = document.createElement("div");
    messageContainer.id = "presetMessageContainer";
    messageContainer.className = "w-full";
    savePresetBtn.parentElement.insertBefore(
      messageContainer,
      savePresetBtn.nextSibling
    );
  }

  savePresetBtn?.addEventListener("click", () => {
    const presetNameInput = document.getElementById("presetName");
    const label = presetNameInput.value.trim();

    // 💡 修正: generateOutputCallback() の代わりに、DOMから直接IDを取得
    const value = getActiveIdsString();

    if (!label) {
      displayTemporaryMessage("プリセット名を入力してください。", true);
      return;
    }

    if (!value || value.length === 0) {
      displayTemporaryMessage("保存するアクティブな項目がありません。", true);
      return;
    }

    let history = loadHistory();

    // 重複チェック (ラベルベース)
    const existingIndex = history.findIndex((item) => item.label === label);
    if (existingIndex !== -1) {
      // 💡 修正: confirm を使わず、常に上書きする
      history[existingIndex] = { label, value }; // 上書き
      displayTemporaryMessage(`履歴 "${label}" を上書き保存しました。`, false);
    } else {
      // 最大履歴数を制限しても良いが、ここでは実装しない
      history.push({ label, value }); // 新規追加
      displayTemporaryMessage(`履歴 "${label}" を新規保存しました。`, false);
    }

    saveHistory(history);
    renderHistory(saveStateCallback);
    presetNameInput.value = ""; // 入力フィールドをクリア
  });
};

import { renderHistory, setupPresetListeners } from "./preset.js";

document.addEventListener("DOMContentLoaded", async () => {
  const resDict = await fetch("config/data/hookup.json");
  const DICT = await resDict.json();

  const resPreset = await fetch("config/data/preset.json");
  const PRESET = await resPreset.json();

  const DICT_MERGED = { ...DICT, ...PRESET };

  const resUI = await fetch("config/ui/ui_hookup.json");
  const UI = await resUI.json();

  const container = document.querySelector(".container");
  const output = document.getElementById("output");
  const uiRoot = document.getElementById("ui-root");

  const saveState = () => {
    const state = {};
    document.querySelectorAll(".sub-group, .sub-subgroup").forEach((sg) => {
      const activeKeywords = [...sg.querySelectorAll("button.active")]
        .map((b) => b.dataset.keyword)
        .filter((k) => k);
      if (activeKeywords.length > 0)
        state[sg.dataset.subgroup] = activeKeywords;
    });
    localStorage.setItem("buttonState", JSON.stringify(state));
  };

  const loadState = () => {
    const state = JSON.parse(localStorage.getItem("buttonState") || "{}");
    document.querySelectorAll(".sub-group, .sub-subgroup").forEach((sg) => {
      const sgState = state[sg.dataset.subgroup] || [];
      sg.querySelectorAll("button").forEach((b) =>
        b.classList.toggle("active", sgState.includes(b.dataset.keyword))
      );
    });
  };

  const createSubGroup = (sgObj, parentElem, isNested = false) => {
    const subDiv = document.createElement("div");
    subDiv.className = isNested ? "sub-subgroup" : "sub-group";
    subDiv.dataset.subgroup = sgObj.id;

    const h4 = document.createElement("h4");
    h4.textContent = sgObj.label;

    subDiv.appendChild(h4);
    parentElem.appendChild(subDiv); // 🌟 初期表示するボタンの最大数を定義

    const MAX_VISIBLE_BUTTONS = 8;
    let buttonCount = 0;
    const hiddenButtons = []; // 初期非表示にするボタンを格納する配列

    const items = Array.isArray(DICT_MERGED[sgObj.id])
      ? DICT_MERGED[sgObj.id]
      : [];
    items.forEach((item) => {
      if (!item.value) return; // ---------------------------------------------------- // ⭐ ここからツールチップ機能の追加 // 1. ラッパー要素を作成し、ボタンとツールチップを格納する

      const wrapper = document.createElement("div"); // CSSでホバー時の表示を制御するためのクラス
      wrapper.className = "tooltip-wrapper"; // 2. ボタンを作成 (既存のロジック)

      const btn = document.createElement("button");
      btn.dataset.keyword = item.value;
      btn.dataset.exclusive = sgObj.exclusive;
      btn.dataset.noRandom = item.noRandom ? "true" : "false";
      btn.textContent = item.label; // 3. ツールチップ要素を作成し、item.value をセット

      const tooltip = document.createElement("span");
      tooltip.className = "tooltip-value"; // JSONから取得した value を表示
      tooltip.textContent = item.value; // 4. ラッパーにボタンとツールチップを追加

      wrapper.appendChild(btn);
      wrapper.appendChild(tooltip); // ---------------------------------------------------- // 🌟 9個目以降のボタンに初期非表示クラスを付与

      if (buttonCount >= MAX_VISIBLE_BUTTONS) {
        // ボタンではなく、ラッパーに非表示クラスを付与
        wrapper.classList.add("hidden-initial"); // 非表示にする要素をラッパーで管理
        hiddenButtons.push(wrapper);
      }
      buttonCount++;

      if (item.active && typeof item.active === "object") {
        btn.dataset.active = JSON.stringify(item.active);
      }

      btn.addEventListener("click", () => {
        if (btn.dataset.active) {
          // dataset.active がある場合は対応ボタンをアクティブ化
          const activeData = JSON.parse(btn.dataset.active);
          Object.entries(activeData).forEach(([sgId, keywords]) => {
            const subgroup = document.querySelector(
              `[data-subgroup="${sgId}"]`
            );
            if (!subgroup) return;
            const kwArray = Array.isArray(keywords) ? keywords : [keywords];
            subgroup.querySelectorAll("button").forEach((b) => {
              b.classList.toggle("active", kwArray.includes(b.dataset.keyword));
            });
          });
        } else {
          // 通常のボタン押下処理
          if (sgObj.exclusive) {
            const subDiv = btn.closest(".sub-group, .sub-subgroup"); // ラッパー内のボタンに対して処理を行う
            subDiv.querySelectorAll(".tooltip-wrapper button").forEach((b) => {
              if (b !== btn) b.classList.remove("active");
            });
          }
          btn.classList.toggle("active");
        }

        saveState();
      }); // 5. subDiv にボタンの代わりにラッパーを追加

      subDiv.appendChild(wrapper);
    }); // 🌟 トグルボタンの追加とイベントリスナーの設定

    if (hiddenButtons.length > 0) {
      const toggleButton = document.createElement("button");
      toggleButton.className = "toggle-more-buttons";
      toggleButton.textContent = `さらに ${hiddenButtons.length} 件表示`;

      subDiv.appendChild(toggleButton); // subDiv の末尾に追加

      toggleButton.addEventListener("click", () => {
        const isCollapsed =
          hiddenButtons[0].classList.contains("hidden-initial"); // hidden-initial クラスを付け替えて表示/非表示を切り替え

        hiddenButtons.forEach((w) => {
          // w はラッパー要素 (wrapper)
          w.classList.toggle("hidden-initial");
        });

        if (isCollapsed) {
          toggleButton.textContent = "閉じる";
        } else {
          toggleButton.textContent = `さらに ${hiddenButtons.length} 件表示`;
        }
      });
    }

    if (sgObj.subgroups) {
      const nestedWrapper = document.createElement("div");
      nestedWrapper.className = "sub-subgroups collapsed";
      sgObj.subgroups.forEach((sub) =>
        createSubGroup(sub, nestedWrapper, true)
      );
      subDiv.appendChild(nestedWrapper);

      const toggle = document.createElement("span");
      toggle.className = "toggle";
      toggle.textContent = "▶";
      toggle.style.cursor = "pointer";
      toggle.style.marginLeft = "8px";
      h4.appendChild(toggle);

      toggle.addEventListener("click", () => {
        nestedWrapper.classList.toggle("collapsed");
        toggle.textContent = nestedWrapper.classList.contains("collapsed")
          ? "▶"
          : "▼";
      });
    }
  }; // -----------------------------------------------------
  const createKeywordList = (group) => {
    const wrapper = document.createElement("div");
    wrapper.className = "group-row"; // 1. keywordList の作成と見出し(h3)の追加をループの外側に出す

    const keywordList = document.createElement("div");
    keywordList.className = "keyword-list";
    keywordList.dataset.target = group.id;

    const h3 = document.createElement("h3");
    h3.textContent = group.label;
    keywordList.appendChild(h3); // 2. keywordList の直下でコンテンツ全体を囲むラッパーを作成（トグル制御対象）

    const mainContentWrapper = document.createElement("div");
    mainContentWrapper.className = "main-content-wrapper collapsed"; // 新しいラッパー

    const toggle = document.createElement("span");
    toggle.className = "toggle";
    toggle.textContent = "▶";
    toggle.style.cursor = "pointer";
    toggle.style.marginLeft = "8px";
    h3.appendChild(toggle); // mainContentWrapper のスタイルを設定して、中の要素を横並びにする

    mainContentWrapper.style.display = "flex";
    mainContentWrapper.style.flexWrap = "wrap";
    mainContentWrapper.style.gap = "20px"; // keyword-list ブロック間の間隔 // 3. ループ内で sub-group を作成し、新しいラッパーに追加する

    group.subgroups.forEach((sg) => {
      // sub-group を直接作成する
      // ★ 注意: createSubGroup は引数の parentElem に子要素を追加します
      createSubGroup(sg, mainContentWrapper);
    }); // 4. 新しいラッパーを keywordList に追加

    keywordList.appendChild(mainContentWrapper); // 5. keywordList を wrapper (group-row) に追加

    wrapper.appendChild(keywordList); // 6. トグルのイベントリスナーを設定（新しいラッパーを制御）

    toggle.addEventListener("click", () => {
      mainContentWrapper.classList.toggle("collapsed");
      toggle.textContent = mainContentWrapper.classList.contains("collapsed")
        ? "▶"
        : "▼";
    });

    container.insertBefore(wrapper, document.getElementById("generate"));
  };
  const generateOutput = () => {
    // ツールチップ追加によりボタンがラッパー内に入ったためセレクタを修正
    const all = [
      ...document.querySelectorAll(
        ".sub-group .tooltip-wrapper button.active, .sub-subgroup .tooltip-wrapper button.active"
      ),
    ]
      .map((btn) => btn.dataset.keyword)
      .filter((k) => k);
    output.textContent = all.join(", ");
    return output.textContent; // 生成された文字列を返す
  }; // -----------------------------------------------------
  UI.groups.forEach(createKeywordList);
  loadState();

  function applyPreset(btn) {
    // 全ボタンのアクティブ解除
    // ツールチップ追加によりボタンがラッパー内に入ったためセレクタを修正
    document
      .querySelectorAll(
        ".sub-group .tooltip-wrapper button, .sub-subgroup .tooltip-wrapper button"
      )
      .forEach((b) => b.classList.remove("active"));

    const activeData = btn.dataset.active
      ? JSON.parse(btn.dataset.active)
      : null;

    if (activeData) {
      // data-active がある場合、key:value に従ってボタンをアクティブ化
      Object.entries(activeData).forEach(([sgId, keywords]) => {
        const subgroup = document.querySelector(`[data-subgroup="${sgId}"]`);
        if (!subgroup) return;
        const kwArray = Array.isArray(keywords) ? keywords : [keywords];
        subgroup.querySelectorAll("button").forEach((b) => {
          if (kwArray.includes(b.dataset.keyword)) b.classList.add("active");
        });
      });
    } else {
      // data-active がない場合は、ボタン自身の value を output にセット
      output.textContent = btn.dataset.keyword || btn.value || "";
    }

    saveState();
  } // generateOutput 関数を使うように修正 (ロジックの重複を解消)

  document.getElementById("generate").addEventListener("click", () => {
    generateOutput();
    saveState(); // 状態を保存
  }); // ⭐ コピーボタンのイベントリスナーを修正

  document.getElementById("copy").addEventListener("click", () => {
    // outputの内容を取得
    let content = output.textContent; // "■,"を全て空文字列に置換（削除） // 正規表現 /■,/g を使用して、文字列内のすべての "■," にマッチさせる
    const cleanedContent = content.replace(/■,/g, ""); // クリップボードに修正後の内容をコピー

    navigator.clipboard.writeText(cleanedContent);
  });

  const clearBtn = document.getElementById("clearAll");
  clearBtn.addEventListener("click", () => {
    const allButtons = document.querySelectorAll(
      // ツールチップ追加によりボタンがラッパー内に入ったためセレクタを修正
      ".sub-group .tooltip-wrapper button, .sub-subgroup .tooltip-wrapper button"
    );
    allButtons.forEach((btn) => btn.classList.remove("active"));
    output.textContent = "";
    localStorage.removeItem("buttonState");
  }); // 履歴管理の初期化とリスナー設定を preset.js に任せる // generateOutput が定義されたため、エラーが解消

  setupPresetListeners(generateOutput, saveState);
  renderHistory(saveState);
});

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
      // ✅ セレクタ修正済み: .tooltip-wrapper 内の button.active を選択
      const activeKeywords = [
        ...sg.querySelectorAll(".tooltip-wrapper button.active"),
      ]
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
      const sgState = state[sg.dataset.subgroup] || []; // ✅ セレクタ修正済み: .tooltip-wrapper 内の button を選択
      sg.querySelectorAll(".tooltip-wrapper button").forEach((b) =>
        b.classList.toggle("active", sgState.includes(b.dataset.keyword))
      );
    });
  }; // 💡 修正: parentId を受け取り、data-subgroup をユニーク化

  const createSubGroup = (
    sgObj,
    parentElem,
    isNested = false,
    parentId = ""
  ) => {
    const subDiv = document.createElement("div");
    subDiv.className = isNested ? "sub-subgroup" : "sub-group"; // ✅ IDをユニーク化: parentId があれば結合、なければ単独
    subDiv.dataset.subgroup = parentId ? `${parentId}_${sgObj.id}` : sgObj.id;

    const h4 = document.createElement("h4");
    h4.textContent = sgObj.label;

    subDiv.appendChild(h4);
    parentElem.appendChild(subDiv);

    const MAX_VISIBLE_BUTTONS = 8;
    let buttonCount = 0;
    const hiddenButtons = [];

    const items = Array.isArray(DICT_MERGED[sgObj.id])
      ? DICT_MERGED[sgObj.id]
      : [];
    items.forEach((item) => {
      if (!item.value) return; // 1. ラッパー要素を作成

      const wrapper = document.createElement("div");
      wrapper.className = "tooltip-wrapper"; // 2. ボタンを作成

      const btn = document.createElement("button");
      btn.dataset.keyword = item.value;
      btn.dataset.exclusive = sgObj.exclusive;
      btn.dataset.noRandom = item.noRandom ? "true" : "false";
      btn.textContent = item.label; // 3. ツールチップ要素を作成

      const tooltip = document.createElement("span");
      tooltip.className = "tooltip-value";
      tooltip.textContent = item.value; // 4. ラッパーにボタンとツールチップを追加

      wrapper.appendChild(btn);
      wrapper.appendChild(tooltip); // 9個目以降のボタンに初期非表示クラスを付与

      if (buttonCount >= MAX_VISIBLE_BUTTONS) {
        wrapper.classList.add("hidden-initial");
        hiddenButtons.push(wrapper);
      }
      buttonCount++;

      if (item.active && typeof item.active === "object") {
        // data-active には、JSONファイル側でユニークなIDを設定する必要があります
        btn.dataset.active = JSON.stringify(item.active);
      }

      btn.addEventListener("click", () => {
        if (btn.dataset.active) {
          // dataset.active がある場合は対応ボタンをアクティブ化
          const activeData = JSON.parse(btn.dataset.active);
          Object.entries(activeData).forEach(([sgId, keywords]) => {
            // sgId はユニークなID (例: group1_color) を想定
            const subgroup = document.querySelector(
              `[data-subgroup="${sgId}"]`
            );
            if (!subgroup) return;
            const kwArray = Array.isArray(keywords) ? keywords : [keywords]; // ✅ セレクタ修正: .tooltip-wrapper 内の button を操作
            subgroup
              .querySelectorAll(".tooltip-wrapper button")
              .forEach((b) => {
                b.classList.toggle(
                  "active",
                  kwArray.includes(b.dataset.keyword)
                );
              });
          });
        } else {
          // 通常のボタン押下処理
          if (sgObj.exclusive) {
            const subDiv = btn.closest(".sub-group, .sub-subgroup"); // ✅ セレクタ修正: ラッパー内のボタンに対して処理を行う
            subDiv.querySelectorAll(".tooltip-wrapper button").forEach((b) => {
              if (b !== btn) b.classList.remove("active");
            });
          }
          btn.classList.toggle("active");
        }

        saveState();
      }); // 5. subDiv にボタンの代わりにラッパーを追加
      subDiv.appendChild(wrapper);
    }); // トグルボタンの追加とイベントリスナーの設定

    if (hiddenButtons.length > 0) {
      const toggleButton = document.createElement("button");
      toggleButton.className = "toggle-more-buttons";
      toggleButton.textContent = `さらに ${hiddenButtons.length} 件表示`;

      subDiv.appendChild(toggleButton);

      toggleButton.addEventListener("click", () => {
        const isCollapsed =
          hiddenButtons[0].classList.contains("hidden-initial");

        hiddenButtons.forEach((w) => {
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
      nestedWrapper.className = "sub-subgroups collapsed"; // 💡 修正: 再帰呼び出し時も親のIDを引き継ぐことで、サブサブグループのIDもユニーク化されます。
      const nextParentId = parentId ? `${parentId}_${sgObj.id}` : sgObj.id;
      sgObj.subgroups.forEach((sub) =>
        createSubGroup(sub, nestedWrapper, true, nextParentId)
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
  };

  const createKeywordList = (group) => {
    const wrapper = document.createElement("div");
    wrapper.className = "group-row";

    const keywordList = document.createElement("div");
    keywordList.className = "keyword-list";
    keywordList.dataset.target = group.id;

    const h3 = document.createElement("h3");
    h3.textContent = group.label;
    keywordList.appendChild(h3);

    const mainContentWrapper = document.createElement("div");
    mainContentWrapper.className = "main-content-wrapper collapsed";

    const toggle = document.createElement("span");
    toggle.className = "toggle";
    toggle.textContent = "▶";
    toggle.style.cursor = "pointer";
    toggle.style.marginLeft = "8px";
    h3.appendChild(toggle);

    mainContentWrapper.style.display = "flex";
    mainContentWrapper.style.flexWrap = "wrap";
    mainContentWrapper.style.gap = "20px";

    group.subgroups.forEach((sg) => {
      // 💡 修正: 親グループのID (group.id) を createSubGroup に渡す
      createSubGroup(sg, mainContentWrapper, false, group.id);
    });

    keywordList.appendChild(mainContentWrapper);

    wrapper.appendChild(keywordList);

    toggle.addEventListener("click", () => {
      mainContentWrapper.classList.toggle("collapsed");
      toggle.textContent = mainContentWrapper.classList.contains("collapsed")
        ? "▶"
        : "▼";
    });

    container.insertBefore(wrapper, document.getElementById("generate"));
  };
  const generateOutput = () => {
    // ✅ セレクタ修正済み: .tooltip-wrapper 内の button.active を正確に選択
    const all = [
      ...document.querySelectorAll(
        ".sub-group .tooltip-wrapper button.active, .sub-subgroup .tooltip-wrapper button.active"
      ),
    ]
      .map((btn) => btn.dataset.keyword)
      .filter((k) => k);
    output.textContent = all.join(", ");
    return output.textContent;
  };
  UI.groups.forEach(createKeywordList);
  loadState();

  function applyPreset(btn) {
    // 全ボタンのアクティブ解除
    // ✅ セレクタ修正済み: .tooltip-wrapper 内の button を正確に選択
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
        // sgId はユニークなID (例: group1_color) を想定
        const subgroup = document.querySelector(`[data-subgroup="${sgId}"]`);
        if (!subgroup) return;
        const kwArray = Array.isArray(keywords) ? keywords : [keywords]; // ✅ セレクタ修正: .tooltip-wrapper 内の button を操作
        subgroup.querySelectorAll(".tooltip-wrapper button").forEach((b) => {
          if (kwArray.includes(b.dataset.keyword)) b.classList.add("active");
        });
      });
    } else {
      output.textContent = btn.dataset.keyword || btn.value || "";
    }

    saveState();
  }

  document.getElementById("generate").addEventListener("click", () => {
    generateOutput();
    saveState();
  });

  document.getElementById("copy").addEventListener("click", () => {
    let content = output.textContent;
    const cleanedContent = content.replace(/■,/g, "");
    navigator.clipboard.writeText(cleanedContent);
  });

  const clearBtn = document.getElementById("clearAll");
  clearBtn.addEventListener("click", () => {
    const allButtons = document.querySelectorAll(
      // ✅ セレクタ修正済み: .tooltip-wrapper 内の button を正確に選択
      ".sub-group .tooltip-wrapper button, .sub-subgroup .tooltip-wrapper button"
    );
    allButtons.forEach((btn) => btn.classList.remove("active"));
    output.textContent = "";
    localStorage.removeItem("buttonState");
  });

  setupPresetListeners(generateOutput, saveState);
  renderHistory(saveState);
});

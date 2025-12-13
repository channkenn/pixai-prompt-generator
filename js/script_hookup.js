import { renderHistory, setupPresetListeners } from "./preset.js";
// 💡 修正: 以下のダミー関数を削除しました。
// const renderHistory = (saveState) => {
//   console.log("renderHistory");
// };
// const setupPresetListeners = (generateOutput, saveState) => {
//   console.log("setupPresetListeners");
// };

document.addEventListener("DOMContentLoaded", async () => {
  // 💡 修正: IDを使うため、データソースがIDを持つことを前提とします。
  const resDict = await fetch("config/data/hookup.json");
  const DICT = await resDict.json();

  const resPreset = await fetch("config/data/preset.json");
  const PRESET = await resPreset.json();

  const DICT_MERGED = { ...DICT, ...PRESET };

  const resUI = await fetch("config/ui/ui_hookup.json");
  const UI = await resUI.json();

  const container = document.querySelector(".container");
  const output = document.getElementById("output");
  const uiRoot = document.getElementById("ui-root"); // --- ユーティリティ: IDからキーワード/バリューを逆引きするためのマップを作成 --- // { 'item_id': 'item_value', ... } のマップ

  const idToValueMap = {}; // 全てのグループを探索し、idとvalueをマッピングする

  const buildIdToValueMap = (data) => {
    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (item.id && item.value) {
          idToValueMap[item.id] = item.value;
        }
      });
    } else if (typeof data === "object" && data !== null) {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          buildIdToValueMap(data[key]);
        }
      }
    }
  };
  buildIdToValueMap(DICT_MERGED); // --------------------------------------------------------------------------
  const saveState = () => {
    const state = {};
    document.querySelectorAll(".sub-group, .sub-subgroup").forEach((sg) => {
      // 💡 修正: active なボタンの data-id を収集
      const activeIds = [
        ...sg.querySelectorAll(".tooltip-wrapper button.active"),
      ]
        .map((b) => b.dataset.itemId)
        .filter((id) => id);
      if (activeIds.length > 0) state[sg.dataset.subgroup] = activeIds;
    }); // 💡 修正: 状態をIDベースで保存
    localStorage.setItem("buttonState", JSON.stringify(state));
  };

  const loadState = () => {
    // 💡 修正: 状態をIDベースでロード
    const state = JSON.parse(localStorage.getItem("buttonState") || "{}");
    document.querySelectorAll(".sub-group, .sub-subgroup").forEach((sg) => {
      const sgState = state[sg.dataset.subgroup] || []; // 💡 修正: ボタンの data-item-id と保存状態を比較
      sg.querySelectorAll(".tooltip-wrapper button").forEach((b) =>
        b.classList.toggle("active", sgState.includes(b.dataset.itemId))
      );
    });
  };

  const createSubGroup = (
    sgObj,
    parentElem,
    isNested = false,
    parentId = ""
  ) => {
    const subDiv = document.createElement("div");
    subDiv.className = isNested ? "sub-subgroup" : "sub-group";
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
      // 💡 修正: item.id が存在するか確認
      if (!item.value || !item.id) return;

      const wrapper = document.createElement("div");
      wrapper.className = "tooltip-wrapper";

      const btn = document.createElement("button"); // 💡 修正: data-keyword -> data-value, data-id -> data-item-id
      btn.dataset.itemId = String(item.id); // IDを文字列として保存
      btn.dataset.value = item.value; // キーワードは data-value として保持 (出力用)
      btn.dataset.exclusive = sgObj.exclusive;
      btn.dataset.noRandom = item.noRandom ? "true" : "false";
      btn.textContent = item.label;

      const tooltip = document.createElement("span");
      tooltip.className = "tooltip-value";
      tooltip.textContent = item.value;

      wrapper.appendChild(btn);
      wrapper.appendChild(tooltip);

      if (buttonCount >= MAX_VISIBLE_BUTTONS) {
        wrapper.classList.add("hidden-initial");
        hiddenButtons.push(wrapper);
      }
      buttonCount++;

      if (item.active && typeof item.active === "object") {
        // data-active の構造: { "subgroup_id": [item_id_1, item_id_2], ...} になることを想定
        // 💡 修正: data-active はIDベースで保存
        btn.dataset.active = JSON.stringify(item.active);
      }

      btn.addEventListener("click", () => {
        if (btn.dataset.active) {
          // data-active がある場合は対応ボタンをアクティブ化
          const activeData = JSON.parse(btn.dataset.active);
          Object.entries(activeData).forEach(([sgId, itemIds]) => {
            const subgroup = document.querySelector(
              `[data-subgroup="${sgId}"]`
            );
            if (!subgroup) return;
            const idArray = Array.isArray(itemIds)
              ? itemIds.map(String)
              : [String(itemIds)];

            subgroup
              .querySelectorAll(".tooltip-wrapper button")
              .forEach((b) => {
                // 💡 修正: ボタンの data-item-id とプリセットのIDを比較
                b.classList.toggle(
                  "active",
                  idArray.includes(b.dataset.itemId)
                );
              });
          });
        } else {
          // 通常のボタン押下処理
          if (sgObj.exclusive) {
            const subDiv = btn.closest(".sub-group, .sub-subgroup");
            subDiv.querySelectorAll(".tooltip-wrapper button").forEach((b) => {
              if (b !== btn) b.classList.remove("active");
            });
          }
          btn.classList.toggle("active");
        }

        saveState();
      });

      subDiv.appendChild(wrapper);
    }); // トグルボタンの処理は変更なし

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
      nestedWrapper.className = "sub-subgroups collapsed";
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
    // 💡 修正: data-value ではなく data-item-id を収集し、IDからValueに変換
    const activeIds = [
      ...document.querySelectorAll(
        ".sub-group .tooltip-wrapper button.active, .sub-subgroup .tooltip-wrapper button.active"
      ),
    ]
      .map((btn) => btn.dataset.itemId)
      .filter((id) => id); // 💡 修正: IDをValueに変換

    const all = activeIds
      .map((id) => idToValueMap[id])
      .filter((value) => value);

    output.textContent = all.join(", ");
    return output.textContent;
  }; // 画面構築

  UI.groups.forEach(createKeywordList); // 状態復元
  loadState(); // 💡 修正: applyPreset関数をIDベースに修正

  function applyPreset(btn) {
    // 全ボタンのアクティブ解除
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
      Object.entries(activeData).forEach(([sgId, itemIds]) => {
        const subgroup = document.querySelector(`[data-subgroup="${sgId}"]`);
        if (!subgroup) return; // 💡 修正: itemIds はIDの配列として処理

        const idArray = Array.isArray(itemIds)
          ? itemIds.map(String)
          : [String(itemIds)];

        subgroup.querySelectorAll(".tooltip-wrapper button").forEach((b) => {
          // 💡 修正: data-item-id とプリセットのIDを比較
          if (idArray.includes(b.dataset.itemId)) b.classList.add("active");
        });
      });
    } else {
      // プリセットボタン自体がキーワードを持つ場合（そのまま出力）
      output.textContent = btn.dataset.value || btn.value || "";
    }

    saveState();
  } // イベントリスナーのセットアップ（変更なし）

  document.getElementById("generate").addEventListener("click", () => {
    generateOutput();
    saveState();
  });

  document.getElementById("copy").addEventListener("click", () => {
    let content = output.textContent;
    const cleanedContent = content.replace(/■,/g, ""); // navigator.clipboard.writeText(cleanedContent); // execCommandを使用
    const tempTextarea = document.createElement("textarea");
    tempTextarea.value = cleanedContent;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("コピー失敗", err);
    }
    document.body.removeChild(tempTextarea);
  });

  const clearBtn = document.getElementById("clearAll");
  clearBtn.addEventListener("click", () => {
    const allButtons = document.querySelectorAll(
      ".sub-group .tooltip-wrapper button, .sub-subgroup .tooltip-wrapper button"
    );
    allButtons.forEach((btn) => btn.classList.remove("active"));
    output.textContent = "";
    localStorage.removeItem("buttonState");
  }); // preset.js 側の関数呼び出し

  setupPresetListeners(generateOutput, saveState);
  renderHistory(saveState);
});

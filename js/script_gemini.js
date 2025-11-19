document.addEventListener("DOMContentLoaded", async () => {
  const resDict = await fetch("config/data/gemini.json");
  const DICT = await resDict.json();

  const resPreset = await fetch("config/data/preset.json");
  const PRESET = await resPreset.json();

  const DICT_MERGED = { ...DICT, ...PRESET };

  const resUI = await fetch("config/ui/ui_gemini.json");
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
    parentElem.appendChild(subDiv);

    const items = Array.isArray(DICT_MERGED[sgObj.id])
      ? DICT_MERGED[sgObj.id]
      : [];
    // ボタン生成時
    items.forEach((item) => {
      if (!item.value) return;
      const btn = document.createElement("button");
      btn.dataset.keyword = item.value;
      btn.dataset.exclusive = sgObj.exclusive;
      btn.dataset.noRandom = item.noRandom ? "true" : "false";
      btn.textContent = item.label;

      // item.active があれば dataset に保持する
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
            const subDiv = btn.closest(".sub-group, .sub-subgroup");
            subDiv.querySelectorAll("button").forEach((b) => {
              if (b !== btn) b.classList.remove("active");
            });
          }
          btn.classList.toggle("active");
        }

        saveState();
      });

      subDiv.appendChild(btn);
    });

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
  };

  const createKeywordList = (group) => {
    const wrapper = document.createElement("div");
    wrapper.className = "group-row";

    const leftCol = document.createElement("div");
    leftCol.className = "left-column";

    const rightCol = document.createElement("div");
    rightCol.className = "right-column";

    group.subgroups.forEach((sg) => {
      const keywordList = document.createElement("div");
      keywordList.className = "keyword-list";
      keywordList.dataset.target = group.id;

      const h3 = document.createElement("h3");
      h3.textContent = group.label;
      keywordList.appendChild(h3);

      createSubGroup(sg, keywordList);
      leftCol.appendChild(keywordList);
    });

    wrapper.appendChild(leftCol);
    wrapper.appendChild(rightCol);
    container.insertBefore(wrapper, document.getElementById("generate"));
  };

  UI.groups.forEach(createKeywordList);
  loadState();

  function applyPreset(btn) {
    // 全ボタンのアクティブ解除
    document
      .querySelectorAll(".sub-group, .sub-subgroup button")
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
  }

  document.getElementById("generateLabel").addEventListener("click", () => {
    const out = [];
    document.querySelectorAll(".sub-group, .sub-subgroup").forEach((sg) => {
      const sgId = sg.dataset.subgroup;
      const active = [...sg.querySelectorAll("button.active")]
        .map((b) => b.dataset.keyword)
        .filter((k) => k);
      if (active.length > 0) out.push(`${sgId}: ${active.join(", ")}`);
    });
    output.textContent = out.join("\n");
  });

  document.getElementById("generate").addEventListener("click", () => {
    const all = [
      ...document.querySelectorAll(
        ".sub-group button.active, .sub-subgroup button.active"
      ),
    ]
      .map((btn) => btn.dataset.keyword)
      .filter((k) => k);
    output.textContent = all.join(", ");
  });

  document.getElementById("copy").addEventListener("click", () => {
    navigator.clipboard.writeText(output.textContent);
  });

  const clearBtn = document.getElementById("clearAll");
  clearBtn.addEventListener("click", () => {
    const allButtons = document.querySelectorAll(
      ".sub-group button, .sub-subgroup button"
    );
    allButtons.forEach((btn) => btn.classList.remove("active"));
    output.textContent = "";
    localStorage.removeItem("buttonState");
  });

  const randomBtn = document.createElement("button");
  randomBtn.textContent = "ランダム選択";
  randomBtn.id = "randomSelect";
  container.appendChild(randomBtn);

  randomBtn.addEventListener("click", () => {
    document.querySelectorAll(".sub-group, .sub-subgroup").forEach((sg) => {
      const btns = [...sg.querySelectorAll("button")].filter(
        (b) => b.dataset.noRandom !== "true"
      );
      const isExclusive = btns[0]?.dataset.exclusive === "true";
      if (btns.length === 0) return;
      if (isExclusive) {
        const r = Math.floor(Math.random() * btns.length);
        btns.forEach((b, i) => b.classList.toggle("active", i === r));
      } else {
        btns.forEach((b) => b.classList.toggle("active", Math.random() < 0.5));
      }
    });
  });
});

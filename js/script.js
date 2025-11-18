document.addEventListener("DOMContentLoaded", async () => {
  const resDict = await fetch("config/data/default.json");
  const DICT = await resDict.json();

  const resPreset = await fetch("config/data/preset.json");
  const PRESET = await resPreset.json();

  const DICT_MERGED = { ...DICT, ...PRESET };

  const resUI = await fetch("config/ui/ui.json");
  const UI = await resUI.json();

  const container = document.querySelector(".container");
  const output = document.getElementById("output");

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
    items.forEach((item) => {
      if (!item.value) return;
      const btn = document.createElement("button");
      btn.dataset.keyword = item.value;
      btn.dataset.exclusive = sgObj.exclusive;
      btn.dataset.noRandom = item.noRandom ? "true" : "false";
      btn.textContent = item.label;

      btn.addEventListener("click", () => {
        if (sgObj.exclusive) {
          subDiv.querySelectorAll("button").forEach((b) => {
            if (b !== btn) b.classList.remove("active");
          });
        }
        btn.classList.toggle("active");
        saveState();
      });

      subDiv.appendChild(btn);
    });

    if (sgObj.subgroups) {
      const nestedWrapper = document.createElement("div");
      nestedWrapper.className = "sub-subgroups collapsed"; // 初期閉じ
      sgObj.subgroups.forEach((sub) =>
        createSubGroup(sub, nestedWrapper, true)
      );
      subDiv.appendChild(nestedWrapper);

      const toggle = document.createElement("span");
      toggle.className = "toggle"; // ← 追加して CSS 適用
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

  // 以下は以前のプリセットや生成、ランダム選択などの処理はそのまま
  function applyPreset(preset) {
    document
      .querySelectorAll(".sub-group, .sub-subgroup button")
      .forEach((b) => b.classList.remove("active"));
    if (!preset.active) return;
    Object.entries(preset.active).forEach(([sgId, keywords]) => {
      const subgroup = document.querySelector(`[data-subgroup="${sgId}"]`);
      if (!subgroup) return;
      const kwArray = Array.isArray(keywords) ? keywords : [keywords];
      subgroup.querySelectorAll("button").forEach((btn) => {
        if (kwArray.includes(btn.dataset.keyword)) btn.classList.add("active");
      });
    });
    saveState();
  }

  if (PRESET.preset_tags) {
    const presetBox = document.createElement("div");
    presetBox.id = "presetBox";
    presetBox.innerHTML = `<h3>プリセット</h3>`;
    container.insertBefore(presetBox, container.firstChild);

    PRESET.preset_tags.forEach((preset) => {
      const pbtn = document.createElement("button");
      pbtn.textContent = preset.label;
      pbtn.addEventListener("click", () => applyPreset(preset));
      presetBox.appendChild(pbtn);
    });
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
      ...document.querySelectorAll(".sub-group, .sub-subgroup button.active"),
    ]
      .map((btn) => btn.dataset.keyword)
      .filter((k) => k);
    output.textContent = all.join(", ");
  });

  document.getElementById("copy").addEventListener("click", () => {
    navigator.clipboard.writeText(output.textContent);
  });

  const randomBtn = document.createElement("button");
  randomBtn.textContent = "ランダム選択";
  randomBtn.id = "randomSelect";
  container.insertBefore(randomBtn, document.getElementById("generate"));

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

document.getElementById("clearAll").addEventListener("click", () => {
  document
    .querySelectorAll(".sub-group, .sub-subgroup button")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("output").textContent = "";
  localStorage.removeItem("buttonState");
});

document.addEventListener("DOMContentLoaded", async () => {
  const resDict = await fetch("config/data/default.json");
  const DICT = await resDict.json();

  const resPreset = await fetch("config/data/preset.json");
  const PRESET = await resPreset.json();

  // default.json と preset.json をマージ
  const DICT_MERGED = { ...DICT, ...PRESET };

  const resUI = await fetch("config/ui/ui.json");
  const UI = await resUI.json();

  const container = document.querySelector(".container");
  const output = document.getElementById("output");

  // 保存・復元
  const saveState = () => {
    const state = {};
    document.querySelectorAll(".sub-group").forEach((sg) => {
      const activeKeywords = [...sg.querySelectorAll("button.active")].map(
        (b) => b.dataset.keyword
      );
      if (activeKeywords.length > 0)
        state[sg.dataset.subgroup] = activeKeywords;
    });
    localStorage.setItem("buttonState", JSON.stringify(state));
  };

  const loadState = () => {
    const state = JSON.parse(localStorage.getItem("buttonState") || "{}");
    document.querySelectorAll(".sub-group").forEach((sg) => {
      const sgState = state[sg.dataset.subgroup] || [];
      sg.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("active", sgState.includes(b.dataset.keyword));
      });
    });
  };

  // UI生成
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

      const subGroupDiv = document.createElement("div");
      subGroupDiv.className = "sub-group";
      subGroupDiv.dataset.subgroup = sg.id;

      const h4 = document.createElement("h4");
      h4.textContent = sg.label;
      subGroupDiv.appendChild(h4);

      const items = Array.isArray(DICT_MERGED[sg.id]) ? DICT_MERGED[sg.id] : [];
      items.forEach((item) => {
        const btn = document.createElement("button");
        btn.dataset.keyword = item.value;
        btn.dataset.exclusive = sg.exclusive;
        btn.textContent = item.label;

        btn.addEventListener("click", () => {
          if (item.active && typeof item.active === "object") {
            // item.active に基づき各サブグループのボタンをアクティブ化
            Object.entries(item.active).forEach(([targetSgId, keywords]) => {
              const subgroup = document.querySelector(
                `.sub-group[data-subgroup="${targetSgId}"]`
              );
              if (!subgroup) return;

              // 配列として扱う
              const kwArray = Array.isArray(keywords) ? keywords : [keywords];
              console.log(kwArray);
              // すべてのボタンを一旦非アクティブ（排他ではない場合は不要）
              // subgroup
              //   .querySelectorAll("button")
              //   .forEach((b) => b.classList.remove("active"));

              // 配列内のすべてのキーワードをアクティブに
              kwArray.forEach((kw) => {
                const targetBtn = subgroup.querySelector(
                  `button[data-keyword="${kw}"]`
                );
                if (targetBtn) targetBtn.classList.add("active");
              });
            });
          } else {
            // 通常ボタンの挙動
            const isExclusive = btn.dataset.exclusive === "true";
            if (isExclusive) {
              subGroupDiv.querySelectorAll("button").forEach((b) => {
                if (b !== btn) b.classList.remove("active");
              });
            }
            btn.classList.toggle("active");
          }

          saveState();
        });

        subGroupDiv.appendChild(btn);
      });

      keywordList.appendChild(subGroupDiv);
      leftCol.appendChild(keywordList);
    });

    wrapper.appendChild(leftCol);
    wrapper.appendChild(rightCol);
    container.insertBefore(wrapper, document.getElementById("generate"));
  };

  UI.groups.forEach(createKeywordList);
  loadState();

  // プリセット適用処理（安全版）
  function applyPreset(preset) {
    // まずすべてのボタンを非アクティブ化
    document.querySelectorAll(".sub-group button").forEach((b) => {
      b.classList.remove("active");
    });

    if (!preset.active) return;

    // preset.active の各サブグループIDとキーワードを処理
    Object.entries(preset.active).forEach(([sgId, keywords]) => {
      const subgroup = document.querySelector(
        `.sub-group[data-subgroup="${sgId}"]`
      );
      if (!subgroup) return;

      // keywords が配列でなければ配列化
      const kwArray = Array.isArray(keywords) ? keywords : [keywords];

      subgroup.querySelectorAll("button").forEach((btn) => {
        if (kwArray.includes(btn.dataset.keyword)) {
          btn.classList.add("active");
        }
      });
    });

    // 状態保存
    saveState();
  }

  // プリセットボタン生成
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

  // 出力生成
  document.getElementById("generateLabel").addEventListener("click", () => {
    const out = [];
    document.querySelectorAll(".sub-group").forEach((sg) => {
      const sgId = sg.dataset.subgroup;
      const active = [...sg.querySelectorAll("button.active")].map(
        (b) => b.dataset.keyword
      );
      if (active.length > 0) out.push(`${sgId}: ${active.join(", ")}`);
    });
    output.textContent = out.join("\n");
  });

  document.getElementById("generate").addEventListener("click", () => {
    const all = [];
    document.querySelectorAll(".sub-group button.active").forEach((btn) => {
      all.push(btn.dataset.keyword);
    });
    output.textContent = all.join(", ");
  });

  document.getElementById("copy").addEventListener("click", () => {
    navigator.clipboard.writeText(output.textContent);
  });

  // ランダム選択
  const randomBtn = document.createElement("button");
  randomBtn.textContent = "ランダム選択";
  randomBtn.id = "randomSelect";
  container.insertBefore(randomBtn, document.getElementById("generate"));

  randomBtn.addEventListener("click", () => {
    document.querySelectorAll(".sub-group").forEach((sg) => {
      const btns = sg.querySelectorAll("button");
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

// 全クリア
document.getElementById("clearAll").addEventListener("click", () => {
  document
    .querySelectorAll(".sub-group button")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("output").textContent = "";
  localStorage.removeItem("buttonState");
});

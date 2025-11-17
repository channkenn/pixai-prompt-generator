document.addEventListener("DOMContentLoaded", async () => {
  const resDict = await fetch("config/data/default.json");
  const DICT = await resDict.json();

  const resUI = await fetch("config/ui/ui.json");
  const UI = await resUI.json();

  const container = document.querySelector(".container");
  const output = document.getElementById("output");

  // 保存・復元用関数
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
      subGroupDiv.dataset.id = sg.id;

      const h4 = document.createElement("h4");
      h4.textContent = sg.label;
      subGroupDiv.appendChild(h4);

      const items = Array.isArray(DICT[sg.id]) ? DICT[sg.id] : [];
      items.forEach((item) => {
        const btn = document.createElement("button");
        btn.dataset.keyword = item.value;
        btn.dataset.exclusive = sg.exclusive;
        btn.textContent = item.label;

        btn.addEventListener("click", () => {
          const isExclusive = btn.dataset.exclusive === "true";
          if (isExclusive) {
            subGroupDiv.querySelectorAll("button").forEach((b) => {
              if (b !== btn) b.classList.remove("active");
            });
            btn.classList.toggle("active");
          } else {
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

  document.getElementById("generateLabel").addEventListener("click", () => {
    const outputLines = [];
    document.querySelectorAll(".sub-group").forEach((sg) => {
      const sgId = sg.dataset.subgroup;
      const activeKeywords = [...sg.querySelectorAll("button.active")].map(
        (b) => b.dataset.keyword
      );
      if (activeKeywords.length > 0) {
        outputLines.push(`${sgId}: ${activeKeywords.join(", ")}`);
      }
    });
    output.textContent = outputLines.join("\n");
  });

  document.getElementById("generate").addEventListener("click", () => {
    const allActiveKeywords = [];
    document.querySelectorAll(".sub-group").forEach((sg) => {
      sg.querySelectorAll("button.active").forEach((btn) => {
        allActiveKeywords.push(btn.dataset.keyword);
      });
    });
    output.textContent = allActiveKeywords.join(", ");
  });

  document.getElementById("copy").addEventListener("click", () => {
    navigator.clipboard.writeText(output.textContent);
  });

  // ランダム選択ボタン作成
  const randomBtn = document.createElement("button");
  randomBtn.textContent = "ランダム選択";
  randomBtn.id = "randomSelect";
  document
    .querySelector(".container")
    .insertBefore(randomBtn, document.getElementById("generate"));

  document.getElementById("randomSelect").addEventListener("click", () => {
    document.querySelectorAll(".sub-group").forEach((sg) => {
      const buttons = sg.querySelectorAll("button");
      const isExclusive = buttons[0]?.dataset.exclusive === "true";
      if (buttons.length === 0) return;

      if (isExclusive) {
        const randomIndex = Math.floor(Math.random() * buttons.length);
        buttons.forEach((b, i) => {
          b.classList.toggle("active", i === randomIndex);
        });
      } else {
        buttons.forEach((b) => {
          b.classList.toggle("active", Math.random() < 0.5);
        });
      }
    });
  });
});
// 全ボタンクリア
document.getElementById("clearAll").addEventListener("click", () => {
  document.querySelectorAll(".sub-group button").forEach((b) => {
    b.classList.remove("active");
  });
  document.getElementById("output").textContent = ""; // 出力もクリア
  localStorage.removeItem("buttonState"); // 保存状態もクリア
});

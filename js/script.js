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

    const block = document.createElement("div");
    block.className = "block";

    const labelEl = document.createElement("label");
    labelEl.textContent = group.label;
    block.appendChild(labelEl);

    const textarea = document.createElement("textarea");
    textarea.id = group.id;
    textarea.rows = 4;
    textarea.placeholder = `例: ${group.subgroups
      .map((sg) => sg.id)
      .join(", ")}`;
    block.appendChild(textarea);
    rightCol.appendChild(block);

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

          const allActive = [];
          leftCol.querySelectorAll(".sub-group").forEach((sg2) => {
            sg2
              .querySelectorAll("button.active")
              .forEach((b) => allActive.push(b.dataset.keyword));
          });
          textarea.value = allActive.join(", ");

          saveState(); // 状態を保存
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

  loadState(); // ページロード時に状態を復元

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
    const allValues = [];
    UI.groups.forEach((group) => {
      const textarea = document.getElementById(group.id);
      if (!textarea) return;
      const vals = textarea.value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      allValues.push(...vals);
    });
    output.textContent = allValues.join(", ");
  });

  document.getElementById("copy").addEventListener("click", () => {
    navigator.clipboard.writeText(output.textContent);
  });
});

// ランダム選択ボタンを作成
const randomBtn = document.createElement("button");
randomBtn.textContent = "ランダム選択";
randomBtn.id = "randomSelect";
document
  .querySelector(".container")
  .insertBefore(randomBtn, document.getElementById("generate"));

// ランダム選択ボタン
document.getElementById("randomSelect").addEventListener("click", () => {
  document.querySelectorAll(".sub-group").forEach((sg) => {
    const buttons = sg.querySelectorAll("button");
    const isExclusive = buttons[0]?.dataset.exclusive === "true";

    if (buttons.length === 0) return;

    if (isExclusive) {
      // 排他ボタンならランダムで1つだけ
      const randomIndex = Math.floor(Math.random() * buttons.length);
      buttons.forEach((b, i) => {
        if (i === randomIndex) b.classList.add("active");
        else b.classList.remove("active");
      });
    } else {
      // 非排他なら 50% の確率で押す
      buttons.forEach((b) => {
        b.classList.toggle("active", Math.random() < 0.5);
      });
    }

    // textarea 更新
    const activeKeywords = [...sg.querySelectorAll("button.active")].map(
      (b) => b.dataset.keyword
    );
    const targetId = sg.closest(".keyword-list").dataset.target;
    const textarea = document.getElementById(targetId);
    if (textarea) textarea.value = activeKeywords.join(", ");
  });
});

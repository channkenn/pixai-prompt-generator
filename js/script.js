// script.js
document.addEventListener("DOMContentLoaded", async () => {
  const resDict = await fetch("config/data/default.json");
  const DICT = await resDict.json();

  const resUI = await fetch("config/ui/ui.json");
  const UI = await resUI.json();

  const container = document.querySelector(".container");

  // ボタン群生成
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
      subGroupDiv.dataset.id = sg.id; // ★ 追加（label 出力用）

      const h4 = document.createElement("h4");
      h4.textContent = sg.label;
      subGroupDiv.appendChild(h4);

      const items = Array.isArray(DICT[sg.id]) ? DICT[sg.id] : [];
      items.forEach((key) => {
        const btn = document.createElement("button");
        btn.dataset.keyword = key;
        btn.dataset.exclusive = sg.exclusive;
        btn.textContent = key;
        subGroupDiv.appendChild(btn);
      });

      keywordList.appendChild(subGroupDiv);
      leftCol.appendChild(keywordList);
    });

    wrapper.appendChild(leftCol);
    wrapper.appendChild(rightCol);
    container.insertBefore(wrapper, document.getElementById("generate"));
  };

  // 各グループ生成
  UI.groups.forEach(createKeywordList);

  // ボタンイベント
  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.closest(".keyword-list").dataset.target;
      const textarea = document.getElementById(targetId);
      const isExclusive = btn.dataset.exclusive === "true";

      const subgroup = btn.closest(".sub-group");

      if (isExclusive) {
        subgroup.querySelectorAll("button").forEach((b) => {
          if (b !== btn) b.classList.remove("active");
        });
        btn.classList.toggle("active");
      } else {
        btn.classList.toggle("active");
      }

      const allActive = [];
      btn
        .closest(".left-column")
        .querySelectorAll(".sub-group")
        .forEach((sg) => {
          sg.querySelectorAll("button.active").forEach((b) => {
            allActive.push(b.dataset.keyword);
          });
        });

      textarea.value = allActive.join(", ");
    });
  });

  // --- ラベル付き生成ボタン（sub-group.id ベース） ---
  document.getElementById("generateLabel").addEventListener("click", () => {
    const outputLines = [];

    // DOM 上のすべての sub-group を取得
    document.querySelectorAll(".sub-group").forEach((sg) => {
      const sgId = sg.dataset.subgroup; // sub-group の id
      const activeKeywords = [...sg.querySelectorAll("button.active")].map(
        (b) => b.dataset.keyword
      );

      if (activeKeywords.length > 0) {
        outputLines.push(`${sgId}: ${activeKeywords.join(", ")}`);
      }
    });

    output.textContent = outputLines.join("\n");
  });

  // --- カンマ区切りプロンプト生成（AI用） ---
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

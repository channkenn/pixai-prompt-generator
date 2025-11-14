document.addEventListener("DOMContentLoaded", () => {
  const keywordLists = document.querySelectorAll(".keyword-list");

  keywordLists.forEach((list) => {
    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = list.dataset.target;
        const textarea = document.getElementById(targetId);
        const keyword = btn.dataset.keyword;
        const isExclusive = btn.dataset.exclusive === "true";

        // exclusive-group の処理
        if (isExclusive) {
          const groupBtns = btn.parentElement.querySelectorAll("button");
          groupBtns.forEach((b) => {
            if (b !== btn) {
              b.classList.remove("active");
              textarea.value = textarea.value
                .split(", ")
                .filter((k) => k !== b.dataset.keyword)
                .join(", ");
            }
          });

          if (!btn.classList.contains("active")) {
            btn.classList.add("active");
            if (!textarea.value.includes(keyword)) {
              textarea.value += (textarea.value ? ", " : "") + keyword;
            }
          } else {
            btn.classList.remove("active");
            textarea.value = textarea.value
              .split(", ")
              .filter((k) => k !== keyword)
              .join(", ");
          }
          return;
        }

        // sub-group トグル処理
        if (!btn.classList.contains("active")) {
          btn.classList.add("active");
          if (!textarea.value.includes(keyword)) {
            textarea.value += (textarea.value ? ", " : "") + keyword;
          }
        } else {
          btn.classList.remove("active");
          textarea.value = textarea.value
            .split(", ")
            .filter((k) => k !== keyword)
            .join(", ");
        }
      });
    });
  });

  // Generate Prompt
  const generateBtn = document.getElementById("generate");
  const output = document.getElementById("output");

  generateBtn.addEventListener("click", () => {
    const trigger = document.getElementById("trigger").value;
    const character = document.getElementById("character").value;
    const ground = document.getElementById("ground").value;
    const background = document.getElementById("background").value;
    const time = document.getElementById("time").value;

    const formatBlock = (text) =>
      text.trim() ? text.trim().replace(/,$/, "") + "," : "";

    const result = `### Word Trigger\n${formatBlock(
      trigger
    )}\n\n### Character\n${formatBlock(character)}\n\n### Ground\n${formatBlock(
      ground
    )}\n\n### Background\n${formatBlock(
      background
    )}\n\n### Time / Weather\n${formatBlock(time)}`;

    output.textContent = result;
  });

  // Copy Result
  const copyBtn = document.getElementById("copy");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(output.textContent);
  });
});

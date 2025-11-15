import { DICT } from "./constants.js";

document.addEventListener("DOMContentLoaded", () => {
  const keywordLists = document.querySelectorAll(".keyword-list");

  // ボタン選択処理
  keywordLists.forEach((list) => {
    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = list.dataset.target;
        const textarea = document.getElementById(targetId);
        const isExclusive = btn.dataset.exclusive === "true";

        // 親の sub-group を取得
        const subgroupElement = btn.parentElement;

        // ---- 排他処理 ----
        if (isExclusive) {
          const groupBtns = subgroupElement.querySelectorAll("button");
          groupBtns.forEach((b) => {
            if (b !== btn) b.classList.remove("active");
          });
          btn.classList.toggle("active");
        } else {
          btn.classList.toggle("active");
        }

        // ---- textarea 更新処理 ----
        // sub-group 関係なく全 active ボタンを走査して textarea に反映
        const allActiveKeywords = Array.from(
          list.querySelectorAll("button.active")
        ).map((b) => {
          const subgroup = b.parentElement.dataset.subgroup;
          const key = b.dataset.keyword;

          switch (subgroup) {
            case "characterCount":
              return DICT.characterCount[key] || key;
            case "action":
              return DICT.action[key] || key;
            case "pose":
              return DICT.pose[key] || key;
            case "expression":
              return DICT.expression[key] || key;
            case "angle":
              return DICT.angle[key] || key;
            case "distance":
              return DICT.distance[key] || key;
            default:
              return DICT[targetId]?.[key] || key;
          }
        });

        textarea.value = allActiveKeywords.join(", ");
      });
    });
  });

  // --- Generate Prompt ---
  const output = document.getElementById("output");

  // カンマ区切り生成
  document.getElementById("generate").addEventListener("click", () => {
    const blocks = [
      "trigger",
      "character",
      "outfit",
      "accessory",
      "ground",
      "background",
      "sky",
    ];
    const formatBlock = (id) => {
      const val = document.getElementById(id).value.trim();
      return val ? val.replace(/,$/, "") + "," : "";
    };
    output.textContent = blocks.map(formatBlock).join("\n");
  });

  // 英文生成
  document.getElementById("generateEnglish")?.addEventListener("click", () => {
    const trigger = document.getElementById("trigger").value;
    const character = document.getElementById("character").value;
    const outfit = document.getElementById("outfit").value;
    const accessory = document.getElementById("accessory").value;
    const ground = document.getElementById("ground").value;
    const groundtexture = document.getElementById("groundtexture").value;
    const background = document.getElementById("background").value;
    const sky = document.getElementById("sky").value;

    // --- Character ---
    const charArr = character.split(", ").map((c) => c.trim());
    const count = charArr.find((k) => DICT.characterCount[k]) || "";
    const expr = charArr.find((k) => DICT.expression[k]) || "";
    const act = charArr.find((k) => DICT.action[k]) || "";
    const ang = charArr.find((k) => DICT.angle[k]) || "";
    const dist = charArr.find((k) => DICT.distance?.[k]) || "";

    const charSentence = count
      ? `A ${DICT.expression[expr] || ""} ${DICT.characterCount[count] || ""} ${
          DICT.action[act] || ""
        }, viewed from a ${DICT.angle[ang] || ""} at ${
          DICT.distance[dist] || ""
        },`
      : "";

    // Outfit
    const outfitSentence = outfit
      .split(", ")
      .map((o) => DICT.outfit[o])
      .filter(Boolean)
      .join(", ");

    // Accessory
    const accessorySentence = accessory
      .split(", ")
      .map((a) => DICT.accessory[a])
      .filter(Boolean)
      .join(", ");

    // Ground
    const groundSentence = ground
      .split(", ")
      .map((g) => DICT.ground[g])
      .filter(Boolean)
      .join(", ");
    const groundtextureSentence = groundtexture
      .split(", ")
      .map((gt) => DICT.groundtexture[gt])
      .filter(Boolean)
      .join(", ");

    // Background
    const bgSentence = background
      .split(", ")
      .map((b) => DICT.background[b])
      .filter(Boolean)
      .join(", ");

    // Sky
    const skyArr = sky.split(", ").map((sk) => sk.trim());
    const skySentence =
      `shot at ${DICT.time[skyArr[0]] || ""}` +
      (skyArr[1] ? ` under ${DICT.sky[skyArr[1]]}` : "") +
      ",";

    const triggerSentence = trigger ? `${trigger.split(", ").join(",")},` : "";

    output.textContent = [
      triggerSentence,
      charSentence,
      outfitSentence ? `Wearing ${outfitSentence},` : "",
      accessorySentence ? `Accessories: ${accessorySentence},` : "",
      `Standing on ${groundSentence}` +
        (groundtextureSentence ? ` with ${groundtextureSentence}` : "") +
        ",",
      `With ${bgSentence} in the background,`,
      skySentence,
    ]
      .filter(Boolean)
      .join(" ");
  });

  // Copy Result
  document.getElementById("copy").addEventListener("click", () => {
    navigator.clipboard.writeText(output.textContent);
  });
});

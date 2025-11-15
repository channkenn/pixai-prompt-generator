// constants.js
export const DICT = {
  characterCount: {
    "1girl": "girl",
    "2girls": "girls",
  },

  action: {
    dancing: "dancing gracefully",
    running: "running fast",
    jumping: "jumping high",
    sitting: "sitting",
    walking: "walking leisurely",
    swimming: "swimming",
  },
  pose: {
    standing: "standing upright",
    sitting: "sitting relaxed",
    kneeling: "kneeling",
    lying_down: "lying down",
    crouching: "crouching",
    leaning: "leaning against something",
    arms_crossed: "arms crossed",
    hands_on_hips: "hands on hips",
    looking_up: "looking up",
    looking_down: "looking down",
  },
  expression: {
    smiling: "smiling",
    serious: "serious",
    angry: "angry",
    sad: "sad",
    surprised: "surprised",
    confused: "confused",
    happy: "happy",
    laughing: "laughing",
    crying: "crying",
    shocked: "shocked",
    tired: "tired",
    determined: "determined",
    scared: "scared",
    neutral: "neutral",
    embarrassed: "embarrassed",
    thinking: "thinking",
  },

  angle: {
    "low angle": "low angle",
    "high angle": "high angle",
    "eye level": "eye level",
    "bird's eye": "bird's eye view",
    "worm's eye": "worm's eye view",
    "over the shoulder": "over-the-shoulder view",
  },

  direction: {
    "front view": "front view",
    "side view": "side view",
    "back view": "back view",
    "three-quarter view": "three-quarter view",
    "3/4 view": "three-quarter view",
  },

  distance: {
    "close-up": "close-up shot",
    "medium shot": "medium shot",
    "long shot": "long shot",
    "full body": "full-body shot",
    "extreme close-up": "extreme close-up shot",
  },

  // --- Ground (材質のみ) ---
  ground: {
    "uyuni salt flats": "the Uyuni salt flats",
    asphalt: "asphalt ground",
    sand: "sandy ground",
    gravel: "gravel ground",
    grass: "grassy field",
    snow: "snow-covered ground",
    "stone tiles": "stone tile floor",
    "wooden floor": "wooden floor",
    "brick pavement": "brick pavement",
    carpet: "carpeted floor",
    tiles: "tiled floor",
    marble: "marble floor",
    concrete: "concrete floor",
    tatami: "tatami mat floor",
  },

  // --- Ground Texture (特性のみ) ---
  groundtexture: {
    wet: "wet texture",
    dry: "dry texture",
    reflective: "reflective surface",
    rough: "rough texture",
    smooth: "smooth texture",
    soft: "soft texture", // カーペット向け
    plush: "plush surface", // 高級カーペット向け
    polished: "polished surface", // 大理石、タイル向け
    shiny: "shiny surface", // 光沢のある床
    matte: "matte surface", // つや消し床
  },

  // --- Background (名詞句に統一) ---
  background: {
    "European castle": "a European castle",
    mountain: "mountains",
    forest: "a forest",
    desert: "a desert landscape",
    lake: "a lake",
    "city skyline": "a city skyline",
    village: "a village scene",
    temple: "a temple building",
    waterfall: "a waterfall",
    living_room: "a living room",
    bedroom: "a bedroom",
    kitchen: "a kitchen",
    office: "an office interior",
    hallway: "a hallway",
    library: "a library room",
    laboratory: "a lab interior",
    temple_interior: "an interior of a temple",
  },
  sky: {
    daytime: "day sky",
    night: "night sky",
    dawn: "dawn sky",
    sunset: "sunset sky",
    clear: "clear sky",
    cloudy: "cloudy sky",
    rainy: "rainy sky",
    foggy: "foggy sky",
    snowy: "snowy sky",
    starry: "starry sky",
    moon: "moon in the sky",
    aurora: "aurora in the sky",
  },

  // Outfit → 服装のみ（小物は accessory へ統合）
  outfit: {
    "official outfit": "official outfit",
    casual: "casual clothes",
    formal: "formal attire",
    "school uniform": "school uniform",
    "school swimsuit": "school swimsuit",
    armor: "armor",
    kimono: "kimono",
    bikini: "bikini",
    jacket: "jacket",
    hoodie: "hoodie",
  },

  // Accessory（小物に統合）
  accessory: {
    hat: "hat",
    glasses: "glasses",
    scarf: "scarf",
    necklace: "necklace",
    earrings: "earrings",
    watch: "watch",
    bracelet: "bracelet",
    ring: "ring",
    bag: "bag",
  },
};

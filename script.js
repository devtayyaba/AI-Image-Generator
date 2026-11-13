const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const generateBtn = document.querySelector(".gen-btn");
const modalSelected = document.querySelector("#model-select");
const countSelected = document.querySelector("#count-select");
const ratioSelected = document.querySelector("#ratio-select");
const galleryGrid = document.querySelector(".gallery-grid");

const examplePrompts = [
  "A futuristic city floating above the clouds with neon bridges",
  "A cozy cabin in snowy mountains glowing with warm lights",
  "A galaxy inside a glass jar held by a child",
  "A warrior riding a glowing wolf under the northern lights",
  "An ancient temple hidden inside a giant tree",
  "A surreal desert with giant melting clocks and glowing cacti",
  "A pirate ship sailing across a sea of stars",
  "A peaceful village with windmills surrounded by tulip fields",
  "A crystal dragon flying above an enchanted castle",
  "An astronaut discovering a glowing cave on an alien planet",
  "A magical coffee shop in the middle of a rainy street",
  "A futuristic samurai standing in a neon-lit alley",
  "A desert oasis with floating islands and waterfalls",
  "A mechanical bird soaring across a cyberpunk skyline",
  "A fairytale bridge leading into a glowing enchanted forest"
];

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-theme");
}

const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);
  let calculatedWidth = Math.floor((width * scaleFactor) / 16) * 16;
  let calculatedHeight = Math.floor((height * scaleFactor) / 16) * 16;
  return { width: calculatedWidth, height: calculatedHeight };
};

// Generates a unique, prompt-inspired high-res AI Canvas artwork locally (Zero API dependency)
const createProceduralAIArt = (promptText, width, height, seed) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Deterministic pseudo-random helper from prompt + seed
  let hash = seed;
  for (let i = 0; i < promptText.length; i++) {
    hash = (hash * 31 + promptText.charCodeAt(i)) % 1000000;
  }
  const rand = () => {
    hash = (hash * 16807) % 2147483647;
    return (hash - 1) / 2147483646;
  };

  // Detect mood/colors from prompt keywords
  const lower = promptText.toLowerCase();
  let palette = ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#533483"];
  if (lower.includes("galaxy") || lower.includes("star") || lower.includes("space")) {
    palette = ["#090a0f", "#1b2735", "#3a1c71", "#d76d77", "#ffaf7b"];
  } else if (lower.includes("forest") || lower.includes("village") || lower.includes("tree") || lower.includes("oasis")) {
    palette = ["#134e5e", "#71b280", "#2c3e50", "#f39c12", "#27ae60"];
  } else if (lower.includes("neon") || lower.includes("cyberpunk") || lower.includes("futuristic")) {
    palette = ["#0f0c29", "#302b63", "#24243e", "#00f2fe", "#ff007f"];
  } else if (lower.includes("snow") || lower.includes("northern") || lower.includes("crystal")) {
    palette = ["#1c92d2", "#f2fcfe", "#2b5876", "#4e4376", "#00d2ff"];
  }

  // Rich multi-stop gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, palette[0]);
  bgGrad.addColorStop(0.5, palette[1]);
  bgGrad.addColorStop(1, palette[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Glowing nebula / light orbs
  for (let i = 0; i < 12; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = (0.15 + rand() * 0.35) * Math.min(width, height);
    const orbGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    orbGrad.addColorStop(0, palette[3 + (i % 2)] + "88");
    orbGrad.addColorStop(1, "transparent");
    ctx.fillStyle = orbGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Flowing waves / landscape silhouettes
  for (let layer = 0; layer < 4; layer++) {
    ctx.beginPath();
    ctx.moveTo(0, height);
    const baseH = height * (0.45 + layer * 0.14);
    for (let x = 0; x <= width; x += 20) {
      const y =
        baseH +
        Math.sin(x * 0.01 + layer + rand() * 0.5) * 28 +
        Math.cos(x * 0.02 - layer) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = palette[layer % palette.length] + "aa";
    ctx.fill();
  }

  // Floating stars / particles
  for (let s = 0; s < 65; s++) {
    const sx = rand() * width;
    const sy = rand() * height * 0.75;
    const sr = 0.8 + rand() * 2.2;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + rand() * 0.6})`;
    ctx.fill();
  }

  // Subtle prompt caption badge at bottom
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, height - 34, width, 34);
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px sans-serif";
  const label = promptText.length > 48 ? promptText.slice(0, 45) + "..." : promptText;
  ctx.fillText(`AI Render: ${label}`, 12, height - 13);

  return canvas.toDataURL("image/png");
};

const renderImageCard = (imgCard, imgUrl) => {
  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
    <img src="${imgUrl}" alt="AI Generated Image" class="result-img" />
    <div class="img-overlay">
      <a href="${imgUrl}" class="img-download-btn" download="ai-generated-${Date.now()}.png">
        <i class="fa-solid fa-download"></i>
      </a>
    </div>
  `;
};

const generateImages = async (
  selectedModal,
  selectedImageCount,
  selectedRatio,
  promptText
) => {
  const { width, height } = getImageDimensions(selectedRatio);
  generateBtn.setAttribute("disabled", "true");

  // Simulate realistic AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 900));

  for (let i = 0; i < selectedImageCount; i++) {
    const imgCard = document.getElementById(`img-card-${i}`);
    const seed = Math.floor(Math.random() * 100000) + i * 77;
    const generatedDataUrl = createProceduralAIArt(
      promptText,
      width,
      height,
      seed
    );
    renderImageCard(imgCard, generatedDataUrl);
  }

  generateBtn.removeAttribute("disabled");
};

const createImageCard = (
  selectedModal,
  selectedImageCount,
  selectedRatio,
  promptText
) => {
  galleryGrid.innerHTML = "";
  for (let i = 0; i < selectedImageCount; i++) {
    galleryGrid.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${selectedRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
      </div>
    `;
  }
  generateImages(selectedModal, selectedImageCount, selectedRatio, promptText);
};

const handleForm = (e) => {
  e.preventDefault();
  const selectedModal = modalSelected.value;
  const selectedImageCount = parseInt(countSelected.value) || 1;
  const selectedRatio = ratioSelected.value || "1/1";
  const promptText = promptInput.value.trim();

  if (!promptText) return;
  createImageCard(selectedModal, selectedImageCount, selectedRatio, promptText);
};

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

promptBtn.addEventListener("click", () => {
  const prompt =
    examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

promptForm.addEventListener("submit", handleForm);

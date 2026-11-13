const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const generateBtn = document.querySelector(".gen-btn");
const modalSelected = document.querySelector("#model-select");
const countSelected = document.querySelector("#count-select");
const ratioSelected = document.querySelector("#ratio-select");
const galleryGrid = document.querySelector(".gallery-grid");
const apiKeyInput = document.querySelector("#api-key-input");

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
if (apiKeyInput && localStorage.getItem("hf_user_key")) {
  apiKeyInput.value = localStorage.getItem("hf_user_key");
}
if (apiKeyInput) {
  apiKeyInput.addEventListener("input", () => {
    localStorage.setItem("hf_user_key", apiKeyInput.value.trim());
  });
}

const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);
  let calculatedWidth = Math.floor((width * scaleFactor) / 16) * 16;
  let calculatedHeight = Math.floor((height * scaleFactor) / 16) * 16;
  return { width: calculatedWidth, height: calculatedHeight };
};

const createFallbackArt = (promptText, width, height, seed) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  let hash = seed;
  for (let i = 0; i < promptText.length; i++) {
    hash = (hash * 31 + promptText.charCodeAt(i)) % 1000000;
  }
  const rand = () => {
    hash = (hash * 16807) % 2147483647;
    return (hash - 1) / 2147483646;
  };

  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#1a1a2e");
  bgGrad.addColorStop(0.5, "#302b63");
  bgGrad.addColorStop(1, "#e94560");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  for (let s = 0; s < 50; s++) {
    ctx.beginPath();
    ctx.arc(rand() * width, rand() * height, 1 + rand() * 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();
  }

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, height - 36, width, 36);
  ctx.fillStyle = "#fff";
  ctx.font = "12px sans-serif";
  ctx.fillText("Demo Preview (Paste HF Token above for Real AI)", 10, height - 14);
  return canvas.toDataURL("image/png");
};

const renderImageCard = (imgCard, imgUrl) => {
  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
    <img src="${imgUrl}" alt="AI Generated Image" class="result-img" />
    <div class="img-overlay">
      <a href="${imgUrl}" class="img-download-btn" download="ai-image-${Date.now()}.png">
        <i class="fa-solid fa-download"></i>
      </a>
    </div>
  `;
};

const fetchFromHF = async (modelId, userApiKey, promptText, width, height, seed) => {
  const MODEL_URL = "https://huggingface.co" + modelId;
  const response = await fetch(MODEL_URL, {
    headers: {
      Authorization: "Bearer " + userApiKey,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      inputs: `${promptText}, seed ${seed}`,
      parameters: { width, height },
    }),
  });

  if (!response.ok) {
    const errData = await response.text();
    throw new Error(errData || `HTTP ${response.status}`);
  }
  return await response.blob();
};

const generateImages = async (
  selectedModal,
  selectedImageCount,
  selectedRatio,
  promptText
) => {
  const { width, height } = getImageDimensions(selectedRatio);
  const userApiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
  generateBtn.setAttribute("disabled", "true");

  const tasks = Array.from({ length: selectedImageCount }, async (_, i) => {
    const imgCard = document.getElementById(`img-card-${i}`);
    const seed = Math.floor(Math.random() * 100000) + i * 33;

    if (userApiKey) {
      try {
        let resultBlob;
        try {
          resultBlob = await fetchFromHF(selectedModal, userApiKey, promptText, width, height, seed);
        } catch (firstErr) {
          resultBlob = await fetchFromHF("black-forest-labs/FLUX.1-schnell", userApiKey, promptText, width, height, seed);
        }

        renderImageCard(imgCard, URL.createObjectURL(resultBlob));
        return;
      } catch (error) {
        console.error("HF Error:", error);
        imgCard.classList.replace("loading", "error");
        imgCard.querySelector(".status-text").textContent =
          "Check HF Token permissions (Inference) or wait 10s!";
        return;
      }
    }

    await new Promise((r) => setTimeout(r, 600));
    const fallbackUrl = createFallbackArt(promptText, width, height, seed);
    renderImageCard(imgCard, fallbackUrl);
  });

  await Promise.allSettled(tasks);
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

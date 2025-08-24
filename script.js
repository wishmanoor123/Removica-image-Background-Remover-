/* =========================
   ClearCut - Updated script.js
   (No design changes, just features)
   ========================= */

// ---------- Smooth Scroll to Tool (instead of redirect) ----------
const getStartedBtn = document.getElementById("getStarted");
const toolSection = document.getElementById("toolSection");

if (getStartedBtn && toolSection) {
  getStartedBtn.addEventListener("click", () => {
    // tool section visible karo (agar CSS se hidden hai)
    toolSection.style.display = "block";
    toolSection.scrollIntoView({ behavior: "smooth" });
  });
}

// ---------- Particle Background (UNCHANGED) ----------
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
setCanvasSize();

let particlesArray = [];

class Particle {
  constructor(x, y, size, speedX, speedY){
    this.x = x;
    this.y = y;
    this.size = size;
    this.speedX = speedX;
    this.speedY = speedY;
  }
  update(){
    this.x += this.speedX;
    this.y += this.speedY;
    if(this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if(this.y < 0 || this.y > canvas.height) this.speedY *= -1;
  }
  draw(){
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    ctx.fill();
  }
}

function initParticles(){
  particlesArray = [];
  const numberOfParticles = 100;
  for(let i=0; i<numberOfParticles; i++){
    const size = Math.random() * 3 + 1;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const speedX = (Math.random() * 0.5) - 0.25;
    const speedY = (Math.random() * 0.5) - 0.25;
    particlesArray.push(new Particle(x, y, size, speedX, speedY));
  }
}

function animateParticles(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particlesArray.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

window.addEventListener('resize', ()=>{
  setCanvasSize();
  initParticles();
});

// ---------- Toast Notifications ----------
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ---------- Elements ----------
const uploadInput = document.getElementById("upload");
const previewImage = document.getElementById("previewImage");
const removeBgBtn = document.getElementById("removeBg");
const downloadBtn = document.getElementById("downloadBtn");
const outputCanvas = document.getElementById("outputCanvas");

// Tool container ko drop-area ki tarah use karenge
const dropArea = document.querySelector(".tool");

// ---------- Drag & Drop Upload ----------
if (dropArea) {
  ;["dragenter","dragover"].forEach(evt =>
    dropArea.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.style.outline = "2px dashed #4989e9";
      dropArea.style.outlineOffset = "8px";
    })
  );

  ;["dragleave","drop"].forEach(evt =>
    dropArea.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.style.outline = "none";
    })
  );

  dropArea.addEventListener("drop", e => {
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  });
}

// Input change (normal upload)
if (uploadInput) {
  uploadInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) handleFile(file);
  });
}

// Common file handler
function handleFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    previewImage.style.display = "block";
    // tool section visible (agar abhi hidden ho)
    if (toolSection && getComputedStyle(toolSection).display === "none") {
      toolSection.style.display = "block";
    }
    showToast("✅ Image uploaded successfully!");
  };
  reader.readAsDataURL(file);
}

// ---------- BodyPix Model Load ----------
let net = null;
(async function loadModel() {
  try {
    net = await bodyPix.load();
    showToast("🤖 Model ready!");
  } catch (e) {
    console.error(e);
    showToast("⚠️ Model failed to load");
  }
})();

// ---------- Remove Background (with loader + checks) ----------
if (removeBgBtn) {
  removeBgBtn.addEventListener("click", async () => {
    if (!net) {
      showToast("⏳ Please wait, model is loading…");
      return;
    }
    if (!previewImage || !previewImage.src) {
      showToast("📷 Please upload an image first!");
      return;
    }

    // Loader ON
    document.body.classList.add("loading");
    showToast("⏳ Removing background...");

    try {
      const segmentation = await net.segmentPerson(previewImage, {
        internalResolution: "medium",
        segmentationThreshold: 0.7
      });

      // Output canvas size = displayed preview size
      outputCanvas.width = previewImage.naturalWidth || previewImage.width;
      outputCanvas.height = previewImage.naturalHeight || previewImage.height;

      const ctxOut = outputCanvas.getContext("2d");
      // Draw using natural size to preserve quality
      const tempImg = new Image();
      tempImg.onload = () => {
        ctxOut.drawImage(tempImg, 0, 0, outputCanvas.width, outputCanvas.height);
        const imageData = ctxOut.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        const pixels = imageData.data;

        // segmentation.data aligns with drawn image (assumes same sizing)
        for (let i = 0; i < pixels.length; i += 4) {
          const n = i / 4;
          if (segmentation.data[n] === 0) {
            pixels[i + 3] = 0; // transparent background
          }
        }

        ctxOut.putImageData(imageData, 0, 0);
        if (downloadBtn) downloadBtn.style.display = "inline-block";
        showToast("🎉 Background removed!");
        document.body.classList.remove("loading");
      };
      tempImg.src = previewImage.src;

    } catch (err) {
      console.error(err);
      showToast("❌ Something went wrong.");
      document.body.classList.remove("loading");
    }
  });
}
const elements = document.querySelectorAll('.fade-in');

window.addEventListener('scroll', () => {
  elements.forEach(el => {
    const position = el.getBoundingClientRect().top;
    if (position < window.innerHeight - 100) {
      el.classList.add('show');
    }
  });
});

// ---------- Download ----------
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "background_removed.png";
    link.href = outputCanvas.toDataURL("image/png");
    link.click();
    showToast("⬇️ Image downloaded!");
  });
}

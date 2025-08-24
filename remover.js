const upload = document.getElementById('upload');
const preview = document.getElementById('preview');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let image = new Image();
let processedImageURL = null;

upload.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    image.src = reader.result;
    preview.src = reader.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById('removeBtn').addEventListener('click', async () => {
  const file = upload.files[0];
  if (!file) return alert("Please upload an image first!");

  let formData = new FormData();
  formData.append("image_file", file);

  try {
    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": "YOUR_API_KEY_HERE"   // 👈 placeholder only
      },
      body: formData
    });

    if (!res.ok) {
      alert("Error removing background! Maybe API limit reached.");
      return;
    }

    const blob = await res.blob();
    processedImageURL = URL.createObjectURL(blob);

    // show result in preview & canvas
    preview.src = processedImageURL;

    const resultImg = new Image();
    resultImg.onload = () => {
      canvas.width = resultImg.width;
      canvas.height = resultImg.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(resultImg, 0, 0);
    };
    resultImg.src = processedImageURL;

  } catch (err) {
    console.error(err);
    alert("Something went wrong!");
  }
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!processedImageURL) {
    alert("Please remove background first!");
    return;
  }
  const link = document.createElement('a');
  link.download = 'output.png';
  link.href = processedImageURL;
  link.click();
});

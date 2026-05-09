// app.js
import { processImage } from './engine.js';

// Estado global
let results = [];
let totalFiles = 0;
let doneFiles = 0;

// Elementos DOM
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const resultsSection = document.getElementById('resultsSection');
const cardGrid = document.getElementById('cardGrid');
const resultsStatus = document.getElementById('resultsStatus');
const progressBar = document.getElementById('progressBar');
const zipBtn = document.getElementById('zipBtn');
const clearBtn = document.getElementById('clearBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Verificar carga de mapas de calibración
(async () => {
  try {
    const { getAlphaMap } = await import('./alphaMap.js');
    await getAlphaMap(48);
    await getAlphaMap(96);
    statusDot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    statusText.textContent = 'Mapas cargados ✓';
  } catch (err) {
    statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
    statusText.textContent = 'Error al cargar mapas';
    console.error(err);
  }
})();

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dz-hover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dz-hover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dz-hover');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) return;

  totalFiles += imageFiles.length;
  resultsSection.classList.remove('hidden');
  updateProgress();

  imageFiles.forEach(file => processAndDisplay(file));
}

function updateProgress() {
  resultsStatus.textContent = `${doneFiles} de ${totalFiles} procesada${totalFiles !== 1 ? 's' : ''}`;
  const percent = totalFiles ? Math.round((doneFiles / totalFiles) * 100) : 0;
  progressBar.style.width = `${percent}%`;

  if (totalFiles > 1) zipBtn.classList.remove('hidden');
  clearBtn.classList.remove('hidden');
}

async function processAndDisplay(file) {
  const originalUrl = URL.createObjectURL(file);
  const card = createCard(file.name, originalUrl);
  cardGrid.prepend(card.element);

  try {
    const blob = await processImage(file);
    const processedUrl = URL.createObjectURL(blob);
    const outputName = file.name.replace(/\.[^.]+$/, '') + '_clean.png';
    results.push({ name: outputName, blob, processedUrl, originalUrl });

    card.setDone(processedUrl, outputName, file.name);
  } catch (error) {
    console.error(error);
    card.setError();
  }

  doneFiles++;
  updateProgress();
}

function createCard(originalName, originalUrl) {
  const el = document.createElement('div');
  el.className = 'fadein bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow';

  const shortName = originalName.length > 18 ? originalName.slice(0, 15) + '…' : originalName;

  el.innerHTML = `
    <div class="aspect-square bg-gray-100 flex items-center justify-center">
      <iconify-icon icon="lucide:loader-2" class="spin text-2xl text-gray-400"></iconify-icon>
    </div>
    <div class="p-2.5 space-y-2">
      <p class="text-xs text-gray-500 truncate">${shortName}</p>
      <div class="flex items-center justify-between gap-1">
        <a href="#" class="download-btn flex-1 inline-flex items-center justify-center gap-1 text-xs py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-gray-600 no-underline transition" download>
          <iconify-icon icon="lucide:download" class="text-sm"></iconify-icon> Descargar
        </a>
        <button class="compare-btn flex-1 inline-flex items-center justify-center gap-1 text-xs py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-gray-600 transition">
          <iconify-icon icon="lucide:eye" class="text-sm"></iconify-icon> Comparar
        </button>
      </div>
    </div>
  `;

  return {
    element: el,
    setDone(processedUrl, outName, origName) {
      const short = origName.length > 18 ? origName.slice(0, 15) + '…' : origName;
      const previewDiv = el.querySelector('.aspect-square');
      previewDiv.innerHTML = `<img src="${processedUrl}" class="w-full h-full object-cover" alt="Imagen procesada" />`;

      const downloadBtn = el.querySelector('.download-btn');
      downloadBtn.href = processedUrl;
      downloadBtn.download = outName;

      const compareBtn = el.querySelector('.compare-btn');
      compareBtn.addEventListener('click', () => openCompareModal(originalUrl, processedUrl));
    },
    setError() {
      el.querySelector('.aspect-square').innerHTML = `<iconify-icon icon="lucide:alert-circle" class="text-2xl text-red-500"></iconify-icon>`;
      el.querySelector('.download-btn')?.remove();
    }
  };
}

// --- Modal de comparación ---
function openCompareModal(beforeUrl, afterUrl) {
  const modal = document.getElementById('compareModal');
  const beforeImg = document.getElementById('compareBefore');
  const afterImg = document.getElementById('compareAfter');
  const divider = document.getElementById('divider');
  const afterLayer = document.getElementById('afterLayer');

  beforeImg.src = beforeUrl;
  afterImg.src = afterUrl;

  // Resetear posición inicial
  afterLayer.style.width = '50%';
  divider.style.left = '50%';
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Eventos de arrastre para el slider
  let dragging = false;

  const startDrag = (e) => {
    e.preventDefault();
    dragging = true;
  };

  const stopDrag = () => {
    dragging = false;
  };

  const onDrag = (e) => {
    if (!dragging) return;
    e.preventDefault();
    const container = document.getElementById('compareContainer');
    const rect = container.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let posX = clientX - rect.left;
    posX = Math.max(0, Math.min(rect.width, posX));
    const percent = (posX / rect.width) * 100;

    afterLayer.style.width = `${percent}%`;
    divider.style.left = `${percent}%`;
  };

  divider.addEventListener('mousedown', startDrag);
  divider.addEventListener('touchstart', startDrag, { passive: false });
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('touchmove', onDrag, { passive: false });
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);
}

function closeModal(event) {
  const modal = document.getElementById('compareModal');
  if (event && event.target !== modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  // Limpiar eventos para evitar fugas (opcional)
}

// Exponer funciones globales
window.closeModal = closeModal;

// --- Descargar ZIP ---
async function downloadZip() {
  const btn = zipBtn;
  btn.disabled = true;
  btn.innerHTML = `<iconify-icon icon="lucide:loader-2" class="spin text-sm"></iconify-icon> Generando…`;

  const zip = new JSZip();
  results.forEach(({ name, blob }) => zip.file(name, blob));
  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(zipBlob);
  a.download = 'imagenes_sin_marca.zip';
  a.click();

  btn.disabled = false;
  btn.innerHTML = `<iconify-icon icon="lucide:folder-archive" class="text-sm"></iconify-icon> Descargar ZIP`;
}

function clearAll() {
  results.forEach(({ processedUrl, originalUrl }) => {
    URL.revokeObjectURL(processedUrl);
    URL.revokeObjectURL(originalUrl);
  });
  results = [];
  totalFiles = 0;
  doneFiles = 0;
  cardGrid.innerHTML = '';
  resultsSection.classList.add('hidden');
  zipBtn.classList.add('hidden');
  clearBtn.classList.add('hidden');
  progressBar.style.width = '0%';
  fileInput.value = '';
}

window.downloadZip = downloadZip;
window.clearAll = clearAll;
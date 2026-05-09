// app.js
import { processImage } from './engine.js';

// Estado global
let results = [];
let totalFiles = 0;
let doneFiles = 0;

// Elementos DOM
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const resultsContainer = document.getElementById('resultsContainer');
const cardGrid = document.getElementById('cardGrid');
const resultsStatus = document.getElementById('resultsStatus');
const progressBar = document.getElementById('progressBar');
const zipBtn = document.getElementById('zipBtn');
const clearBtn = document.getElementById('clearBtn');
const alphaSlider = document.getElementById('alphaSlider');
const alphaValue = document.getElementById('alphaValue');
const tileSelect = document.getElementById('tileSelect');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Ajustar valor mostrado de opacidad
alphaSlider.addEventListener('input', () => {
  alphaValue.textContent = (alphaSlider.value / 100).toFixed(2);
});

// Simular carga de la marca de agua (se hace en el primer uso real)
statusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
statusText.textContent = 'Listo · marca de agua cargada ✓';

// Eventos de arrastrar y soltar
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dz-hover');
});
dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dz-hover');
});
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
  resultsContainer.classList.remove('hidden');
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
  const card = createCard(file.name);
  cardGrid.prepend(card.element);

  try {
    const alpha = alphaSlider.value / 100;
    const tileMode = tileSelect.value;
    const blob = await processImage(file, alpha, tileMode);

    const url = URL.createObjectURL(blob);
    const outputName = file.name.replace(/\.[^.]+$/, '') + '_clean.png';
    results.push({ name: outputName, blob, url });

    card.setDone(url, outputName, file.name);
  } catch (error) {
    console.error(error);
    card.setError();
  }

  doneFiles++;
  updateProgress();
}

function createCard(originalName) {
  const el = document.createElement('div');
  el.className = 'fadein bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm';

  const shortName = originalName.length > 20 ? originalName.slice(0, 17) + '…' : originalName;

  el.innerHTML = `
    <div class="pv aspect-square bg-gray-100 flex items-center justify-center">
      <iconify-icon icon="lucide:loader-2" class="spin text-2xl text-gray-400"></iconify-icon>
    </div>
    <div class="meta p-2">
      <p class="text-xs text-gray-500 truncate">${shortName}</p>
    </div>
  `;

  return {
    element: el,
    setDone(url, outName, orig) {
      const sh = orig.length > 20 ? orig.slice(0, 17) + '…' : orig;
      el.querySelector('.pv').innerHTML = `<img src="${url}" class="w-full h-full object-cover" alt="Imagen procesada" />`;
      el.querySelector('.meta').innerHTML = `
        <p class="text-xs text-gray-500 truncate mb-1">${sh}</p>
        <a href="${url}" download="${outName}" class="flex items-center justify-center gap-1 text-xs px-2 py-1 bg-gray-100 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-200 no-underline">
          <iconify-icon icon="lucide:download" class="text-sm"></iconify-icon> Descargar
        </a>
      `;
    },
    setError() {
      el.querySelector('.pv').innerHTML = `<iconify-icon icon="lucide:alert-circle" class="text-2xl text-red-500"></iconify-icon>`;
      el.querySelector('.meta').innerHTML = `<p class="text-xs text-red-600">Error al procesar</p>`;
    }
  };
}

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
  btn.innerHTML = `<iconify-icon icon="lucide:file-archive" class="text-sm"></iconify-icon> Descargar ZIP`;
}

function clearAll() {
  results.forEach(({ url }) => URL.revokeObjectURL(url));
  results = [];
  totalFiles = 0;
  doneFiles = 0;
  cardGrid.innerHTML = '';
  resultsContainer.classList.add('hidden');
  zipBtn.classList.add('hidden');
  clearBtn.classList.add('hidden');
  progressBar.style.width = '0%';
  fileInput.value = '';
}

// Exponer funciones globales necesarias desde HTML
window.downloadZip = downloadZip;
window.clearAll = clearAll;
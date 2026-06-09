import {
  bottomBar,
  doneActions,
  input,
  progressBadge,
  statusText,
  statusTitle,
  tinyFileList,
  tinyResults,
  totalPercent,
  totalSaved,
} from "./dom.js";
import { compressImage } from "./compress.js";
import { downloadItem } from "./downloads.js";
import { clearProcessedFiles, setProcessedFile } from "./state.js";
import {
  escapeHTML,
  formatBytes,
  getExtension,
  getType,
  normalizeExtension,
  scrollToResultImage,
  validateFiles,
} from "./utils.js";

const OUTPUT_FORMATS = [
  { value: "webp", label: "WEBP" },
  { value: "jpeg", label: "JPG" },
  { value: "png", label: "PNG" },
];

let currentFiles = [];
let currentResults = [];
let currentRejectedCount = 0;

function resetTotals() {
  if (totalSaved) totalSaved.textContent = "0 B";
  if (totalPercent) totalPercent.textContent = "";
}

function setButtonsDisabled(isDisabled) {
  [
    "tinyDownloadTop",
    "tinyDownloadBottom",
    "tinyZipTop",
    "tinyZipBottom",
  ].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.disabled = isDisabled;
  });
}

function getDefaultFormat(file) {
  const original = normalizeExtension(getExtension(file.name));

  if (original === "jpeg") return "jpeg";
  if (original === "png") return "png";
  if (original === "webp") return "webp";

  return "webp";
}

function getFormatOptions(selected) {
  return OUTPUT_FORMATS.map((format) => {
    const isSelected = format.value === selected ? " selected" : "";
    return `<option value="${format.value}"${isSelected}>${format.label}</option>`;
  }).join("");
}

export function clearResults() {
  clearProcessedFiles();
  currentFiles = [];
  currentResults = [];
  currentRejectedCount = 0;
  setButtonsDisabled(true);

  document.body.classList.remove("is-processing", "has-result");

  if (tinyResults) tinyResults.classList.remove("is-active");
  if (doneActions) doneActions.classList.remove("is-active");
  if (bottomBar) bottomBar.classList.remove("is-active");
  if (tinyFileList) tinyFileList.innerHTML = "";
  if (progressBadge) {
    progressBadge.style.display = "none";
    progressBadge.textContent = "0%";
  }
  if (statusTitle) statusTitle.textContent = "Ready when you are";
  if (statusText)
    statusText.textContent = "Drop JPG, PNG, or WebP images to optimize them.";
  if (input) input.value = "";

  resetTotals();
}

function renderThumb(file) {
  if (file && file.type && file.type.startsWith("image/")) {
    const preview = URL.createObjectURL(file);
    return `<img class="tiny-thumb" src="${preview}" alt="">`;
  }

  return `<div class="tiny-thumb tiny-thumb-fallback" aria-hidden="true">IMG</div>`;
}

function renderRows(accepted, rejected) {
  if (!tinyFileList) return;

  const acceptedRows = accepted
    .map((file, index) => {
      const name = escapeHTML(file.name);
      const type = escapeHTML(getType(file.name));
      const size = escapeHTML(formatBytes(file.size));
      const selectedFormat = getDefaultFormat(file);

      return `
      <div class="tiny-file-row" data-row="${index}">
        ${renderThumb(file)}
        <div>
          <div class="tiny-file-name">${name}</div>
          <div class="tiny-file-meta">
            <span class="tiny-file-type">${type}</span>
            <span>${size}</span>
          </div>
        </div>
        <div class="tiny-file-select-wrap">
          <select class="tiny-file-format" data-format-select="${index}" aria-label="Change output format" disabled>
            ${getFormatOptions(selectedFormat)}
          </select>
        </div>
        <div class="tiny-file-saving" data-saving="${index}">Waiting</div>
        <button class="tiny-file-action tiny-file-download is-waiting" data-action="${index}" type="button" disabled title="Download this file">↓</button>
        <div class="tiny-file-progress">
          <span data-progress="${index}"></span>
        </div>
      </div>
    `;
    })
    .join("");

  const rejectedRows = rejected
    .map((item) => {
      const name = escapeHTML(item.file.name || "Unknown file");
      const type = escapeHTML(getType(item.file.name || "file"));
      const size = escapeHTML(formatBytes(item.file.size || 0));
      const reason = escapeHTML(item.reason);

      return `
      <div class="tiny-file-row is-skipped">
        ${renderThumb(item.file)}
        <div>
          <div class="tiny-file-name">${name}</div>
          <div class="tiny-file-meta">
            <span class="tiny-file-type">${type}</span>
            <span>${size}</span>
          </div>
        </div>
        <div class="tiny-file-select-wrap">
          <select class="tiny-file-format" disabled>
            <option>—</option>
          </select>
        </div>
        <div class="tiny-file-saving tiny-file-saving-muted">Skipped<small>${reason}</small></div>
        <button class="tiny-file-action is-disabled" type="button" disabled>×</button>
      </div>
    `;
    })
    .join("");

  tinyFileList.innerHTML = acceptedRows + rejectedRows;
}

function updateOverallProgress(done, total) {
  const percent = total ? Math.round((done / total) * 100) : 100;
  if (progressBadge) progressBadge.textContent = `${percent}%`;
}

function updateRowProgress(index, percent) {
  const bar = document.querySelector(`[data-progress="${index}"]`);
  if (bar) bar.style.width = `${percent}%`;
}

function setProcessingState(accepted, rejected) {
  clearProcessedFiles();
  currentFiles = accepted.slice();
  currentResults = new Array(accepted.length).fill(null);
  currentRejectedCount = rejected.length;
  setButtonsDisabled(true);

  document.body.classList.remove("has-result");
  document.body.classList.add("is-processing");

  if (tinyResults) tinyResults.classList.add("is-active");
  if (doneActions) doneActions.classList.remove("is-active");
  if (bottomBar) bottomBar.classList.remove("is-active");
  if (progressBadge) {
    progressBadge.style.display = accepted.length ? "flex" : "none";
    progressBadge.textContent = "0%";
  }
  if (statusTitle)
    statusTitle.textContent = accepted.length
      ? "Optimizing images..."
      : "No supported images found";
  if (statusText) {
    const skippedText = rejected.length
      ? ` ${rejected.length} file(s) skipped.`
      : "";
    statusText.textContent = accepted.length
      ? `Processing ${accepted.length} image(s).${skippedText}`
      : skippedText.trim() || "Only JPG, PNG, and WebP are supported.";
  }

  renderRows(accepted, rejected);
  scrollToResultImage();
}

function updateSummary() {
  const readyResults = currentResults.filter(
    (result) => result && result.downloadable && result.blob,
  );
  const totalOriginal = currentFiles.reduce(
    (sum, file) => sum + (file.size || 0),
    0,
  );
  const totalOutput = currentResults.reduce((sum, result, index) => {
    if (result && typeof result.outputSize === "number")
      return sum + result.outputSize;
    return sum + (currentFiles[index] ? currentFiles[index].size : 0);
  }, 0);

  const totalSavedBytes = Math.max(0, totalOriginal - totalOutput);
  const savedPercentTotal = totalOriginal
    ? Math.max(0, Math.round((1 - totalOutput / totalOriginal) * 100))
    : 0;
  const savedSize = formatBytes(totalSavedBytes);

  if (statusTitle) {
    statusTitle.textContent = readyResults.length
      ? `FlowSync saved ${savedPercentTotal}%`
      : "Nothing was processed";
  }

  if (statusText) {
    const skippedText = currentRejectedCount
      ? ` ${currentRejectedCount} skipped.`
      : "";
    statusText.textContent = readyResults.length
      ? `${readyResults.length} file(s) ready • ${savedSize} saved.${skippedText}`
      : `No downloadable files.${skippedText}`;
  }

  if (totalSaved) totalSaved.textContent = savedSize;
  if (totalPercent)
    totalPercent.textContent = totalOriginal ? `${savedPercentTotal}%` : "";
  setButtonsDisabled(readyResults.length === 0);
}

function updateRowUI(index, result) {
  const saving = document.querySelector(`[data-saving="${index}"]`);
  const action = document.querySelector(`[data-action="${index}"]`);
  const select = document.querySelector(`[data-format-select="${index}"]`);

  if (action) {
    action.disabled = !(result.downloadable && result.blob);
    action.classList.remove("is-waiting", "is-disabled");
    if (result.downloadable && result.blob) {
      action.textContent = "↓";
      action.title = `Download ${result.outputName}`;
      action.onclick = () => downloadItem(index);
    } else {
      action.classList.add("is-disabled");
      action.textContent = "×";
      action.title = "No download available";
      action.onclick = null;
    }
  }

  if (select) {
    select.disabled = false;
    const normalizedExt = normalizeExtension(result.ext || select.value);
    if (OUTPUT_FORMATS.some((format) => format.value === normalizedExt)) {
      select.value = normalizedExt;
    }
  }

  if (saving) {
    const savedText =
      result.savedPercent > 0 ? `-${result.savedPercent}%` : "0%";
    const sizeText = formatBytes(result.outputSize || 0);
    const message = escapeHTML(result.message || "Done.");
    saving.innerHTML = `${savedText}<small>${sizeText} • ${message}</small>`;
    saving.classList.toggle(
      "tiny-file-saving-muted",
      result.status === "original" || result.status === "failed",
    );
  }
}

async function processRow(index, file, options) {
  const saving = document.querySelector(`[data-saving="${index}"]`);
  const action = document.querySelector(`[data-action="${index}"]`);
  const select = document.querySelector(`[data-format-select="${index}"]`);

  if (saving) saving.innerHTML = `Working<small>Processing...</small>`;
  if (action) {
    action.disabled = true;
    action.classList.add("is-waiting");
    action.textContent = "...";
  }
  if (select) select.disabled = true;

  updateRowProgress(index, 35);

  const result = await compressImage(file, options);

  updateRowProgress(index, 100);

  currentResults[index] = result;

  if (result.downloadable && result.blob) {
    setProcessedFile(index, {
      outputName: result.outputName,
      blob: result.blob,
    });
  } else {
    setProcessedFile(index, null);
  }

  updateRowUI(index, result);
  updateSummary();
}

function attachFormatListeners() {
  document.querySelectorAll("[data-format-select]").forEach((select) => {
    select.addEventListener("change", (event) => {
      const target = event.currentTarget;
      const index = Number(target.getAttribute("data-format-select"));
      const file = currentFiles[index];
      if (!file) return;

      const selectedFormat = target.value;

      processRow(index, file, {
        autoConvert: true,
        format: selectedFormat,
      });
    });
  });
}

export async function handleFiles(fileList) {
  const { accepted, rejected } = validateFiles(fileList);
  if (!accepted.length && !rejected.length) return;

  setProcessingState(accepted, rejected);
  attachFormatListeners();

  let completed = 0;

  for (let index = 0; index < accepted.length; index++) {
    const file = accepted[index];

    await processRow(index, file, {
      autoConvert: false,
      format: getDefaultFormat(file),
    });

    completed += 1;
    updateOverallProgress(completed, accepted.length);
  }

  document.body.classList.remove("is-processing");
  document.body.classList.add("has-result");

  if (progressBadge) progressBadge.style.display = "none";
  if (doneActions) doneActions.classList.add("is-active");
  if (bottomBar) bottomBar.classList.add("is-active");
  if (input) input.value = "";

  updateSummary();
  scrollToResultImage();
}

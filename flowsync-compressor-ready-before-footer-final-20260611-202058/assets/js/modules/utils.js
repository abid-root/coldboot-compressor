import { MAX_FILE_SIZE, MAX_FILES, SUPPORTED_EXTENSIONS } from "./config.js";
import { tinyFileList, tinyResults } from "./dom.js";

export function escapeHTML(value){
  return String(value).replace(/[&<>"']/g, character => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#39;"
  }[character]));
}

export function formatBytes(bytes){
  if(!bytes) return "0 B";
  if(bytes < 1024) return `${bytes} B`;
  if(bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getExtension(name = ""){
  return (name.split(".").pop() || "").toLowerCase();
}

export function getType(name){
  const ext = getExtension(name);
  return ext ? ext.toUpperCase() : "IMG";
}

export function normalizeExtension(ext){
  const value = String(ext || "").toLowerCase();
  return value === "jpg" ? "jpeg" : value;
}

export function displayExtension(ext){
  const value = String(ext || "").toLowerCase();
  return value === "jpeg" ? "jpg" : value;
}

export function isSupportedImage(file){
  const ext = getExtension(file.name);
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export function createOutputName(name, ext, mode = "optimized"){
  const safeExt = displayExtension(ext) || "jpg";
  const base = String(name || "flowsync-image")
    .replace(/\.[^/.]+$/, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim() || "flowsync-image";

  const suffix = {
    converted: "converted",
    compressed: "compressed",
    original: "original",
    optimized: "optimized"
  }[mode] || "optimized";

  return `${base}-${suffix}.${safeExt}`;
}

export function validateFiles(fileList){
  const incoming = Array.from(fileList || []);
  const accepted = [];
  const rejected = [];

  incoming.forEach(file => {
    if(accepted.length >= MAX_FILES){
      rejected.push({ file, reason:`Only ${MAX_FILES} images allowed at once.` });
      return;
    }

    if(!isSupportedImage(file)){
      rejected.push({ file, reason:"Unsupported format. Use JPG, PNG, or WebP." });
      return;
    }

    if(file.size > MAX_FILE_SIZE){
      rejected.push({ file, reason:`Too large. Max size is ${formatBytes(MAX_FILE_SIZE)}.` });
      return;
    }

    accepted.push(file);
  });

  return { accepted, rejected };
}

export function scrollToResultImage(){
  const target = tinyResults || tinyFileList;
  if(!target) return;

  const pin = () => {
    const nav = document.querySelector(".nav");
    const navHeight = nav ? Math.ceil(nav.getBoundingClientRect().height) : 88;
    const preferredResultTop = window.innerWidth <= 760
      ? navHeight + Math.min(130, window.innerHeight * 0.18)
      : navHeight + Math.min(360, Math.max(240, window.innerHeight * 0.34));
    const top = target.getBoundingClientRect().top + window.scrollY - preferredResultTop;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;

    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo({ top:Math.max(0, top), behavior:"auto" });
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  };

  requestAnimationFrame(pin);
  setTimeout(pin, 80);
  setTimeout(pin, 260);
}

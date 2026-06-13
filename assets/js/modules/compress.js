import {
  EXT_BY_MIME,
  JPEG_QUALITY_STEPS,
  MAX_CANVAS_EDGE,
  MIME_BY_FORMAT,
  WEBP_QUALITY_STEPS
} from "./config.js";
import { createOutputName, displayExtension, getExtension, normalizeExtension } from "./utils.js";

function fileToImage(file){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed."));
    };

    img.src = url;
  });
}

function canvasToBlob(canvas, mime, quality){
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), mime, quality);
  });
}

function chooseQualitySteps(mime){
  if(mime === "image/webp") return WEBP_QUALITY_STEPS;
  if(mime === "image/jpeg") return JPEG_QUALITY_STEPS;
  return [undefined];
}

function getTargetFormat(file, convertOptions){
  const originalExt = normalizeExtension(getExtension(file.name));

  if(convertOptions && convertOptions.autoConvert){
    const selected = normalizeExtension(convertOptions.format || "webp");
    if(MIME_BY_FORMAT[selected]) return selected;
  }

  return originalExt;
}

function getCanvasSize(img){
  const scale = Math.min(
    1,
    MAX_CANVAS_EDGE / Math.max(1, img.width),
    MAX_CANVAS_EDGE / Math.max(1, img.height)
  );

  return {
    width:Math.max(1, Math.round(img.width * scale)),
    height:Math.max(1, Math.round(img.height * scale)),
    wasResized:scale < 1
  };
}

export async function compressImage(file, convertOptions){
  const originalExt = normalizeExtension(getExtension(file.name));
  const targetExt = getTargetFormat(file, convertOptions);
  const targetMime = MIME_BY_FORMAT[targetExt] || MIME_BY_FORMAT[originalExt];
  const originalMime = MIME_BY_FORMAT[originalExt] || file.type;
  const isConverted = targetExt !== originalExt;

  if(!targetMime){
    return {
      blob:null,
      downloadable:false,
      status:"skipped",
      message:"Unsupported output format.",
      ext:displayExtension(originalExt),
      outputName:""
    };
  }

  try{
    const img = await fileToImage(file);
    const { width, height, wasResized } = getCanvasSize(img);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { alpha:targetMime !== "image/jpeg" });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if(targetMime === "image/jpeg"){
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const candidates = [];
    for(const quality of chooseQualitySteps(targetMime)){
      const blob = await canvasToBlob(canvas, targetMime, quality);
      if(blob && (blob.type === targetMime || targetMime === "image/jpeg")){
        candidates.push(blob);
      }
    }

    if(!candidates.length){
      throw new Error("Browser could not create the selected format.");
    }

    candidates.sort((a, b) => a.size - b.size);
    const best = candidates[0];
    const outputExt = displayExtension(EXT_BY_MIME[targetMime] || targetExt);
    const savedBytes = Math.max(0, file.size - best.size);
    const savedPercent = file.size ? Math.max(0, Math.round((1 - best.size / file.size) * 100)) : 0;

    if(!isConverted && !wasResized && best.size >= file.size){
      return {
        blob:file,
        downloadable:true,
        status:"original",
        message:"Already optimized. Original kept.",
        ext:displayExtension(originalExt),
        outputName:createOutputName(file.name, originalExt, "original"),
        originalSize:file.size,
        outputSize:file.size,
        savedBytes:0,
        savedPercent:0
      };
    }

    const mode = isConverted ? "converted" : "compressed";

    return {
      blob:best,
      downloadable:true,
      status:isConverted ? "converted" : "optimized",
      message:isConverted ? `Converted to ${outputExt.toUpperCase()}.` : "Optimized in browser.",
      ext:outputExt,
      outputName:createOutputName(file.name, outputExt, mode),
      originalSize:file.size,
      outputSize:best.size,
      savedBytes,
      savedPercent
    };
  }catch(error){
    if(isConverted){
      return {
        blob:null,
        downloadable:false,
        status:"failed",
        message:"Conversion failed in this browser.",
        ext:displayExtension(targetExt),
        outputName:"",
        originalSize:file.size,
        outputSize:file.size,
        savedBytes:0,
        savedPercent:0
      };
    }

    return {
      blob:file,
      downloadable:true,
      status:"original",
      message:"Could not re-encode. Original kept.",
      ext:displayExtension(originalExt),
      outputName:createOutputName(file.name, originalExt, "original"),
      originalSize:file.size,
      outputSize:file.size,
      savedBytes:0,
      savedPercent:0
    };
  }
}

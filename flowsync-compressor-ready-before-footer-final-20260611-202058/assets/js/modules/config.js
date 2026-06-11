export const MAX_FILES = 20;
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_CANVAS_EDGE = 2200;
export const JPEG_QUALITY_STEPS = [0.84, 0.78, 0.72];
export const WEBP_QUALITY_STEPS = [0.82, 0.76, 0.7];
export const ZIP_FILE_NAME = "flowsync-optimized-images.zip";

export const SUPPORTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export const MIME_BY_FORMAT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

export const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export const FORMAT_LABELS = {
  jpg: "JPG",
  jpeg: "JPEG",
  png: "PNG",
  webp: "WEBP"
};

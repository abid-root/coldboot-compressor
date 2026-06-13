export const processedFiles = [];

export const convertOptions = {
  autoConvert:false,
  format:"webp"
};

window.flowsyncConvertOptions = convertOptions;

export function clearProcessedFiles(){
  processedFiles.length = 0;
}

export function addProcessedFile(file){
  processedFiles.push(file);
  return processedFiles.length - 1;
}

export function setProcessedFile(index, file){
  processedFiles[index] = file || null;
  return index;
}

export function removeProcessedFile(index){
  processedFiles[index] = null;
}

export function setAutoConvert(isOn){
  convertOptions.autoConvert = Boolean(isOn);
}

export function setConvertFormat(format){
  convertOptions.format = format || "webp";
}

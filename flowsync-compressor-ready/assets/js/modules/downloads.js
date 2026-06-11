import { ZIP_FILE_NAME } from "./config.js";
import { processedFiles } from "./state.js";

function getReadyFiles(){
  return processedFiles.filter(item => item && item.blob);
}

export function downloadItem(index){
  const item = processedFiles[index];
  if(!item || !item.blob) return;

  const url = URL.createObjectURL(item.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = item.outputName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 700);
}

function makeCRCTable(){
  const table = new Uint32Array(256);

  for(let index = 0; index < 256; index++){
    let value = index;
    for(let bit = 0; bit < 8; bit++){
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
}

const CRC_TABLE = makeCRCTable();

function crc32(bytes){
  let crc = 0xffffffff;
  for(let index = 0; index < bytes.length; index++){
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()){
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function uint16(value){
  const bytes = new Uint8Array(2);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, value, true);
  return bytes;
}

function uint32(value){
  const bytes = new Uint8Array(4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, value >>> 0, true);
  return bytes;
}

function concatParts(parts){
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach(part => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}

async function createZipBlob(files){
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime();

  for(let index = 0; index < files.length; index++){
    const item = files[index];
    if(!item || !item.blob) continue;

    const safeName = item.outputName || `flowsync-image-${index + 1}`;
    const nameBytes = encoder.encode(safeName);
    const dataBytes = new Uint8Array(await item.blob.arrayBuffer());
    const crc = crc32(dataBytes);
    const size = dataBytes.length;
    const currentOffset = offset;

    const localHeader = concatParts([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(dosTime),
      uint16(dosDate),
      uint32(crc),
      uint32(size),
      uint32(size),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes
    ]);

    const fileRecord = concatParts([localHeader, dataBytes]);
    localParts.push(fileRecord);
    offset += fileRecord.length;

    const centralHeader = concatParts([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(dosTime),
      uint16(dosDate),
      uint32(crc),
      uint32(size),
      uint32(size),
      uint16(nameBytes.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(currentOffset),
      nameBytes
    ]);

    centralParts.push(centralHeader);
  }

  const centralDirectory = concatParts(centralParts);
  const localFiles = concatParts(localParts);
  const endRecord = concatParts([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(centralParts.length),
    uint16(centralParts.length),
    uint32(centralDirectory.length),
    uint32(localFiles.length),
    uint16(0)
  ]);

  return new Blob([localFiles, centralDirectory, endRecord], { type:"application/zip" });
}

export async function downloadZip(){
  const readyFiles = getReadyFiles();

  if(!readyFiles.length){
    alert("No optimized files are ready yet.");
    return;
  }

  try{
    const zipBlob = await createZipBlob(readyFiles);
    const url = URL.createObjectURL(zipBlob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = ZIP_FILE_NAME;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }catch(error){
    alert("ZIP download failed. Try Download all images instead.");
  }
}

export function downloadAllImages(){
  const readyFiles = getReadyFiles();

  if(!readyFiles.length){
    alert("No optimized files are ready yet.");
    return;
  }

  readyFiles.forEach((file, index) => {
    const realIndex = processedFiles.indexOf(file);
    setTimeout(() => downloadItem(realIndex), index * 180);
  });
}

/* Backward compatibility for older buttons/scripts. */
export async function downloadAll(){
  return downloadZip();
}

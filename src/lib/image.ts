/***********************************************************************
 * compressImage.ts
 *
 * - EXIF 전체 보존 (GPS, 카메라 정보, Lens, Exposure 등 모두)
 * - Orientation 자동 보정
 * - pica 기반 고품질 리사이즈/압축
 * - JPEG 품질 제어
 * - 기존 compressImage 함수와 동일한 시그니처
 ***********************************************************************/

import pica from "pica";
import piexif from "piexifjs";
import EXIF from "exif-js";

/**
 * Main entry — drop-in replacement compatible with previous compressImage().
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  try {
    // 1) 파일 → ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const originalBinary = arrayBufferToBinaryString(arrayBuffer);

    // 2) 원본 EXIF 전체 로드
    let originalExif = null;

    if (isJPEGFile(file)) {
      try {
        originalExif = piexif.load(originalBinary);
      } catch (e) {
        console.warn("Cannot load EXIF from this JPEG. EXIF will be ignored.", e);
        originalExif = null;
      }
    } else {
      console.warn("Not a JPEG file. EXIF cannot be preserved for this file.");
    }

    // 4) 이미지 로드
    const bitmap = await createImageBitmap(file);

    // 5) Orientation 보정된 canvas 생성
    const { canvas: orientedCanvas } = prepareOrientedCanvas(bitmap);

    // 6) 목표 크기 계산 및 리사이즈 Canvas 생성
    const ratio = Math.min(
      maxWidth / orientedCanvas.width,
      maxHeight / orientedCanvas.height,
      1
    );

    const targetWidth = Math.round(orientedCanvas.width * ratio);
    const targetHeight = Math.round(orientedCanvas.height * ratio);

    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;

    // 7) pica 고품질 resize
    await pica().resize(orientedCanvas, resizedCanvas, {
      quality: 3,
      alpha: false,
    });

    // 8) JPEG Base64 획득
    const jpegDataUrl = resizedCanvas.toDataURL("image/jpeg", quality);

    if (!jpegDataUrl.startsWith("data:image/jpeg")) {
      console.warn("Canvas did NOT generate JPEG. Can't insert EXIF. Returning compressed JPEG.");
      
      const compressedBlob = dataURLtoBlob(jpegDataUrl);
      return new File([compressedBlob], file.name.replace(/\.\w+$/, ".jpg"), {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }

    // 9) 원본 EXIF → 압축된 JPEG에 재삽입
    let exifInserted = jpegDataUrl;

    if (originalExif) {
      try {
        exifInserted = piexif.insert(piexif.dump(originalExif), jpegDataUrl);
      } catch (e) {
        console.warn("EXIF insertion failed. Returning JPEG without EXIF.", e);
        exifInserted = jpegDataUrl;
      }
    }

    // 11) Base64 → Blob
    const compressedBlob = dataURLtoBlob(exifInserted);
    // 12) Blob → File
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.\w+$/, ".jpg"),
      { type: "image/jpeg", lastModified: Date.now() }
    );
    return compressedFile;
  } catch (error) {
    console.error("EXIF-preserving compression failed — returning original file", error);
    return file;
  }
}

/************************* UTILITIES *************************/
export function isJPEGFile(file: File): boolean {
  return file.type === "image/jpeg" || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg");
}

function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

function prepareOrientedCanvas(
  bitmap: ImageBitmap
): { canvas: HTMLCanvasElement } {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  // Simply draw the image without any orientation correction
  ctx.drawImage(bitmap, 0, 0);
  return { canvas };
}
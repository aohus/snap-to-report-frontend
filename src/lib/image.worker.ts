import pica from "pica";
import piexif from "piexifjs";

const picaInstance = pica();

self.onmessage = async (e) => {
  // Transferable ArrayBuffer를 직접 받습니다.
  const { id, arrayBuffer, fileType, fileName, fileLastModified, maxWidth, maxHeight, quality } = e.data;

  try {
    // 1. ArrayBuffer -> File/BinaryString
    const originalBinary = arrayBufferToBinaryString(arrayBuffer);
    const file = new File([arrayBuffer], fileName, { type: fileType, lastModified: fileLastModified });

    // 2. Extract EXIF
    let originalExif = null;
    const isJPEG = isJPEGFile(file);
    if (isJPEG) {
      try {
        originalExif = piexif.load(originalBinary);
      } catch (err) {
        // ignore exif errors
      }
    }

    // 3. Create Bitmap (Off-main-thread)
    const bitmap = await createImageBitmap(file);

    // 4. Resize Logic using OffscreenCanvas
    const { width, height } = calculateSize(bitmap.width, bitmap.height, maxWidth, maxHeight);
    const offscreen = new OffscreenCanvas(width, height);
    
    // Pica resize
    await picaInstance.resize(bitmap, offscreen, {
      quality: 3,
      alpha: false
    });

    // 5. Export to Blob
    const resizedBlob = await offscreen.convertToBlob({
      type: "image/jpeg",
      quality: quality
    });

    // 6. Insert EXIF (Optimized for ArrayBuffer/Blob)
    if (originalExif && resizedBlob && isJPEG) {
        
        // Blob -> ArrayBuffer (async)
        const resizedArrayBuffer = await resizedBlob.arrayBuffer();
        
        // ArrayBuffer -> Binary String (for piexif.insert)
        const resizedBinary = arrayBufferToBinaryString(resizedArrayBuffer);
        
        try {
            const newJpegBinary = piexif.insert(piexif.dump(originalExif), resizedBinary);
            
            // Binary String -> ArrayBuffer -> Final Blob
            const finalBlob = binaryStringToBlob(newJpegBinary, "image/jpeg");
            
            self.postMessage({ id, blob: finalBlob });
        } catch (e) {
            // Fallback: EXIF 삽입 실패 시 압축된 Blob만 반환
            self.postMessage({ id, blob: resizedBlob });
        }
    } else {
        self.postMessage({ id, blob: resizedBlob });
    }

  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : "Unknown error" });
  }
};

function isJPEGFile(file: File): boolean {
  return file.type === "image/jpeg" || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg");
}

function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  // 이 동기 루프가 병목이 될 수 있지만, 현재 piexifjs 사용을 위해 불가피함.
  // 32768 (32KB) 단위로 쪼개 성능을 개선함.
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 32768; // 32KB
  
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as unknown as number[]);
  }
  return binary;
}

function binaryStringToBlob(binary: string, mime: string): Blob {
    const len = binary.length;
    const u8arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        u8arr[i] = binary.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
}

function calculateSize(srcW: number, srcH: number, maxW: number, maxH: number) {
    const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
    return {
        width: Math.round(srcW * ratio),
        height: Math.round(srcH * ratio)
    };
}
import pica from "pica";
import piexif from "piexifjs";

const picaInstance = pica();

self.onmessage = async (e) => {
  // Transferable ArrayBuffer를 받습니다.
  const { id, arrayBuffer, fileType, fileName, fileLastModified, maxWidth, maxHeight, quality } = e.data;

  // ArrayBuffer를 File 객체로 변환
  const file = new File([arrayBuffer], fileName, { type: fileType, lastModified: fileLastModified });

  try {
    // 1. Extract EXIF
    let originalExifObj = null;
    const isJPEG = isJPEGFile(file);
    
    if (isJPEG) {
      try {
        const binaryString = await arrayBufferToBinaryString(arrayBuffer);
        originalExifObj = piexif.load(binaryString);
      } catch (err) {
        console.warn(`EXIF loading failed for ${fileName}.`, err);
        // ignore exif errors
      }
    }

    // 2. Create Bitmap & Resize (Off-main-thread)
    const bitmap = await createImageBitmap(file);

    const { width, height } = calculateSize(bitmap.width, bitmap.height, maxWidth, maxHeight);
    const offscreen = new OffscreenCanvas(width, height);
    
    try {
      await picaInstance.resize(bitmap, offscreen, {
        quality: 3,
        alpha: false
      });
    } catch (picaError) {
      console.warn("Pica resize failed, falling back to native drawImage.", picaError);
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bitmap, 0, 0, width, height);
      } else {
         throw picaError;
      }
    }

    // 3. Export to Blob
    const resizedBlob = await offscreen.convertToBlob({
      type: "image/jpeg",
      quality: quality
    });

    // 4. Insert EXIF
    if (originalExifObj && resizedBlob && isJPEG) {
        try {
            // Blob -> ArrayBuffer -> BinaryString
            const resizedArrayBuffer = await resizedBlob.arrayBuffer();
            const resizedBinaryString = await arrayBufferToBinaryString(resizedArrayBuffer);
            
            // Dump EXIF obj to string
            const exifStr = piexif.dump(originalExifObj);
            
            // Insert EXIF into resized image string
            const finalBinaryString = piexif.insert(exifStr, resizedBinaryString);
            
            // BinaryString -> ArrayBuffer -> Blob
            const finalArrayBuffer = binaryStringToArrayBuffer(finalBinaryString);
            const finalBlob = new Blob([finalArrayBuffer], { type: "image/jpeg" });
            
            self.postMessage({ id, blob: finalBlob });
        } catch (e) {
            console.error("Failed to insert EXIF, falling back to compressed blob.", e);
            // Fallback: EXIF 삽입 실패 시 압축된 Blob만 반환
            self.postMessage({ id, blob: resizedBlob, warning: "EXIF insert failed." });
        }
    } else {
        self.postMessage({ id, blob: resizedBlob });
    }

  } catch (error) {
    // createImageBitmap 실패, Pica resize 실패 등 처리
    const errorMessage = error instanceof Error ? error.message : "Unknown compression error";
    
    // 이 에러는 주로 Fingerprinting Protection이나 이미지 로드 실패 시 발생
    self.postMessage({ id, error: errorMessage, warning: "Compression failed, using original file." });
  }
};

// -----------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------

function isJPEGFile(file: File): boolean {
  return file.type === "image/jpeg" || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg");
}

function calculateSize(srcW: number, srcH: number, maxW: number, maxH: number) {
    const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
    return {
        width: Math.round(srcW * ratio),
        height: Math.round(srcH * ratio)
    };
}

/**
 * ArrayBuffer를 바이너리 문자열(Latin-1)로 변환합니다.
 * FileReader를 사용하여 대용량 파일도 빠르고 안정적으로 처리합니다.
 */
async function arrayBufferToBinaryString(buffer: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const blob = new Blob([buffer]);
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsBinaryString(blob);
    });
}

function binaryStringToArrayBuffer(binary: string): ArrayBuffer {
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
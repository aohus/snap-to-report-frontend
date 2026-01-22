import piexif from "piexifjs";
import Pica from "pica";

const pica = new Pica();

self.onmessage = async (e) => {
  // Transferable ArrayBuffer를 받습니다.
  const { id, arrayBuffer, fileType, fileName, fileLastModified, maxWidth, maxHeight, quality } = e.data;

  // ArrayBuffer를 File 객체로 변환
  const file = new File([arrayBuffer], fileName, { type: fileType, lastModified: fileLastModified });

  try {
    // 1. Extract EXIF
    let originalExifObj = null;
    const isCompressible = isCompressibleFile(file);
    
    if (isCompressible) {
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
    
    // Create source and destination canvases for Pica
    const from = new OffscreenCanvas(bitmap.width, bitmap.height);
    const fromCtx = from.getContext("2d");
    if (!fromCtx) throw new Error("Failed to get 2D rendering context for source canvas.");
    fromCtx.drawImage(bitmap, 0, 0);

    const to = new OffscreenCanvas(width, height);
    
    // Use Pica for high quality resize
    await pica.resize(from, to, {
      unsharpAmount: 80,
      unsharpRadius: 0.6,
      unsharpThreshold: 2
    });

    // 3. Export to Blob
    const resizedBlob = await to.convertToBlob({
      type: "image/jpeg",
      quality: quality
    });

    // 4. Insert EXIF
    if (originalExifObj && resizedBlob && isCompressible) {
        try {
            const resizedArrayBuffer = await resizedBlob.arrayBuffer();
            const resizedBinaryString = await arrayBufferToBinaryString(resizedArrayBuffer);
            
            const exifStr = piexif.dump(originalExifObj);
            const finalBinaryString = piexif.insert(exifStr, resizedBinaryString);
            
            const finalArrayBuffer = binaryStringToArrayBuffer(finalBinaryString);
            const finalBlob = new Blob([finalArrayBuffer], { type: "image/jpeg" });
            
            self.postMessage({ id, blob: finalBlob });
        } catch (e) {
            console.error("Failed to insert EXIF, falling back to compressed blob.", e);
            self.postMessage({ id, blob: resizedBlob, warning: "EXIF insert failed." });
        }
    } else {
        self.postMessage({ id, blob: resizedBlob });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown compression error";
    self.postMessage({ id, error: errorMessage, warning: "Compression failed, using original file." });
  }
};

// -----------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------

function isCompressibleFile(file: File): boolean {
  const compressibleTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  return compressibleTypes.includes(file.type.toLowerCase()) || 
         /\.(jpg|jpeg|png|webp|heic)$/i.test(file.name);
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
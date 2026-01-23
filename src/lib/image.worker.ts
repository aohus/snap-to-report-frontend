import piexif from "piexifjs";

self.onmessage = async (e) => {
  const { id, arrayBuffer, fileType, fileName, fileLastModified, maxWidth, maxHeight, quality } = e.data;
  const file = new File([arrayBuffer], fileName, { type: fileType, lastModified: fileLastModified });

  try {
    // 1. EXIF 데이터 추출
    let originalExifObj = null;
    const isCompressible = isCompressibleFile(file);
    
    if (isCompressible) {
      try {
        const binaryString = await arrayBufferToBinaryString(arrayBuffer);
        originalExifObj = piexif.load(binaryString);
      } catch (err) {
        // EXIF 로드 실패 시 무시
      }
    }

    // 2. 비트맵 생성 및 네이티브 리사이징 (고속 처리)
    // createImageBitmap은 하드웨어 가속을 활용하며 메인 스레드를 차단하지 않습니다.
    const bitmap = await createImageBitmap(file);
    const { width, height } = calculateSize(bitmap.width, bitmap.height, maxWidth, maxHeight);
    
    // OffscreenCanvas를 사용하여 네이티브 리사이징 수행
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    if (!ctx) throw new Error("Failed to get 2D context");

    // 고품질 네이티브 리샘플링 설정
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    // 3. Blob으로 내보내기 (이 과정에서 압축 품질 적용)
    const resizedBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: quality
    });

    // 4. EXIF 데이터 재삽입
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
            console.warn("EXIF insertion failed, returning compressed blob only.");
            self.postMessage({ id, blob: resizedBlob, warning: "EXIF_FAIL" });
        }
    } else {
        self.postMessage({ id, blob: resizedBlob });
    }

    // 메모리 해제
    bitmap.close();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    self.postMessage({ id, error: errorMessage });
  }
};

// -----------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------

function isCompressibleFile(file: File): boolean {
  const compressibleTypes = ["image/jpeg", "image/png", "image/webp"];
  return compressibleTypes.includes(file.type.toLowerCase()) || 
         /\.(jpg|jpeg|png|webp)$/i.test(file.name);
}

function calculateSize(srcW: number, srcH: number, maxW: number, maxH: number) {
    const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
    return {
        width: Math.round(srcW * ratio),
        height: Math.round(srcH * ratio)
    };
}

async function arrayBufferToBinaryString(buffer: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const blob = new Blob([buffer]);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
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

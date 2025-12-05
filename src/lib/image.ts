
import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file using browser-image-compression library.
 * This approach aims to preserve EXIF metadata (like GPS) while reducing file size.
 * 
 * @param file The original image file.
 * @param maxWidth The maximum width of the output image.
 * @param maxHeight The maximum height of the output image.
 * @param quality The quality of the output image (0 to 1).
 * @returns A Promise that resolves to the compressed File.
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: Math.max(maxWidth, maxHeight),
    useWebWorker: true,
    initialQuality: quality,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Image compression failed, returning original file:", error);
    return file;
  }
}

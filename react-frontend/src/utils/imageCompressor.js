/**
 * Utility to compress and resize document images in the browser before sending to OCR.
 * Ensures the file is well under the 5 MB limit (usually ~200KB-500KB)
 * while preserving high text sharpness for OCR recognition.
 */
export async function compressDocumentImage(file, options = {}) {
  const {
    maxSizeMB = 5,
    maxDimension = 1800, // Sufficient for high-detail OCR
    quality = 0.82,
    outputType = 'image/jpeg',
  } = options;

  // Validate basic file type
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida.');
  }

  // If file is unreasonably huge (> 25MB), reject early
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > 25) {
    throw new Error('La imagen original supera los 25 MB. Por favor seleccione una foto más liviana.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => reject(new Error('No se pudo decodificar la imagen.'));

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if dimensions exceed maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('No se pudo inicializar el contexto de imagen.'));
          }

          // Fill white background (useful for transparent PNGs)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Export as blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Error al comprimir la imagen.'));
              }

              const compressedSizeMB = blob.size / (1024 * 1024);
              if (compressedSizeMB > maxSizeMB) {
                return reject(
                  new Error(`La imagen comprimida (${compressedSizeMB.toFixed(1)} MB) sigue superando el límite de ${maxSizeMB} MB.`)
                );
              }

              // Create File from Blob preserving original name
              const extension = outputType === 'image/webp' ? '.webp' : '.jpg';
              const cleanName = file.name.replace(/\.[^/.]+$/, '') + extension;
              const compressedFile = new File([blob], cleanName, { type: outputType });

              resolve({
                file: compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                originalSizeMB: sizeMB.toFixed(2),
                compressedSizeMB: compressedSizeMB.toFixed(2),
                dataUrl: canvas.toDataURL(outputType, quality),
                wasCompressed: file.size > blob.size,
              });
            },
            outputType,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

'use client'

/**
 * Shrinks a photo in the browser before upload. A phone camera JPEG is often
 * 4-8 MB; sellers pay for that data and wait for it on 3G. This gets a
 * listing photo down to roughly 200-400 KB with no visible loss at the size
 * it's actually displayed.
 */
export async function downscale(
  file: File,
  maxEdge = 1400,
  quality = 0.82
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))

  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) return file

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  )

  // If the browser refused, or shrinking somehow made it bigger, keep the original.
  return blob && blob.size < file.size ? blob : file
}

/** Bucket used for every seller-uploaded image. */
export const PHOTO_BUCKET = 'product-photos'

'use client'

import imageCompression from 'browser-image-compression'

export interface ImageCompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
  fileType?: 'image/webp' | 'image/jpeg' | 'image/png'
}

/**
 * Compress and resize an image file
 * Default: 300KB max, 400px max dimension, webp format
 */
export async function compressImage(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 0.3, // 300KB
    maxWidthOrHeight = 400,
    quality = 0.8,
    fileType = 'image/webp'
  } = options

  const compressionOptions = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType,
    initialQuality: quality,
  }

  // If it's a Blob (from canvas), convert to File first
  const inputFile = file instanceof File 
    ? file 
    : new File([file], 'image.jpg', { type: file.type || 'image/jpeg' })

  const compressedFile = await imageCompression(inputFile, compressionOptions)
  return compressedFile
}

/**
 * Compress avatar image (small, optimized for profile pics)
 * Output: max 200KB, 400x400px, webp
 */
export async function compressAvatar(file: File | Blob): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.2, // 200KB
    maxWidthOrHeight: 400,
    fileType: 'image/webp'
  })
}

/**
 * Compress post image (larger, for feed posts)
 * Output: max 500KB, 1200px, webp
 */
export async function compressPostImage(file: File | Blob): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    fileType: 'image/webp'
  })
}

/**
 * Convert base64 data URL to compressed File
 * Useful for camera captures
 */
export async function compressBase64Image(
  base64DataUrl: string,
  options: ImageCompressionOptions = {}
): Promise<File> {
  // Fetch the base64 as blob
  const response = await fetch(base64DataUrl)
  const blob = await response.blob()
  
  return compressImage(blob, options)
}

/**
 * Compress camera capture for avatar
 * Takes base64, returns compressed File
 */
export async function compressCameraCapture(base64DataUrl: string): Promise<File> {
  return compressBase64Image(base64DataUrl, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 400,
    fileType: 'image/webp'
  })
}

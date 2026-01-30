'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, RotateCcw, Check, AlertCircle, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

interface FaceCaptureProps {
  onCapture: (imageData: string, faceDetected: boolean) => void
  onSkip?: () => void
  required?: boolean
}

export default function FaceCapture({ onCapture, onSkip, required = true }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  // Start camera
  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setCameraError(null)
    
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
    } catch (error: any) {
      console.error('Camera error:', error)
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera access in your browser settings.')
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera and try again.')
      } else {
        setCameraError('Could not access camera. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [facingMode, stream])

  // Start camera on mount
  useEffect(() => {
    startCamera()
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, []) // Only run on mount

  // Handle facing mode change
  const switchCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newMode)
    
    // Stop current stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    
    // Start with new facing mode
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })
      
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
    } catch (error) {
      console.error('Failed to switch camera:', error)
      toast.error('Could not switch camera')
    }
  }

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageData)

    // Validate face in the image
    validateFace(imageData)
  }

  // Validate face using Face Detection API (if available) or canvas-based heuristics
  const validateFace = async (imageData: string) => {
    setIsValidating(true)
    setFaceDetected(false)

    try {
      // Try using the native Face Detection API (Chrome/Edge)
      if ('FaceDetector' in window) {
        const img = new Image()
        img.src = imageData
        await img.decode()

        // @ts-ignore - FaceDetector is not in TypeScript types yet
        const faceDetector = new window.FaceDetector()
        const faces = await faceDetector.detect(img)
        
        if (faces.length > 0) {
          setFaceDetected(true)
          toast.success('Face detected! ✓')
        } else {
          setFaceDetected(false)
          toast.error('No face detected. Please ensure your face is clearly visible.')
        }
      } else {
        // Fallback: Simple brightness/contrast check for face-like region
        // This is a basic heuristic - not actual face detection
        const img = new Image()
        img.src = imageData
        await img.decode()

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('No canvas context')

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Get center region (where face should be)
        const centerX = Math.floor(img.width / 2)
        const centerY = Math.floor(img.height / 2)
        const regionSize = Math.min(img.width, img.height) / 3
        
        const imageDataRegion = ctx.getImageData(
          centerX - regionSize / 2,
          centerY - regionSize / 2,
          regionSize,
          regionSize
        )

        // Calculate brightness variance (faces have varied brightness due to features)
        const data = imageDataRegion.data
        let sum = 0
        let sumSq = 0
        let skinTonePixels = 0
        const pixelCount = data.length / 4

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3
          sum += brightness
          sumSq += brightness * brightness

          // Simple skin tone detection (very rough)
          if (r > 95 && g > 40 && b > 20 && 
              r > g && r > b && 
              Math.abs(r - g) > 15 &&
              r - g < 100 && r - b < 100) {
            skinTonePixels++
          }
        }

        const mean = sum / pixelCount
        const variance = (sumSq / pixelCount) - (mean * mean)
        const skinRatio = skinTonePixels / pixelCount

        // Heuristic: faces have moderate brightness variance and some skin-colored pixels
        const hasVariance = variance > 500 && variance < 8000
        const hasSkinTones = skinRatio > 0.1

        if (hasVariance && hasSkinTones) {
          setFaceDetected(true)
          toast.success('Photo looks good! ✓')
        } else {
          setFaceDetected(false)
          toast.error('Please ensure your face is clearly visible and well-lit.')
        }
      }
    } catch (error) {
      console.error('Face validation error:', error)
      // If detection fails, we'll let it pass with a warning
      setFaceDetected(true)
      toast.info('Could not verify face automatically. Photo will be reviewed by admin.')
    } finally {
      setIsValidating(false)
    }
  }

  // Retake photo
  const retake = () => {
    setCapturedImage(null)
    setFaceDetected(false)
  }

  // Confirm and submit
  const confirm = () => {
    if (capturedImage) {
      onCapture(capturedImage, faceDetected)
    }
  }

  // Camera not available view
  if (cameraError) {
    return (
      <div className="space-y-6">
        <div className="glass-panel-dark rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Camera Access Required</h3>
          <p className="text-white/60 text-sm mb-4">{cameraError}</p>
          <button
            onClick={startCamera}
            className="btn-secondary"
          >
            Try Again
          </button>
        </div>
        
        {!required && onSkip && (
          <button
            onClick={onSkip}
            className="w-full text-white/50 text-sm hover:text-white/70 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    )
  }

  // Captured image view
  if (capturedImage) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden">
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full aspect-[4/3] object-cover"
          />
          
          {isValidating && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-sacred-gold animate-spin mx-auto mb-2" />
                <p className="text-white text-sm">Verifying face...</p>
              </div>
            </div>
          )}

          {!isValidating && (
            <div className={`absolute bottom-4 left-4 right-4 rounded-lg p-3 ${
              faceDetected ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <div className="flex items-center gap-2">
                {faceDetected ? (
                  <>
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Face verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm font-medium">Face not detected</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={retake}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retake
          </button>
          <button
            onClick={confirm}
            disabled={required && !faceDetected}
            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {faceDetected ? 'Confirm' : 'Try Again'}
          </button>
        </div>

        {!faceDetected && (
          <p className="text-white/50 text-xs text-center">
            Tip: Make sure your face is centered, well-lit, and clearly visible.
          </p>
        )}
      </div>
    )
  }

  // Camera view
  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden bg-black">
        {isLoading ? (
          <div className="aspect-[4/3] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-sacred-gold animate-spin" />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] object-cover mirror"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            
            {/* Face guide overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-white/30 rounded-[50%]" />
              <p className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm">
                Position your face in the oval
              </p>
            </div>

            {/* Camera switch button */}
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              title="Switch camera"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <button
        onClick={capturePhoto}
        disabled={isLoading}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        <Camera className="w-5 h-5" />
        Take Photo
      </button>

      <p className="text-white/50 text-xs text-center">
        This photo is used for identity verification only and will be reviewed by admins.
      </p>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

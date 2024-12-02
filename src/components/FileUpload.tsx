import { useState } from 'react'
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface FileUploadProps {
  onUploadComplete: (url: string) => void
  accept: string
  maxSize?: number // in MB
}

export default function FileUpload({ onUploadComplete, accept, maxSize = 10 }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024)
    if (fileSizeInMB > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${maxSize}MB. Current size: ${fileSizeInMB.toFixed(1)}MB`
      }
    }

    // Check file type
    if (!file.type.startsWith(accept.replace('/*', ''))) {
      return {
        valid: false,
        error: `Invalid file type. Please upload a ${accept.includes('audio') ? 'sound file' : 'image file'}`
      }
    }

    return { valid: true }
  }

  const getStoragePath = (file: File): string => {
    const timestamp = new Date().getTime()
    const randomString = Math.random().toString(36).substring(2, 15)
    const cleanFileName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-')
    return `${accept.includes('audio') ? 'songs' : 'images'}/${timestamp}-${randomString}-${cleanFileName}`
  }

  const handleUpload = async (file: File) => {
    try {
      setError(null)
      setUploading(true)
      setUploadProgress(0)

      // Validate the file
      const validation = validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Get storage path
      const filePath = getStoragePath(file)

      // Check if bucket exists and is accessible
      const { error: bucketError } = await supabase
        .storage
        .getBucket('media')

      if (bucketError) {
        // If bucket doesn't exist, try to create it
        const { error: createError } = await supabase
          .storage
          .createBucket('media', {
            public: true,
            fileSizeLimit: maxSize * 1024 * 1024
          })

        if (createError) {
          throw new Error('Failed to configure storage: ' + createError.message)
        }
      }

      // Upload file with progress tracking
      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          duplex: 'half'
        })

      if (uploadError) {
        throw uploadError
      }

      if (!data?.path) {
        throw new Error('Upload failed: No path returned')
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(data.path)

      if (!publicUrl) {
        throw new Error('Failed to get public URL')
      }

      // Track progress separately since the type isn't properly supported
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (event: ProgressEvent) => {
        const percentage = (event.loaded / event.total) * 100
        setUploadProgress(Math.round(percentage))
      }

      setUploadProgress(100)
      onUploadComplete(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      await handleUpload(file)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleUpload(file)
    }
  }

  return (
    <div className="relative">
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors relative
          ${isDragging ? 'border-white bg-zinc-800/50' : 'border-gray-600 hover:border-gray-500'}
          ${uploading ? 'opacity-50 cursor-wait' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
            <div>
              <p className="text-gray-400 mb-2">
                Uploading... {uploadProgress}%
              </p>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-400 mb-1">
              Drop file here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              {accept.includes('audio') ? 'Accepts audio files (MP3, WAV, M4A)' : 'Accepts image files (JPG, PNG)'} (max {maxSize}MB)
            </p>
          </>
        )}
      </div>
    </div>
  )
}
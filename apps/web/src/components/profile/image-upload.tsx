"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload } from "lucide-react"

interface ImageUploadProps {
  currentImage?: string
  onImageChange: (imageUrl: string) => void
  className?: string
  width?: number
  height?: number
  rounded?: boolean
}

export default function ImageUpload({
  currentImage = "/placeholder.svg?height=150&width=150",
  onImageChange,
  className = "",
  width = 150,
  height = 150,
  rounded = true,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    // In a real app, you would upload the file to a server and get a URL back
    // For this example, we'll use a placeholder
    const newImageUrl = `/placeholder.svg?height=${height}&width=${width}&text=New+Image`

    setPreviewUrl(newImageUrl)
    onImageChange(newImageUrl)
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={previewUrl || "/placeholder.svg"}
        alt="Upload preview"
        width={width}
        height={height}
        className={`object-cover ${rounded ? "rounded-full" : "rounded-md"}`}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer"
      >
        <Upload className="h-4 w-4" />
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}

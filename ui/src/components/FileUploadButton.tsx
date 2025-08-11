import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface FileUploadButtonProps {
  onUpload: (file: File) => Promise<any>
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      await onUpload(file)
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".sqlite"
      />

      <Button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        variant="default"
      >
        {loading ? "Uploading..." : "Upload File"}
      </Button>
    </>
  )
}

export default FileUploadButton

import { useState, useRef } from 'react'
import { UploadCloud, File, Download, Trash2, Image as ImageIcon, FileText } from 'lucide-react'

/**
 * FilesModule
 * Drag & drop UI for file sharing. 
 * Since file storage strategy is an open question, we'll mock the upload/download
 * but build the full UI as designed.
 */
export default function FilesModule({ files, onUpload, onDownload, onDelete }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList) => {
    Array.from(fileList).forEach(file => {
      // Basic size validation (e.g. 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 5MB limit.`)
        return
      }
      onUpload(file)
    })
  }

  return (
    <div className="module-container h-full flex flex-col">
      <div className="module-header shrink-0">
        <h2 className="module-title">Files</h2>
        <p className="module-subtitle">Share temporary files and images</p>
      </div>

      <div 
        className={`drop-zone shrink-0 mb-6 ${isDragging ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud size={48} className="mx-auto mb-4 text-white/40" />
        <h3 className="text-lg font-display font-medium text-white mb-2">Drag & Drop Files Here</h3>
        <p className="text-sm text-white/40 mb-6">Max size: 5MB per file</p>
        <button className="btn-secondary" style={{ width: 'auto' }} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
          Browse Files
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          onChange={handleFileSelect}
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">Shared Files</h3>
        
        {files.length === 0 ? (
          <div className="text-center text-sm text-white/40 mt-8">
            No files shared yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {files.map(file => (
              <FileCard key={file.id} file={file} onDownload={() => onDownload(file)} onDelete={() => onDelete(file.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FileCard({ file, onDownload, onDelete }) {
  const isImage = file.mime_type?.startsWith('image/')
  
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="glass-card p-4 flex items-center gap-4 hover:border-white/20 transition-all">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
        {isImage ? <ImageIcon size={24} className="text-accent-secondary" /> : <FileText size={24} className="text-accent-blue" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate mb-1">{file.filename}</div>
        <div className="text-xs text-white/40 flex items-center gap-2">
          <span>{formatSize(file.size_bytes)}</span>
          <span>•</span>
          <span className="truncate">Uploaded by {file.uploaded_by}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <button 
          className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors" 
          title="Download"
          onClick={onDownload}
        >
          <Download size={18} />
        </button>
        <button 
          className="p-2 hover:bg-error/20 rounded-lg text-white/60 hover:text-error transition-colors"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}

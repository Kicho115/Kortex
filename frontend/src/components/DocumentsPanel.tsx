import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import './DocumentsPanel.css'

const ACCEPTED_EXTENSIONS = ['.csv', '.txt', '.pdf']
export interface UploadedDocument {
  id: string
  file: File
  status: 'ready' | 'error'
  errorMessage?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

function fileTypeLabel(file: File): string {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return 'PDF'
  if (name.endsWith('.csv')) return 'CSV'
  if (name.endsWith('.txt')) return 'TXT'
  return 'Archivo'
}

interface DocumentsPanelProps {
  documents: UploadedDocument[]
  onDocumentsChange: (documents: UploadedDocument[]) => void
}

export default function DocumentsPanel({
  documents,
  onDocumentsChange,
}: DocumentsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    const valid: UploadedDocument[] = []
    const errors: string[] = []

    for (const file of incoming) {
      if (!isAcceptedFile(file)) {
        errors.push(`"${file.name}" no es CSV, TXT o PDF`)
        continue
      }
      if (documents.some((d) => d.file.name === file.name && d.file.size === file.size)) {
        errors.push(`"${file.name}" ya está en la lista`)
        continue
      }
      valid.push({
        id: crypto.randomUUID(),
        file,
        status: 'ready',
      })
    }

    if (valid.length > 0) {
      onDocumentsChange([...documents, ...valid])
    }
    setUploadError(errors.length > 0 ? errors.join('. ') : null)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      addFiles(event.target.files)
      event.target.value = ''
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (event.dataTransfer.files.length) {
      addFiles(event.dataTransfer.files)
    }
  }

  function removeDocument(id: string) {
    onDocumentsChange(documents.filter((d) => d.id !== id))
    setUploadError(null)
  }

  return (
    <div className="docs">
      <div className="docs__intro">
        <h2 className="docs__title">Documentos</h2>
        <p className="docs__description">
          Sube archivos de tu empresa para que Kortex los indexe y pueda
          responder con contexto real en el chat.
        </p>
      </div>

      <div
        className={isDragging ? 'docs__dropzone docs__dropzone--active' : 'docs__dropzone'}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="docs__file-input"
          accept=".csv,.txt,.pdf,text/csv,text/plain,application/pdf"
          multiple
          onChange={handleInputChange}
          aria-label="Seleccionar archivos"
        />
        <div className="docs__dropzone-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path
              d="M24 32V8m0 0l-8 8m8-8l8 8M8 36v4a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4v-4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="docs__dropzone-title">
          Arrastra tus archivos aquí
        </p>
        <p className="docs__dropzone-hint">CSV, TXT o PDF — máx. recomendado 20 MB</p>
        <button
          type="button"
          className="docs__browse-btn"
          onClick={() => inputRef.current?.click()}
        >
          Seleccionar archivos
        </button>
      </div>

      {uploadError && (
        <p className="docs__error" role="alert">
          {uploadError}
        </p>
      )}

      {documents.length > 0 && (
        <div className="docs__list-section">
          <div className="docs__list-header">
            <h3 className="docs__list-title">
              Archivos cargados ({documents.length})
            </h3>
            <button
              type="button"
              className="docs__clear-btn"
              onClick={() => onDocumentsChange([])}
            >
              Vaciar todo
            </button>
          </div>
          <ul className="docs__list">
            {documents.map((doc) => (
              <li key={doc.id} className="docs__item">
                <div className="docs__item-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 4h8l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path d="M16 4v4h4" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </div>
                <div className="docs__item-info">
                  <span className="docs__item-name">{doc.file.name}</span>
                  <span className="docs__item-meta">
                    {fileTypeLabel(doc.file)} · {formatFileSize(doc.file.size)}
                  </span>
                </div>
                <span className="docs__item-badge docs__item-badge--ready">
                  Listo
                </span>
                <button
                  type="button"
                  className="docs__item-remove"
                  onClick={() => removeDocument(doc.id)}
                  aria-label={`Eliminar ${doc.file.name}`}
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

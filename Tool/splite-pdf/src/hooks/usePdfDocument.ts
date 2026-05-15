import { useState, useEffect } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { loadPdfDocument } from '../utils/pdfRenderer'

interface UsePdfDocumentResult {
  pdfDoc: PDFDocumentProxy | null
  numPages: number
  loading: boolean
  error: string | null
}

export function usePdfDocument(file: File | null): UsePdfDocumentResult {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPdfDoc(null)
      setNumPages(0)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    loadPdfDocument(file)
      .then((doc) => {
        if (cancelled) return
        setPdfDoc(doc)
        setNumPages(doc.numPages)
      })
      .catch((err) => {
        if (cancelled) return
        setError(`Không thể đọc file PDF: ${err.message}`)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [file])

  return { pdfDoc, numPages, loading, error }
}

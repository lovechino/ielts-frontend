'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker correctly for Next.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    // Handle resizing
    const updateWidth = () => {
      const container = document.getElementById('pdf-container');
      if (container) {
        setContainerWidth(container.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div id="pdf-container" className="w-full flex flex-col items-center bg-slate-100 rounded-[2.5rem] p-4 md:p-8 shadow-inner">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex flex-col items-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-slate-500 font-bold">Loading PDF content...</p>
          </div>
        }
        error={
          <div className="p-10 text-center text-red-500">
            <p className="font-bold">Failed to load PDF.</p>
            <a href={url} target="_blank" rel="noreferrer" className="text-indigo-600 underline mt-2 block">
              Download and view instead
            </a>
          </div>
        }
      >
        {Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} className="mb-8 last:mb-0 shadow-xl rounded-lg overflow-hidden">
            <Page 
              pageNumber={index + 1} 
              width={containerWidth > 40 ? containerWidth - 40 : containerWidth}
              renderAnnotationLayer={false}
              renderTextLayer={true}
              className="bg-white"
            />
          </div>
        ))}
      </Document>
    </div>
  );
}

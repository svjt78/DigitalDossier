// components/PDFViewerModal.js
import { useEffect } from 'react';

export default function PDFViewerModal({ isOpen, pdfUrl, onClose }) {
  useEffect(() => {
    console.log("PDFViewerModal - isOpen:", isOpen, "pdfUrl:", pdfUrl);
  }, [isOpen, pdfUrl]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-gray-900 p-4 rounded-md w-full max-w-4xl">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-white text-lg">Close</button>
        </div>
        <div className="mt-2">
          <iframe 
            src={pdfUrl} 
            width="100%" 
            height="600px" 
            title="PDF Viewer"
            className="rounded"
          />
        </div>
      </div>
    </div>
  );
}

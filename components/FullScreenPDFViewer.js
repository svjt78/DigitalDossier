import { useRef } from 'react';
import { useRouter } from 'next/router';
import { X, Download, Printer } from 'lucide-react';

export default function FullScreenPDFViewer({ isOpen, pdfUrl }) {
  const iframeRef = useRef(null);
  const router = useRouter();

  if (!isOpen || !pdfUrl) return null;

  const handleDownload = () => {
    // open in new tab so user can save
    window.open(pdfUrl, '_blank');
    router.back();
  };

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex justify-end space-x-4 p-4">
        <button onClick={handleDownload} className="text-white" aria-label="Download PDF">
          <Download className="h-6 w-6" />
        </button>
        <button onClick={handlePrint} className="text-white" aria-label="Print PDF">
          <Printer className="h-6 w-6" />
        </button>
        <button onClick={handleClose} className="text-white" aria-label="Close viewer">
          <X className="h-6 w-6" />
        </button>
      </div>
      {/* PDF iframe */}
      <div className="flex-1">
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          title="PDF Viewer"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

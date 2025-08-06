
import { useEffect, useState, useRef } from "react";
import { Invoice } from "@/types";
import { InvoicePDF } from "./InvoicePDF";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PDFViewerProps {
  invoice: Invoice;
  onClose: () => void;
}

export function PDFViewer({ invoice, onClose }: PDFViewerProps) {
  const [pdfDataUrl, setPdfDataUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Helper function to format invoice number for display
  const formatInvoiceNumberForDisplay = (invoice: Invoice): string => {
    // Extract the number part from the original invoice number
    const parts = invoice.number.split('/');
    if (parts.length !== 3) {
      return invoice.number; // Fallback to original if format is unexpected
    }
    
    const invoiceNum = parts[2];
    
    // Parse the date to determine the format
    const dateParts = invoice.date.split('/');
    
    // Check if date is in MM/YYYY format (monthly distribution with hidden day)
    if (dateParts.length === 2) {
      // Monthly format: FA + YYMM + N°Facture
      const month = dateParts[0].padStart(2, '0');
      const year = dateParts[1].slice(-2); // Get last 2 digits of year
      return `FA${year}${month}${invoiceNum}`;
    } else if (dateParts.length === 3) {
      // Daily format: FA + YYMMDD + N°Facture
      const day = dateParts[0].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      const year = dateParts[2].slice(-2); // Get last 2 digits of year
      return `FA${year}${month}${day}${invoiceNum}`;
    }
    
    // Fallback to original format if date parsing fails
    return invoice.number;
  };

  useEffect(() => {
    const generatePDF = async () => {
      try {
        setIsLoading(true);
        const pdfDoc = await InvoicePDF.generate(invoice);
        const dataUrl = pdfDoc.output("datauristring");
        setPdfDataUrl(dataUrl);
        setIsLoading(false);
      } catch (error) {
        console.error("Error generating PDF:", error);
        setIsLoading(false);
      }
    };

    generatePDF();
  }, [invoice]);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Invoice Preview: {formatInvoiceNumberForDisplay(invoice)}
          </h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-brand-teal hover:bg-opacity-90">
              Print
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-lg font-medium">Loading PDF...</p>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={pdfDataUrl}
              className="w-full h-full"
              title="Invoice Preview"
            />
          )}
        </div>
      </div>
    </div>
  );
}

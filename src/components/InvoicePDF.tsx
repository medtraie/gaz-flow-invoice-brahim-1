
import { jsPDF } from "jspdf";
import { Invoice } from "@/types";
import { numberToWords } from "@/lib/utils";

export class InvoicePDF {
  static async generate(invoice: Invoice): Promise<jsPDF> {
    const doc = new jsPDF();
    await this.generateInPDF(invoice, doc);
    return doc;
  }

  private static formatInvoiceNumberForDisplay(invoice: Invoice): string {
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
  }

  static async generateInPDF(invoice: Invoice, doc: jsPDF): Promise<void> {
    // Document setup with premium white background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
    
    // Add subtle background pattern for professional look
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    
    doc.setFontSize(10);
    doc.setLineWidth(0.2);
    
    // Add logo and company header together
    await this.addLogoAndHeader(doc, invoice);
    
    // Add invoice details with professional styling
    this.addInvoiceDetails(doc, invoice);
    
    // Add client information with modern card design
    this.addClientInfo(doc, invoice);
    
    // Add invoice table with enhanced professional styling - moved further down
    this.addInvoiceTable(doc, invoice);
    
    // Add totals with professional layout
    this.addTotals(doc, invoice);
    
    // Add footer with enhanced branding
    this.addFooter(doc, invoice);
    
    return;
  }

  private static async addLogoAndHeader(doc: jsPDF, invoice: Invoice): Promise<void> {
    // Choose logo and address based on company
    let logoPath: string;
    let address: string[];
    
    if (invoice.companyName === 'STE ZAGAZ') {
      logoPath = '/lovable-uploads/482faa3c-a7e3-4613-b2fa-c7cfa6303d72.png';
      address = [
        'SIEGE SOCIALE HAY MLY RACHID',
        'RUE IN 67 CASABLANCA'
      ];
    } else {
      logoPath = '/lovable-uploads/ecc93117-2467-444c-8d38-a02dec52c932.png';
      address = [
        '3 Rue Ait Ourir 2éme étage',
        'Bourgogne 20000 CASABLANCA'
      ];
    }
    
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            // Logo at the top of the document
            const imgWidth = 65;
            const imgHeight = (img.height * imgWidth) / img.width;
            
            // Position logo at top
            doc.addImage(img, 'PNG', 15, 15, imgWidth, imgHeight);
            
            // Add company address below logo with one line gap and aligned with S
            doc.setFontSize(11);
            doc.setTextColor(44, 62, 80);
            doc.setFont('helvetica', 'bold');
            
            // Position address with one line gap below logo and shifted left by one space
            const addressY = 15 + imgHeight + 8; // 8px gap (one line)
            const addressX = 16; // Shifted left by 1px to align with S in logo
            doc.text(address, addressX, addressY, { align: 'left', lineHeightFactor: 1.4 });
            
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = logoPath;
      });
    } catch (error) {
      console.error('Failed to load logo:', error);
      
      // Fallback: Add company header without logo
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      
      doc.text(address, 16, 20, { align: 'left', lineHeightFactor: 1.4 });
    }
  }

  private static addInvoiceDetails(doc: jsPDF, invoice: Invoice): void {
    // Professional header box with same color as RÉCAPITULATIF section
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(115, 15, 80, 25, 5, 5, 'F');
    
    // Add subtle border
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.roundedRect(115, 15, 80, 25, 5, 5, 'S');
    
    // Dark text for contrast on light background
    doc.setTextColor(44, 62, 80);
    const formattedInvoiceNumber = this.formatInvoiceNumberForDisplay(invoice);
    
    doc.text('FACTURE', 155, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° ${formattedInvoiceNumber}`, 155, 32, { align: 'center' });
  }

  private static addClientInfo(doc: jsPDF, invoice: Invoice): void {
    // Professional client info card with modern styling - positioned below logo
    doc.setFillColor(236, 240, 241);
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    
    // Calculate dynamic height
    const hasICE = invoice.client.ice && invoice.client.ice.trim() !== '';
    const hasAddress = invoice.client.address && invoice.client.address.trim() !== '';
    const hasPatente = invoice.client.code && invoice.client.code.trim() !== '';
    
    let clientInfoHeight = 18;
    if (hasPatente) clientInfoHeight += 6;
    if (hasICE) clientInfoHeight += 6;
    if (hasAddress) clientInfoHeight += 6;
    
    // Position adjusted for new logo position
    const cardY = 85;
    doc.roundedRect(15, cardY, 90, clientInfoHeight, 4, 4, 'FD');
    
    // Professional header
    doc.setFillColor(52, 73, 94);
    doc.roundedRect(15, cardY, 90, 8, 4, 4, 'F');
    doc.rect(15, cardY + 4, 90, 4, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('INFORMATIONS CLIENT', 60, cardY + 5.5, { align: 'center' });
    
    // Client details with professional formatting
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(44, 62, 80);
    let currentY = cardY + 14;
    
    // Client name with emphasis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${invoice.client.name}`, 20, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Dynamic information display
    if (hasICE && hasAddress) {
      doc.text(`ICE: ${invoice.client.ice}`, 20, currentY);
      currentY += 6;
      doc.text(`${invoice.client.address}`, 20, currentY);
    } else if (hasPatente && hasAddress) {
      doc.text(`Patente: ${invoice.client.code}`, 20, currentY);
      currentY += 6;
      doc.text(`${invoice.client.address}`, 20, currentY);
    } else if (hasPatente) {
      doc.text(`Patente: ${invoice.client.code}`, 20, currentY);
    } else if (hasICE) {
      doc.text(`ICE: ${invoice.client.ice}`, 20, currentY);
    }
    
    if (hasAddress && !hasICE && !hasPatente) {
      doc.text(`${invoice.client.address}`, 20, currentY);
    }
  }

  private static addInvoiceTable(doc: jsPDF, invoice: Invoice): void {
    // Increased startY to create more space between client info and table
    const startY = 135; // Increased from 115 to 135 for 20px additional spacing
    const headers = ['DESCRIPTION', 'QUANTITÉ', 'PRIX UNITAIRE', 'TAXES', 'MONTANT (DH)'];
    const columnWidths = [60, 30, 35, 25, 35];
    
    let currentX = 15;
    let currentY = startY;
    
    // Blue header background matching the uploaded image
    doc.setFillColor(79, 129, 189); // Blue color similar to the image
    doc.rect(15, currentY, 185, 10, 'F');
    
    // Add border to header
    doc.setDrawColor(60, 110, 170);
    doc.setLineWidth(0.5);
    doc.rect(15, currentY, 185, 10, 'S');
    
    // White header text for better contrast on blue background
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255); // White text
    
    headers.forEach((header, i) => {
      const alignment = i > 0 ? 'center' : 'left';
      const x = i > 0 ? currentX + columnWidths[i] / 2 : currentX + 4;
      doc.text(header, x, currentY + 6.5, { align: alignment });
      currentX += columnWidths[i];
    });
    
    // Professional table rows with alternating colors
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(44, 62, 80);
    currentY += 10;
    
    invoice.items.forEach((item, idx) => {
      const rowData = [
        item.description,
        item.quantity.toString(),
        item.unitPrice.toFixed(2),
        `${item.taxRate}%`,
        item.amount.toFixed(2)
      ];
      
      // Professional alternating row colors
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255); // White
      } else {
        doc.setFillColor(252, 252, 252); // Very light gray
      }
      doc.rect(15, currentY, 185, 8, 'F');
      
      // Add subtle row borders
      doc.setDrawColor(236, 240, 241);
      doc.setLineWidth(0.2);
      doc.line(15, currentY + 8, 200, currentY + 8);
      
      currentX = 15;
      rowData.forEach((text, i) => {
        const alignment = i === 0 ? 'left' : 'center';
        const x = i === 0 ? currentX + 4 : currentX + columnWidths[i] / 2;
        doc.setFontSize(9);
        doc.text(text, x, currentY + 5.5, { align: alignment });
        currentX += columnWidths[i];
      });
      
      currentY += 8;
    });
    
    // Professional table border
    doc.setDrawColor(60, 110, 170);
    doc.setLineWidth(0.8);
    doc.rect(15, startY, 185, currentY - startY, 'S');
    
    // Column separators
    doc.setDrawColor(60, 110, 170);
    doc.setLineWidth(0.3);
    currentX = 15;
    headers.forEach((_, i) => {
      if (i < headers.length - 1) {
        currentX += columnWidths[i];
        doc.line(currentX, startY, currentX, currentY);
      }
    });
  }

  private static addTotals(doc: jsPDF, invoice: Invoice): void {
    // Adjusted totalsY to account for the new table position
    const totalsY = 185 + invoice.items.length * 8; // Increased from 165 to 185
    
    // Professional totals section with modern card design
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.roundedRect(125, totalsY - 8, 75, 35, 4, 4, 'FD');
    
    // Header for totals section
    doc.setFillColor(52, 73, 94);
    doc.roundedRect(125, totalsY - 8, 75, 8, 4, 4, 'F');
    doc.rect(125, totalsY - 4, 75, 4, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('RÉCAPITULATIF', 162.5, totalsY - 3, { align: 'center' });
    
    // Totals with professional formatting
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(44, 62, 80);
    
    doc.text('Montant HT:', 130, totalsY + 5);
    doc.text(`${invoice.subtotal.toFixed(2)} DH`, 195, totalsY + 5, { align: 'right' });
    
    doc.text('TVA:', 130, totalsY + 12);
    doc.text(`${invoice.taxAmount.toFixed(2)} DH`, 195, totalsY + 12, { align: 'right' });
    
    // Professional total line
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(0.5);
    doc.line(130, totalsY + 16, 195, totalsY + 16);
    
    // Total TTC with emphasis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(52, 73, 94);
    doc.text('Total TTC:', 130, totalsY + 22);
    doc.text(`${invoice.total.toFixed(2)} DH`, 195, totalsY + 22, { align: 'right' });
    
    // Amount in words with professional styling
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(88, 88, 88);
    doc.text('Montant en lettres:', 15, totalsY + 35);
    
    const amountInWords = this.capitalizeFirstLetter(numberToWords(invoice.total));
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(52, 73, 94);
    doc.text(`${amountInWords} dirhams TTC`, 15, totalsY + 42);
  }

  private static addFooter(doc: jsPDF, invoice: Invoice): void {
    const pageHeight = doc.internal.pageSize.height;
    const totalPages = doc.getNumberOfPages();
    const currentPage = doc.getCurrentPageInfo().pageNumber;
    
    // Professional footer separator
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(1);
    doc.line(15, pageHeight - 35, 195, pageHeight - 35);
    
    // Add subtle footer background
    doc.setFillColor(248, 249, 250);
    doc.rect(0, pageHeight - 35, doc.internal.pageSize.width, 35, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(88, 88, 88);
    doc.setFont('helvetica', 'normal');
    
    // Company-specific footer information
    let footerText: string[];
    
    if (invoice.companyName === 'STE ZAGAZ') {
      footerText = [
        'STE ZAGAZ – SIEGE SOCIALE HAY MLY RACHID RUE IN 67 CASABLANCA',
        '',
        'RC: 47817, CNSS: 1216937, PATENTE: 330002498, ICE: 000705019000083'
      ];
    } else {
      footerText = [
        'STE AFROKH GAZ – 3 Rue Ait Ourir 2éme étage Bourgogne 20000 CASABLANCA',
        '',
        'ICE: 001836353000051, Patente: 35492054, C.N.S.S: 5270814, R.C: 365591'
      ];
    }
    
    doc.text(footerText, 105, pageHeight - 25, { align: 'center', lineHeightFactor: 1.6 });
    
    // Professional page numbering
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'italic');
    const pageText = `Page ${currentPage} sur ${totalPages}`;
    doc.text(pageText, 105, pageHeight - 8, { align: 'center' });
  }

  private static capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

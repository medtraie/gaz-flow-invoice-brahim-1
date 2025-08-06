import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Download, Printer, FileSpreadsheet, Search, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { InvoicePDF } from "@/components/InvoicePDF";
import { PDFViewer } from "@/components/PDFViewer";
import { Invoice } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function InvoicesPage() {
  const { 
    invoices, 
    setInvoices,
    selectedInvoices, 
    toggleInvoiceSelection, 
    selectAllInvoices, 
    deselectAllInvoices 
  } = useAppContext();
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [filterInvoiceNumber, setFilterInvoiceNumber] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesInvoiceNumber = filterInvoiceNumber === "" || 
      invoice.number.toLowerCase().includes(filterInvoiceNumber.toLowerCase());
    
    const matchesClient = filterClient === "" || 
      invoice.client.name.toLowerCase().includes(filterClient.toLowerCase());
    
    const matchesDate = !filterDate || invoice.date === filterDate.toLocaleDateString('fr-FR');
    
    return matchesInvoiceNumber && matchesClient && matchesDate;
  });

  const handlePrintInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
  };

  const handleCloseViewer = () => {
    setViewingInvoice(null);
  };

  const clearFilters = () => {
    setFilterInvoiceNumber("");
    setFilterClient("");
    setFilterDate(undefined);
  };

  const handleClearAllInvoices = () => {
    setInvoices([]);
    deselectAllInvoices();
    toast.success("Toutes les factures ont été supprimées");
  };

  const handleExportToExcel = () => {
    if (invoices.length === 0) {
      return;
    }

    const invoiceData = invoices.map(invoice => {
      const qty3kg = invoice.items.find(item => item.description === '3KG')?.quantity || 0;
      const qty6kg = invoice.items.find(item => item.description === '6KG')?.quantity || 0;
      const qty12kg = invoice.items.find(item => item.description === '12KG')?.quantity || 0;
      const qtyDetendeur = invoice.items.find(item => item.description === 'DETENDEUR CLIC-ON')?.quantity || 0;
      const qtyPropane = invoice.items.find(item => item.description === 'PROPANE 34 KG')?.quantity || 0;
      const qtyBng = invoice.items.find(item => item.description === 'BNG 12 KG')?.quantity || 0;
      
      const amount3kg = invoice.items.find(item => item.description === '3KG')?.amount || 0;
      const amount6kg = invoice.items.find(item => item.description === '6KG')?.amount || 0;
      const amount12kg = invoice.items.find(item => item.description === '12KG')?.amount || 0;
      const amountDetendeur = invoice.items.find(item => item.description === 'DETENDEUR CLIC-ON')?.amount || 0;
      const amountPropane = invoice.items.find(item => item.description === 'PROPANE 34 KG')?.amount || 0;
      const amountBng = invoice.items.find(item => item.description === 'BNG 12 KG')?.amount || 0;

      return {
        'DATE': invoice.date,
        'N° FACT': invoice.number,
        '3': qty3kg,
        '6': qty6kg,
        '12': qty12kg,
        'DETENDEUR CLIC-ON': qtyDetendeur,
        'PROPANE 34 KG': qtyPropane,
        'BNG 12 KG': qtyBng,
        'P.03KG': amount3kg.toFixed(2),
        'P.06KG': amount6kg.toFixed(2),
        'P.12KG': amount12kg.toFixed(2),
        'P.DETENDEUR CLIC-ON': amountDetendeur.toFixed(2),
        'P.PROPANE 34 KG': amountPropane.toFixed(2),
        'P.BNG 12 KG': amountBng.toFixed(2),
        'Montant HT': invoice.subtotal.toFixed(2),
        'TVA': invoice.taxAmount.toFixed(2),
        'Montant TTC': invoice.total.toFixed(2)
      };
    });

    // Calculate totals for numeric columns
    const totals = {
      'DATE': 'TOTAL',
      'N° FACT': '',
      '3': invoiceData.reduce((sum, row) => sum + row['3'], 0),
      '6': invoiceData.reduce((sum, row) => sum + row['6'], 0),
      '12': invoiceData.reduce((sum, row) => sum + row['12'], 0),
      'DETENDEUR CLIC-ON': invoiceData.reduce((sum, row) => sum + row['DETENDEUR CLIC-ON'], 0),
      'PROPANE 34 KG': invoiceData.reduce((sum, row) => sum + row['PROPANE 34 KG'], 0),
      'BNG 12 KG': invoiceData.reduce((sum, row) => sum + row['BNG 12 KG'], 0),
      'P.03KG': invoiceData.reduce((sum, row) => sum + parseFloat(row['P.03KG']), 0).toFixed(2),
      'P.06KG': invoiceData.reduce((sum, row) => sum + parseFloat(row['P.06KG']), 0).toFixed(2),
      'P.12KG': invoiceData.reduce((sum, row) => sum + parseFloat(row['P.12KG']), 0).toFixed(2),
      'P.DETENDEUR CLIC-ON': invoiceData.reduce((sum, row) => sum + parseFloat(row['P.DETENDEUR CLIC-ON']), 0).toFixed(2),
      'P.PROPANE 34 KG': invoiceData.reduce((sum, row) => sum + parseFloat(row['P.PROPANE 34 KG']), 0).toFixed(2),
      'P.BNG 12 KG': invoiceData.reduce((sum, row) => sum + parseFloat(row['P.BNG 12 KG']), 0).toFixed(2),
      'Montant HT': invoiceData.reduce((sum, row) => sum + parseFloat(row['Montant HT']), 0).toFixed(2),
      'TVA': invoiceData.reduce((sum, row) => sum + parseFloat(row['TVA']), 0).toFixed(2),
      'Montant TTC': invoiceData.reduce((sum, row) => sum + parseFloat(row['Montant TTC']), 0).toFixed(2)
    };

    // Add totals row to the data
    const dataWithTotals = [...invoiceData, totals];

    const workbook = XLSX.utils.book_new();
    
    const invoiceSheet = XLSX.utils.json_to_sheet(dataWithTotals, {
      header: [
        'DATE', 'N° FACT', '3', '6', '12', 'DETENDEUR CLIC-ON', 'PROPANE 34 KG', 'BNG 12 KG',
        'P.03KG', 'P.06KG', 'P.12KG', 'P.DETENDEUR CLIC-ON', 'P.PROPANE 34 KG', 'P.BNG 12 KG',
        'Montant HT', 'TVA', 'Montant TTC'
      ]
    });

    // Style the totals row (last row)
    const totalRowIndex = dataWithTotals.length;
    const range = XLSX.utils.decode_range(invoiceSheet['!ref'] || 'A1');
    
    // Apply bold formatting to the totals row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
      if (invoiceSheet[cellAddress]) {
        invoiceSheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FFFF00" } } // Yellow background for totals
        };
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Données par facture');
    
    const fileName = `Factures_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleDownloadSelected = async (format: 'zip' | 'pdf') => {
    if (selectedInvoices.length === 0) {
      return;
    }

    setIsDownloading(true);
    
    try {
      const selectedInvoiceObjects = invoices.filter(inv => selectedInvoices.includes(inv.id));
      
      if (format === 'zip') {
        const zip = new JSZip();
        
        for (const invoice of selectedInvoiceObjects) {
          const pdf = await InvoicePDF.generate(invoice);
          zip.file(`Facture_${invoice.number}_${invoice.client.name}.pdf`, pdf.output('arraybuffer'));
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `Factures_${new Date().toISOString().slice(0, 10)}.zip`);
      } else {
        const pdf = new jsPDF();
        
        for (let i = 0; i < selectedInvoiceObjects.length; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          await InvoicePDF.generateInPDF(selectedInvoiceObjects[i], pdf);
        }
        
        pdf.save(`Factures_${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement des factures:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const areAllSelected = filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Factures</h1>
        <div className="flex space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                disabled={invoices.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Effacer Tout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action ne peut pas être annulée. Cela supprimera définitivement toutes les factures ({invoices.length} factures).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllInvoices} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Supprimer Tout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button 
            onClick={handleExportToExcel}
            disabled={invoices.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Exporter vers Excel
          </Button>
          <Button 
            onClick={() => handleDownloadSelected('pdf')} 
            disabled={selectedInvoices.length === 0 || isDownloading}
            className="bg-brand-teal hover:bg-opacity-90"
          >
            <Download className="mr-2 h-4 w-4" /> Télécharger PDF Combiné
          </Button>
          <Button 
            onClick={() => handleDownloadSelected('zip')} 
            disabled={selectedInvoices.length === 0 || isDownloading}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" /> Télécharger en ZIP
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Recherche et Filtrage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Numéro de Facture</label>
              <Input
                placeholder="Entrez le numéro de facture..."
                value={filterInvoiceNumber}
                onChange={(e) => setFilterInvoiceNumber(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom du Client</label>
              <Input
                placeholder="Entrez le nom du client..."
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filterDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDate ? format(filterDate, "dd/MM/yyyy") : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={setFilterDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button 
                onClick={clearFilters}
                variant="outline"
                className="w-full"
              >
                Effacer les Filtres
              </Button>
            </div>
          </div>
          
          {(filterInvoiceNumber || filterClient || filterDate) && (
            <div className="mt-4 text-sm text-muted-foreground">
              Affichage de {filteredInvoices.length} sur {invoices.length} factures
            </div>
          )}
        </CardContent>
      </Card>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-700">Aucune facture disponible</p>
              <p className="text-gray-500 mt-2">
                Générez des factures pour commencer
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Liste des Factures ({filteredInvoices.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all"
                checked={areAllSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAllInvoices();
                  } else {
                    deselectAllInvoices();
                  }
                }}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Tout Sélectionner
              </label>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>TVA</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                        />
                      </TableCell>
                      <TableCell>{invoice.number}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.client.name}</TableCell>
                      <TableCell>{invoice.total.toFixed(2)} DH</TableCell>
                      <TableCell>{invoice.taxAmount.toFixed(2)} DH</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePrintInvoice(invoice)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {viewingInvoice && (
        <PDFViewer invoice={viewingInvoice} onClose={handleCloseViewer} />
      )}
    </div>
  );
}

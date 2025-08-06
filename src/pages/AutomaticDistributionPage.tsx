
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { generateInvoices, generateInvoiceNumber, getCurrentInvoiceNumber } from "@/lib/utils";
import { Client, GasCylinder, Invoice, InvoiceItem } from "@/types";
import DistributionSettings from "@/components/DistributionSettings";

export default function AutomaticDistributionPage() {
  const { 
    clients, inventory, settings, setInvoices, setInventory, invoices,
    setInvoiceStartNumber 
  } = useAppContext();
  const { t } = useLanguage();
  const [includeRemaining, setIncludeRemaining] = useState(false);
  const [distributionMonth, setDistributionMonth] = useState(new Date().getMonth() + 1);
  const [distributionYear, setDistributionYear] = useState(new Date().getFullYear());
  const [distributionDay, setDistributionDay] = useState(new Date().getDate());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoices, setGeneratedInvoices] = useState<Invoice[]>([]);
  const [remainingInventory, setRemainingInventory] = useState<GasCylinder[]>([]);
  const [distributionDays, setDistributionDays] = useState<number[]>([]);
  const [excludedHolidays, setExcludedHolidays] = useState<number[]>([]);
  const [startingInvoiceNumber, setStartingInvoiceNumber] = useState<string>("");
  const [useCustomInvoiceNumber, setUseCustomInvoiceNumber] = useState<boolean>(false);
  const [hideDay, setHideDay] = useState<boolean>(false);

  // Helper function to format date based on hideDay setting
  const formatInvoiceDate = (date: Date): string => {
    if (hideDay) {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
    return date.toLocaleDateString('fr-FR');
  };

  const handleGenerateInvoices = () => {
    if (clients.length === 0) {
      toast.error("Veuillez d'abord ajouter des clients");
      return;
    }

    if (inventory.every(item => item.remainingQuantity === 0)) {
      toast.error("Aucun inventaire disponible");
      return;
    }

    // Set custom starting invoice number if specified
    if (useCustomInvoiceNumber && startingInvoiceNumber) {
      const startNumber = parseInt(startingInvoiceNumber);
      if (!isNaN(startNumber) && startNumber > 0) {
        setInvoiceStartNumber(startNumber);
      } else {
        toast.error("Numéro de facture de départ invalide");
        return;
      }
    }

    setIsGenerating(true);

    try {
      // Pass excluded holidays to the invoice generation function
      const { invoices: newInvoices, remainingInventory: remaining } = generateInvoices(
        inventory,
        clients,
        settings,
        excludedHolidays
      );

      if (newInvoices.length === 0) {
        toast.warning("Aucune facture n'a été générée avec les paramètres actuels");
      } else {
        setGeneratedInvoices(newInvoices);
        setRemainingInventory(remaining);
        toast.success(`${newInvoices.length} factures générées avec succès`);
      }
    } catch (error) {
      console.error("Error generating invoices:", error);
      toast.error("Erreur lors de la génération des factures");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmDistribution = () => {
    // If includeRemaining is true and there's remaining inventory value
    const remainingValue = remainingInventory.reduce((sum, item) => {
      const itemValue = item.remainingQuantity * item.unitPrice;
      const tax = itemValue * (item.taxRate / 100);
      return sum + itemValue + tax;
    }, 0);

    let allInvoices = [...generatedInvoices];

    if (includeRemaining && remainingValue > 0 && clients.length > 0) {
      // Create a final invoice with all remaining inventory
      const items: InvoiceItem[] = remainingInventory
        .filter(item => item.remainingQuantity > 0)
        .map(item => ({
          description: item.type,
          quantity: item.remainingQuantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          amount: item.remainingQuantity * item.unitPrice
        }));

      if (items.length > 0) {
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = items.reduce((sum, item) => sum + (item.amount * item.taxRate / 100), 0);
        const total = subtotal + taxAmount;

        const finalInvoice: Invoice = {
          id: crypto.randomUUID(),
          number: generateInvoiceNumber(),
          date: formatInvoiceDate(new Date()),
          client: clients[0], // Using the first client for the remaining inventory
          items,
          subtotal,
          taxAmount,
          total,
          companyName: settings.companyName
        };

        allInvoices.push(finalInvoice);
      }
    }

    // Update the inventory in the main context
    const updatedInventory = inventory.map(item => {
      const match = remainingInventory.find(ri => ri.type === item.type);
      if (match) {
        return {
          ...item,
          remainingQuantity: includeRemaining ? 0 : match.remainingQuantity,
          distributedQuantity: item.totalQuantity - (includeRemaining ? 0 : match.remainingQuantity)
        };
      }
      return item;
    });

    // Distribute invoices across available business days in chronological order
    if (distributionDays.length > 0) {
      // Sort distribution days chronologically
      const sortedDays = [...distributionDays].sort((a, b) => a - b);
      
      // Calculate even distribution across days
      const invoicesPerDay = Math.ceil(allInvoices.length / sortedDays.length);
      
      // Assign invoices to days in order (no shuffling for sequential numbering)
      const scheduledInvoices = allInvoices.map((invoice, index) => {
        // Calculate which day this invoice belongs to
        const dayIndex = Math.min(Math.floor(index / invoicesPerDay), sortedDays.length - 1);
        const day = sortedDays[dayIndex];
        
        // Create date from selected month/year and day
        const date = new Date(distributionYear, distributionMonth - 1, day);
        return {
          ...invoice,
          date: formatInvoiceDate(date)
        };
      });
      
      // Update the invoices in the global context
      setInvoices([...invoices, ...scheduledInvoices]);
    } else {
      // No distribution days available, use current date for all invoices
      const invoicesWithCurrentDate = allInvoices.map(invoice => ({
        ...invoice,
        date: formatInvoiceDate(new Date())
      }));
      setInvoices([...invoices, ...invoicesWithCurrentDate]);
      toast.warning("Aucun jour de distribution disponible. Utilisation de la date actuelle pour toutes les factures.");
    }
    
    setInventory(updatedInventory);

    // Clear the local state
    setGeneratedInvoices([]);
    setRemainingInventory([]);
    setStartingInvoiceNumber("");
    setUseCustomInvoiceNumber(false);

    toast.success(`Distribution confirmée pour ${allInvoices.length} factures`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Distribution Automatique</h1>
      </div>

      <DistributionSettings
        includeRemaining={includeRemaining}
        setIncludeRemaining={setIncludeRemaining}
        distributionMonth={distributionMonth}
        setDistributionMonth={setDistributionMonth}
        distributionYear={distributionYear}
        setDistributionYear={setDistributionYear}
        distributionDay={distributionDay}
        setDistributionDay={setDistributionDay}
        excludedHolidays={excludedHolidays}
        setExcludedHolidays={setExcludedHolidays}
        distributionDays={distributionDays}
        setDistributionDays={setDistributionDays}
        useCustomInvoiceNumber={useCustomInvoiceNumber}
        setUseCustomInvoiceNumber={setUseCustomInvoiceNumber}
        startingInvoiceNumber={startingInvoiceNumber}
        setStartingInvoiceNumber={setStartingInvoiceNumber}
        hideDay={hideDay}
        setHideDay={setHideDay}
      />

      <div className="pt-4">
        <Button
          onClick={handleGenerateInvoices}
          className="w-full bg-brand-teal hover:bg-opacity-90"
          disabled={isGenerating || clients.length === 0}
        >
          {isGenerating ? "Génération..." : "Générer des factures"}
        </Button>
      </div>

      {generatedInvoices.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Factures Générées ({generatedInvoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Total (TTC)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.number}</TableCell>
                    <TableCell>{invoice.client.name}</TableCell>
                    <TableCell>
                      {invoice.items.map((item) => (
                        <div key={`${invoice.id}-${item.description}`}>
                          {item.quantity} x {item.description}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>{invoice.total.toFixed(2)} DH</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleConfirmDistribution}
                className="bg-brand-teal hover:bg-opacity-90"
              >
                Confirmer la Distribution
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {remainingInventory.some((item) => item.remainingQuantity > 0) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Inventaire Restant</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type de Cylindre</TableHead>
                  <TableHead>Quantité Restante</TableHead>
                  <TableHead>Valeur (TTC)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remainingInventory
                  .filter((item) => item.remainingQuantity > 0)
                  .map((item) => {
                    const itemValue = item.remainingQuantity * item.unitPrice;
                    const tax = itemValue * (item.taxRate / 100);
                    const total = itemValue + tax;

                    return (
                      <TableRow key={item.type}>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{item.remainingQuantity}</TableCell>
                        <TableCell>{total.toFixed(2)} DH</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

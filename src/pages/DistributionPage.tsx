import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { generateInvoices, generateDistributionDays, generateInvoiceNumber, getCurrentInvoiceNumber } from "@/lib/utils";
import { Client, GasCylinder, Invoice, InvoiceItem } from "@/types";
import ManualInvoiceForm from "@/components/ManualInvoiceForm";

export default function DistributionPage() {
  const { 
    clients, inventory, settings, setInvoices, setInventory, invoices,
    setInvoiceStartNumber 
  } = useAppContext();
  const { t } = useLanguage();
  const [includeRemaining, setIncludeRemaining] = useState(false);
  const [distributionMonth, setDistributionMonth] = useState(new Date().getMonth() + 1);
  const [distributionYear, setDistributionYear] = useState(new Date().getFullYear());
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [manualItems, setManualItems] = useState<InvoiceItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoices, setGeneratedInvoices] = useState<Invoice[]>([]);
  const [remainingInventory, setRemainingInventory] = useState<GasCylinder[]>([]);
  const [distributionDays, setDistributionDays] = useState<number[]>([]);
  const [excludedHolidays, setExcludedHolidays] = useState<number[]>([]);
  const [newHoliday, setNewHoliday] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("automatic");
  const [startingInvoiceNumber, setStartingInvoiceNumber] = useState<string>("");
  const [useCustomInvoiceNumber, setUseCustomInvoiceNumber] = useState<boolean>(false);
  const [hideDay, setHideDay] = useState<boolean>(false);

  // Calculate distribution days when month/year or holidays change
  useEffect(() => {
    const days = generateDistributionDays(distributionYear, distributionMonth, excludedHolidays);
    setDistributionDays(days);
  }, [distributionYear, distributionMonth, excludedHolidays]);

  // Helper function to format date based on hideDay setting
  const formatInvoiceDate = (date: Date): string => {
    if (hideDay) {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
    return date.toLocaleDateString('fr-FR');
  };

  const updateDistributionDays = () => {
    const days = generateDistributionDays(distributionYear, distributionMonth, excludedHolidays);
    setDistributionDays(days);
  };

  const handleAddHoliday = () => {
    const day = parseInt(newHoliday);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      if (!excludedHolidays.includes(day)) {
        setExcludedHolidays([...excludedHolidays, day]);
        setNewHoliday("");
        toast.success("Jour férié ajouté avec succès");
      } else {
        toast.error("Ce jour est déjà ajouté comme jour férié");
      }
    } else {
      toast.error("Veuillez entrer un numéro de jour valide entre 1 et 31");
    }
  };

  const handleRemoveHoliday = (day: number) => {
    setExcludedHolidays(excludedHolidays.filter(d => d !== day));
    toast.success("Jour férié supprimé");
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

  const handleMonthChange = (value: string) => {
    setDistributionMonth(parseInt(value));
    updateDistributionDays();
  };

  const handleYearChange = (value: string) => {
    setDistributionYear(parseInt(value));
    updateDistributionDays();
  };

  const months = [
    { value: 1, label: "Janvier" },
    { value: 2, label: "Février" },
    { value: 3, label: "Mars" },
    { value: 4, label: "Avril" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juin" },
    { value: 7, label: "Juillet" },
    { value: 8, label: "Août" },
    { value: 9, label: "Septembre" },
    { value: 10, label: "Octobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Décembre" },
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() + i
  );

  // Get current invoice number for display
  const currentInvoiceNumber = getCurrentInvoiceNumber();
  const nextInvoiceNumber = currentInvoiceNumber + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Distribution</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="automatic">Distribution Automatique</TabsTrigger>
          <TabsTrigger value="manual">Facture Manuelle</TabsTrigger>
        </TabsList>
        
        <TabsContent value="automatic">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <Label htmlFor="month">Mois</Label>
                    <Select value={distributionMonth.toString()} onValueChange={handleMonthChange}>
                      <SelectTrigger id="month">
                        <SelectValue placeholder="Sélectionner un mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-1/2">
                    <Label htmlFor="year">Année</Label>
                    <Select value={distributionYear.toString()} onValueChange={handleYearChange}>
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Sélectionner une année" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Display current invoice number status */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Dernier numéro généré :</strong> FAC/{new Date().getFullYear()}/{currentInvoiceNumber}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Le prochain numéro sera : FAC/{new Date().getFullYear()}/{nextInvoiceNumber}
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Switch
                      id="use-custom-invoice-number"
                      checked={useCustomInvoiceNumber}
                      onCheckedChange={setUseCustomInvoiceNumber}
                    />
                    <Label htmlFor="use-custom-invoice-number">
                      Utiliser un numéro de départ personnalisé
                    </Label>
                  </div>
                  
                  {useCustomInvoiceNumber && (
                    <div className="mb-4">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Entrez le numéro de départ"
                        value={startingInvoiceNumber}
                        onChange={(e) => setStartingInvoiceNumber(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format : FAC/ANNÉE/NUMÉRO
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hide-day"
                    checked={hideDay}
                    onCheckedChange={setHideDay}
                  />
                  <Label htmlFor="hide-day">
                    Masquer le jour de la date (afficher uniquement le mois et l'année)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-remaining"
                    checked={includeRemaining}
                    onCheckedChange={setIncludeRemaining}
                  />
                  <Label htmlFor="include-remaining">
                    Inclure l'inventaire restant
                  </Label>
                </div>
                
                <div className="pt-4">
                  <Button
                    onClick={handleGenerateInvoices}
                    className="w-full bg-brand-teal hover:bg-opacity-90"
                    disabled={isGenerating || clients.length === 0}
                  >
                    {isGenerating ? "Génération..." : "Générer des factures"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jours de Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Entrez le jour férié"
                      value={newHoliday}
                      onChange={(e) => setNewHoliday(e.target.value)}
                      className="w-full"
                    />
                    <Button onClick={handleAddHoliday}>Ajouter</Button>
                  </div>
                </div>
                
                {excludedHolidays.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2">Jours fériés exclus</h3>
                    <div className="flex flex-wrap gap-2">
                      {excludedHolidays.sort((a, b) => a - b).map((day) => (
                        <div key={day} className="bg-red-100 text-red-800 px-2 py-1 rounded-md flex items-center">
                          <span>{day}</span>
                          <button 
                            onClick={() => handleRemoveHoliday(day)}
                            className="ml-2 text-red-800 hover:text-red-900"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Legend for calendar colors */}
                <div className="mb-4 space-y-2">
                  <h3 className="text-sm font-semibold">Légende :</h3>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-brand-teal rounded"></div>
                      <span>Jours de distribution</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                      <span>Samedi (autorisé)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                      <span>Dimanche (interdit)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
                      <span>Jours fériés</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const date = new Date(distributionYear, distributionMonth - 1, day);
                    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
                    const isSunday = dayOfWeek === 0;
                    const isSaturday = dayOfWeek === 6;
                    const isHoliday = excludedHolidays.includes(day);
                    const isDistributionDay = distributionDays.includes(day);
                    const isValid = day <= new Date(distributionYear, distributionMonth, 0).getDate();

                    if (!isValid) return null;

                    let bgColor = "bg-white border border-gray-200";
                    let textColor = "text-gray-900";

                    if (isHoliday) {
                      bgColor = "bg-red-200 border border-red-400";
                      textColor = "text-red-800";
                    } else if (isSunday) {
                      bgColor = "bg-red-100 border border-red-300";
                      textColor = "text-red-700";
                    } else if (isSaturday) {
                      bgColor = "bg-orange-100 border border-orange-300";
                      textColor = "text-orange-700";
                    } else if (isDistributionDay) {
                      bgColor = "bg-brand-teal";
                      textColor = "text-white";
                    }

                    return (
                      <div
                        key={day}
                        className={`aspect-square flex items-center justify-center rounded-md text-sm ${bgColor} ${textColor}`}
                        title={
                          isHoliday 
                            ? "Jour férié" 
                            : isSunday 
                            ? "Dimanche - Distribution interdite" 
                            : isSaturday 
                            ? "Samedi - Distribution autorisée"
                            : isDistributionDay 
                            ? "Jour de distribution" 
                            : "Jour normal"
                        }
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Nombre de jours de distribution : {distributionDays.length}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Les factures ne peuvent pas être générées le dimanche
                  </p>
                </div>
              </CardContent>
            </Card>
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
        </TabsContent>
        
        <TabsContent value="manual">
          <ManualInvoiceForm 
            hideDay={hideDay}
            useCustomInvoiceNumber={useCustomInvoiceNumber}
            startingInvoiceNumber={startingInvoiceNumber}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

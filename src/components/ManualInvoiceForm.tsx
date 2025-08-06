
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvoiceItem } from '@/types';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { generateManualInvoiceNumber, initInvoiceNumberSystem } from '@/lib/utils';

interface ManualInvoiceFormProps {
  hideDay?: boolean;
  useCustomInvoiceNumber?: boolean;
  startingInvoiceNumber?: string;
}

export default function ManualInvoiceForm({ 
  hideDay = false, 
  useCustomInvoiceNumber = false, 
  startingInvoiceNumber = "" 
}: ManualInvoiceFormProps) {
  const { t } = useLanguage();
  const { clients, inventory, setInvoices, invoices, setInventory, setInvoiceStartNumber } = useAppContext();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState<{
    cylinderType: string,
    quantity: number,
    unitPrice: number,
    taxRate: number
  }>({
    cylinderType: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 0
  });

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleSelectCylinderType = (type: string) => {
    const cylinderData = inventory.find(item => item.type === type);
    if (cylinderData) {
      setNewItem({
        cylinderType: type,
        quantity: 1,
        unitPrice: cylinderData.unitPrice,
        taxRate: cylinderData.taxRate
      });
    }
  };

  const handleAddItem = () => {
    if (!newItem.cylinderType || newItem.quantity <= 0) {
      toast.error(t("invoices", "invalidItemError"));
      return;
    }

    const cylinderData = inventory.find(item => item.type === newItem.cylinderType);
    if (!cylinderData || cylinderData.remainingQuantity < newItem.quantity) {
      toast.error(t("invoices", "insufficientInventory"));
      return;
    }

    const amount = newItem.quantity * newItem.unitPrice;

    setItems([...items, {
      description: newItem.cylinderType,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      taxRate: newItem.taxRate,
      amount
    }]);

    // Reset form for new item
    setNewItem({
      cylinderType: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Helper function to format date based on hideDay setting
  const formatInvoiceDate = (date: Date): string => {
    if (hideDay) {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
    return date.toLocaleDateString('fr-FR');
  };

  const handleCreateInvoice = () => {
    if (!selectedClientId) {
      toast.error(t("invoices", "selectClient"));
      return;
    }

    if (items.length === 0) {
      toast.error(t("invoices", "addItems"));
      return;
    }

    const selectedClient = clients.find(client => client.id === selectedClientId);
    if (!selectedClient) {
      toast.error(t("invoices", "clientNotFound"));
      return;
    }

    // Initialize custom invoice numbering if specified
    if (useCustomInvoiceNumber && startingInvoiceNumber) {
      const startNumber = parseInt(startingInvoiceNumber);
      if (!isNaN(startNumber) && startNumber > 0) {
        // Initialize the numbering system with the custom starting number
        initInvoiceNumberSystem(startNumber);
        setInvoiceStartNumber(startNumber);
      } else {
        toast.error(t("invoices", "invalidStartingNumber"));
        return;
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.amount * item.taxRate / 100), 0);
    const total = subtotal + taxAmount;

    // Create manual invoice using unified numbering system
    const manualInvoice = {
      id: crypto.randomUUID(),
      number: generateManualInvoiceNumber(), // Uses unified sequential numbering
      date: formatInvoiceDate(new Date()),
      client: selectedClient,
      items: [...items],
      subtotal,
      taxAmount,
      total,
      companyName: 'STE ZAGAZ' as const
    };

    // Add invoice to the list
    setInvoices([...invoices, manualInvoice]);

    // Update inventory
    const updatedInventory = inventory.map(inventoryItem => {
      const usedItem = items.find(item => item.description === inventoryItem.type);
      if (usedItem) {
        return {
          ...inventoryItem,
          remainingQuantity: inventoryItem.remainingQuantity - usedItem.quantity,
          distributedQuantity: inventoryItem.distributedQuantity + usedItem.quantity
        };
      }
      return inventoryItem;
    });

    setInventory(updatedInventory);

    toast.success(t("invoices", "invoiceCreated"));
    
    // Reset form
    setSelectedClientId('');
    setItems([]);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.amount * item.taxRate / 100), 0);
  const total = subtotal + taxAmount;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("invoices", "createManualInvoice")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client">{t("invoices", "client")}</Label>
            <Select value={selectedClientId} onValueChange={handleSelectClient}>
              <SelectTrigger id="client">
                <SelectValue placeholder={t("invoices", "selectClient")} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} ({client.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label htmlFor="cylinder-type">{t("invoices", "cylinderType")}</Label>
              <Select value={newItem.cylinderType} onValueChange={handleSelectCylinderType}>
                <SelectTrigger id="cylinder-type">
                  <SelectValue placeholder={t("invoices", "selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {inventory
                    .filter(item => item.remainingQuantity > 0)
                    .map((cylinder) => (
                      <SelectItem key={cylinder.type} value={cylinder.type}>
                        {cylinder.type} ({cylinder.remainingQuantity} {t("invoices", "available")})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">{t("invoices", "quantity")}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="unit-price">{t("invoices", "unitPrice")}</Label>
              <Input
                id="unit-price"
                type="number"
                min="0"
                value={newItem.unitPrice}
                onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                readOnly
              />
            </div>

            <div>
              <Label htmlFor="tax-rate">{t("invoices", "taxRate")} (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                value={newItem.taxRate}
                onChange={(e) => setNewItem({ ...newItem, taxRate: parseFloat(e.target.value) || 0 })}
                readOnly
              />
            </div>

            <Button onClick={handleAddItem} className="bg-brand-teal hover:bg-opacity-90">
              {t("invoices", "addItem")}
            </Button>
          </div>

          {items.length > 0 && (
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("invoices", "description")}</TableHead>
                    <TableHead>{t("invoices", "quantity")}</TableHead>
                    <TableHead>{t("invoices", "unitPrice")}</TableHead>
                    <TableHead>{t("invoices", "taxRate")} (%)</TableHead>
                    <TableHead>{t("invoices", "amount")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unitPrice.toFixed(2)} DH</TableCell>
                      <TableCell>{item.taxRate}%</TableCell>
                      <TableCell>{item.amount.toFixed(2)} DH</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span>{t("invoices", "subtotal")}:</span>
                  <span>{subtotal.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("invoices", "tax")}:</span>
                  <span>{taxAmount.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>{t("invoices", "total")}:</span>
                  <span>{total.toFixed(2)} DH</span>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  onClick={handleCreateInvoice} 
                  className="w-full bg-brand-teal hover:bg-opacity-90"
                  disabled={!selectedClientId || items.length === 0}
                >
                  {t("invoices", "createInvoice")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

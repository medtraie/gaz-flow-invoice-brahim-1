
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function InventoryPage() {
  const { inventory, setInventory } = useAppContext();
  
  const [editedInventory, setEditedInventory] = useState(() => 
    inventory.map(item => ({ ...item }))
  );

  const handleChange = (
    index: number,
    field: 'totalQuantity' | 'unitPrice' | 'taxRate',
    value: string
  ) => {
    const newInventory = [...editedInventory];
    
    // Handle empty string as 0, but allow empty display
    const numValue = value === '' ? 0 : Number(value);
    
    if (value !== '' && (isNaN(numValue) || numValue < 0)) return;
    
    newInventory[index] = {
      ...newInventory[index],
      [field]: numValue,
    };
    
    if (field === 'totalQuantity') {
      newInventory[index].remainingQuantity = numValue - newInventory[index].distributedQuantity;
    }
    
    setEditedInventory(newInventory);
  };

  // Helper function to display value (empty string if 0, otherwise the value)
  const displayValue = (value: number): string => {
    return value === 0 ? '' : value.toString();
  };

  const saveChanges = () => {
    setInventory(editedInventory);
    toast.success("Inventaire mis à jour avec succès");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion de l'Inventaire</h1>
        <Button onClick={saveChanges} className="bg-brand-teal hover:bg-opacity-90">
          Enregistrer les Modifications
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventaire des Bouteilles de Gaz</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type de Bouteille</TableHead>
                <TableHead>Quantité Totale</TableHead>
                <TableHead>Distribuée</TableHead>
                <TableHead>Restante</TableHead>
                <TableHead>Prix Unitaire (DH)</TableHead>
                <TableHead>Taux de Taxe (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editedInventory.map((item, index) => (
                <TableRow key={item.type}>
                  <TableCell className="font-medium">{item.type}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={displayValue(item.totalQuantity)}
                      onChange={(e) => handleChange(index, 'totalQuantity', e.target.value)}
                      className="w-24"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>{item.distributedQuantity}</TableCell>
                  <TableCell>{item.remainingQuantity}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={displayValue(item.unitPrice)}
                      onChange={(e) => handleChange(index, 'unitPrice', e.target.value)}
                      className="w-24"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={displayValue(item.taxRate)}
                      onChange={(e) => handleChange(index, 'taxRate', e.target.value)}
                      className="w-24"
                      placeholder="0"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Résumé de l'Inventaire</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type de Bouteille</TableHead>
                <TableHead>Valeur Totale (HT)</TableHead>
                <TableHead>Montant de la Taxe</TableHead>
                <TableHead>Valeur Totale (TTC)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editedInventory.map((item) => {
                const valueHT = item.totalQuantity * item.unitPrice;
                const taxAmount = valueHT * (item.taxRate / 100);
                const valueTTC = valueHT + taxAmount;
                
                return (
                  <TableRow key={`summary-${item.type}`}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{valueHT.toFixed(2)} DH</TableCell>
                    <TableCell>{taxAmount.toFixed(2)} DH</TableCell>
                    <TableCell>{valueTTC.toFixed(2)} DH</TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="font-bold">
                  {editedInventory
                    .reduce((sum, item) => sum + item.totalQuantity * item.unitPrice, 0)
                    .toFixed(2)} DH
                </TableCell>
                <TableCell className="font-bold">
                  {editedInventory
                    .reduce((sum, item) => sum + (item.totalQuantity * item.unitPrice * item.taxRate / 100), 0)
                    .toFixed(2)} DH
                </TableCell>
                <TableCell className="font-bold">
                  {editedInventory
                    .reduce((sum, item) => sum + (item.totalQuantity * item.unitPrice * (1 + item.taxRate / 100)), 0)
                    .toFixed(2)} DH
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

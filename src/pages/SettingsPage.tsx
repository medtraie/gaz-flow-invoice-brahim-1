
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings, setClients, setInventory, setInvoices } = useAppContext();
  const { setLanguage } = useLanguage();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    secretCode: settings.secretCode,
    companyName: 'SEBAI AMA' as const,
    minInvoiceAmount: settings.minInvoiceAmount,
    maxInvoiceAmount: settings.maxInvoiceAmount,
  });

  const [deleteCode, setDeleteCode] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes("Amount") ? Number(value) : value
    }));
  };

  const handleLanguageChange = (value: "en" | "ar" | "fr") => {
    setLanguage(value);
  };

  const handleSave = () => {
    updateSettings(formData);
    toast({
      title: "Succès",
      description: "Paramètres enregistrés avec succès",
    });
  };

  const handleDeleteAllData = () => {
    if (deleteCode !== "123456789") {
      toast({
        title: "Erreur",
        description: "Le code saisi est incorrect",
        variant: "destructive"
      });
      return;
    }

    setClients([]);
    setInventory([
      { type: '12KG', totalQuantity: 0, distributedQuantity: 0, remainingQuantity: 0, unitPrice: 0, taxRate: 0 },
      { type: '6KG', totalQuantity: 0, distributedQuantity: 0, remainingQuantity: 0, unitPrice: 0, taxRate: 0 },
      { type: '3KG', totalQuantity: 0, distributedQuantity: 0, remainingQuantity: 0, unitPrice: 0, taxRate: 0 }
    ]);
    setInvoices([]);
    
    setDeleteCode("");
    
    toast({
      title: "Succès",
      description: "Toutes les données ont été supprimées",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Configuration de l'Application</CardTitle>
          <CardDescription>
            Gérez les paramètres de votre application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="secretCode">Code Secret</Label>
                <Input
                  id="secretCode"
                  name="secretCode"
                  type="password"
                  value={formData.secretCode}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l'Entreprise</Label>
                <Input
                  id="companyName"
                  type="text"
                  value="SEBAI AMA"
                  readOnly
                  className="bg-gray-100 border border-gray-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minInvoiceAmount">Montant Minimum de Facture</Label>
                <Input
                  id="minInvoiceAmount"
                  name="minInvoiceAmount"
                  type="number"
                  value={formData.minInvoiceAmount}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxInvoiceAmount">Montant Maximum de Facture</Label>
                <Input
                  id="maxInvoiceAmount"
                  name="maxInvoiceAmount"
                  type="number"
                  value={formData.maxInvoiceAmount}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Langue / Language / اللغة</Label>
                <Select
                  value="fr"
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                    <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSave} className="bg-brand-teal hover:bg-opacity-90">
              Enregistrer les Paramètres
            </Button>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Zone Dangereuse</h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer Toutes les Données
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la Suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera définitivement toutes les données de l'application. Cette action ne peut pas être annulée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deleteCode">Entrez le code de confirmation :</Label>
                    <Input
                      id="deleteCode"
                      type="password"
                      value={deleteCode}
                      onChange={(e) => setDeleteCode(e.target.value)}
                      placeholder="Entrez le code"
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteCode("")}>
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllData}
                  >
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

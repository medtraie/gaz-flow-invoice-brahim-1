
import { useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";

export default function ClientsPage() {
  const { clients, setClients } = useAppContext();
  const [newClient, setNewClient] = useState({ 
    name: "", 
    code: "", 
    ice: "", 
    address: "" 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddClient = () => {
    if (!newClient.name || !newClient.code) {
      toast.error("Le nom du client et le code sont obligatoires");
      return;
    }

    const clientData = {
      id: crypto.randomUUID(),
      name: newClient.name,
      code: newClient.code,
      ...(newClient.ice && { ice: newClient.ice }),
      ...(newClient.address && { address: newClient.address })
    };

    setClients([...clients, clientData]);
    setNewClient({ name: "", code: "", ice: "", address: "" });
    toast.success("Client ajouté avec succès");
  };

  const handleDeleteClient = (id: string) => {
    setClients(clients.filter((client) => client.id !== id));
    toast.success("Client supprimé");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const firstRow = jsonData[0] as any;
          if (!("Nom" in firstRow) || !("Patente" in firstRow)) {
            toast.error("Le fichier Excel doit contenir les colonnes 'Nom' et 'Patente'");
            return;
          }

          const importedClients = jsonData.map((row: any) => ({
            id: crypto.randomUUID(),
            name: row.Nom,
            code: String(row.Patente),
            ...(row.ICE && { ice: String(row.ICE) }),
            ...(row.Adresse && { address: String(row.Adresse) })
          }));

          setClients([...clients, ...importedClients]);
          toast.success(`${importedClients.length} clients importés avec succès`);
        } else {
          toast.error("Aucune donnée trouvée dans le fichier Excel");
        }
      } catch (error) {
        console.error("Erreur lors de la lecture du fichier Excel:", error);
        toast.error("Échec de la lecture du fichier Excel");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des Clients</h1>
        <div className="flex space-x-2">
          <Button onClick={handleImportClick} className="bg-brand-teal hover:bg-opacity-90">
            <Upload className="mr-2 h-4 w-4" /> Importer depuis Excel
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            style={{ display: "none" }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un Nouveau Client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="Nom du Client *"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            />
            <Input
              placeholder="Code Client/Patente *"
              value={newClient.code}
              onChange={(e) => setNewClient({ ...newClient, code: e.target.value })}
            />
            <Input
              placeholder="ICE du Client (Optionnel)"
              value={newClient.ice}
              onChange={(e) => setNewClient({ ...newClient, ice: e.target.value })}
            />
            <Input
              placeholder="Adresse du Client (Optionnel)"
              value={newClient.address}
              onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
            />
          </div>
          <Button onClick={handleAddClient} className="bg-brand-teal hover:bg-opacity-90 w-full md:w-auto">
            Ajouter le Client
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              Aucun client trouvé. Ajoutez des clients ou importez depuis Excel.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du Client</TableHead>
                    <TableHead>Code Client</TableHead>
                    <TableHead>ICE</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.code}</TableCell>
                      <TableCell>{client.ice || "-"}</TableCell>
                      <TableCell>{client.address || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

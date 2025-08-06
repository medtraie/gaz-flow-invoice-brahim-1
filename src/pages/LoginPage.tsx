
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const { login } = useAppContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(code)) {
      toast.success("Connexion réussie");
    } else {
      toast.error("Code secret invalide");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <h1 className="text-2xl font-bold text-center text-gray-800">
              Système de Distribution de Gaz
            </h1>
            <p className="text-gray-600 mt-2 text-center">
              Entrez votre code secret pour continuer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium text-gray-700">
                Code Secret
              </label>
              <Input
                id="code"
                type="password"
                placeholder="Entrez votre code secret"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                required
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full bg-brand-teal hover:bg-opacity-90">
              Se Connecter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

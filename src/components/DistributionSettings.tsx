import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateDistributionDays, getCurrentInvoiceNumber } from "@/lib/utils";

interface DistributionSettingsProps {
  includeRemaining: boolean;
  setIncludeRemaining: (value: boolean) => void;
  distributionMonth: number;
  setDistributionMonth: (value: number) => void;
  distributionYear: number;
  setDistributionYear: (value: number) => void;
  distributionDay: number;
  setDistributionDay: (value: number) => void;
  excludedHolidays: number[];
  setExcludedHolidays: (value: number[]) => void;
  distributionDays: number[];
  setDistributionDays: (value: number[]) => void;
  useCustomInvoiceNumber: boolean;
  setUseCustomInvoiceNumber: (value: boolean) => void;
  startingInvoiceNumber: string;
  setStartingInvoiceNumber: (value: string) => void;
  hideDay: boolean;
  setHideDay: (value: boolean) => void;
  limitInvoiceCount?: boolean;
  setLimitInvoiceCount?: (value: boolean) => void;
  maxInvoiceCount?: string;
  setMaxInvoiceCount?: (value: string) => void;
}

export default function DistributionSettings({
  includeRemaining,
  setIncludeRemaining,
  distributionMonth,
  setDistributionMonth,
  distributionYear,
  setDistributionYear,
  distributionDay,
  setDistributionDay,
  excludedHolidays,
  setExcludedHolidays,
  distributionDays,
  setDistributionDays,
  useCustomInvoiceNumber,
  setUseCustomInvoiceNumber,
  startingInvoiceNumber,
  setStartingInvoiceNumber,
  hideDay,
  setHideDay,
  limitInvoiceCount,
  setLimitInvoiceCount,
  maxInvoiceCount,
  setMaxInvoiceCount
}: DistributionSettingsProps) {
  const [newHoliday, setNewHoliday] = useState<string>("");

  // Calculate distribution days when month/year or holidays change
  useEffect(() => {
    const days = generateDistributionDays(distributionYear, distributionMonth, excludedHolidays);
    setDistributionDays(days);
  }, [distributionYear, distributionMonth, excludedHolidays, setDistributionDays]);

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

  const handleDayChange = (value: string) => {
    setDistributionDay(parseInt(value));
  };

  const handleMonthChange = (value: string) => {
    setDistributionMonth(parseInt(value));
  };

  const handleYearChange = (value: string) => {
    setDistributionYear(parseInt(value));
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
    { length: 6 },
    (_, i) => 2025 + i
  );

  // Generate days for the selected month and year
  const daysInMonth = new Date(distributionYear, distributionMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Get current invoice number for display
  const currentInvoiceNumber = getCurrentInvoiceNumber();
  const nextInvoiceNumber = currentInvoiceNumber + 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/3">
              <Label htmlFor="day">Jour</Label>
              <Select value={distributionDay.toString()} onValueChange={handleDayChange}>
                <SelectTrigger id="day">
                  <SelectValue placeholder="Sélectionner un jour" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-1/3">
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
            
            <div className="w-1/3">
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

          {setLimitInvoiceCount && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Switch
                  id="limit-invoice-count"
                  checked={!!limitInvoiceCount}
                  onCheckedChange={setLimitInvoiceCount}
                />
                <Label htmlFor="limit-invoice-count">
                  Limiter le nombre de factures générées
                </Label>
              </div>
              {limitInvoiceCount && (
                <div className="mb-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Nombre de factures à générer"
                    value={maxInvoiceCount ?? ""}
                    onChange={(e) => setMaxInvoiceCount && setMaxInvoiceCount(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Le reste de l'inventaire restera dans l'inventaire restant
                  </p>
                </div>
              )}
            </div>
          )}

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
              const dayOfWeek = date.getDay();
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
  );
}

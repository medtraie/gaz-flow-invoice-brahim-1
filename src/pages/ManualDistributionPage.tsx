
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DistributionSettings from "@/components/DistributionSettings";
import ManualInvoiceForm from "@/components/ManualInvoiceForm";

export default function ManualDistributionPage() {
  const [includeRemaining, setIncludeRemaining] = useState(false);
  const [distributionMonth, setDistributionMonth] = useState(new Date().getMonth() + 1);
  const [distributionYear, setDistributionYear] = useState(new Date().getFullYear());
  const [distributionDays, setDistributionDays] = useState<number[]>([]);
  const [excludedHolidays, setExcludedHolidays] = useState<number[]>([]);
  const [startingInvoiceNumber, setStartingInvoiceNumber] = useState<string>("");
  const [useCustomInvoiceNumber, setUseCustomInvoiceNumber] = useState<boolean>(false);
  const [hideDay, setHideDay] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Distribution Manuelle</h1>
      </div>

      <DistributionSettings
        includeRemaining={includeRemaining}
        setIncludeRemaining={setIncludeRemaining}
        distributionMonth={distributionMonth}
        setDistributionMonth={setDistributionMonth}
        distributionYear={distributionYear}
        setDistributionYear={setDistributionYear}
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

      <Card>
        <CardHeader>
          <CardTitle>Création de Facture Manuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <ManualInvoiceForm 
            hideDay={hideDay}
            useCustomInvoiceNumber={useCustomInvoiceNumber}
            startingInvoiceNumber={startingInvoiceNumber}
          />
        </CardContent>
      </Card>
    </div>
  );
}

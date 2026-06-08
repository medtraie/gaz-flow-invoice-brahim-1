
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Client, GasCylinder, Invoice, InvoiceItem, Settings } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Global variable to track the last invoice number
let lastInvoiceNumber = 0;

// Initialize the invoice number system
export function initInvoiceNumberSystem(startingNumber?: number) {
  if (startingNumber && startingNumber > 0) {
    // Set exactly the starting number, don't increment yet
    lastInvoiceNumber = startingNumber - 1; // Subtract 1 so next generation gives exact starting number
  } else if (lastInvoiceNumber === 0) {
    // If no starting number is provided and lastInvoiceNumber is not set yet,
    // try to get the last invoice number from localStorage
    const storedInvoices = localStorage.getItem('invoices');
    if (storedInvoices) {
      const invoices = JSON.parse(storedInvoices) as Invoice[];
      if (invoices.length > 0) {
        // Extract the highest number from existing invoices - handle both old and new formats
        const numbers = invoices.map(inv => {
          const parts = inv.number.split('/');
          if (parts.length === 3) {
            return parseInt(parts[2], 10);
          }
          return 0;
        });
        lastInvoiceNumber = Math.max(...numbers, 0);
      } else {
        lastInvoiceNumber = 0;
      }
    } else {
      lastInvoiceNumber = 0;
    }
  }
}

// Generate sequential invoice number with new format
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2); // Get last 2 digits of year
  
  // Initialize the system if not already done
  if (lastInvoiceNumber === 0) {
    initInvoiceNumberSystem();
  }
  
  // Increment the last invoice number
  lastInvoiceNumber++;
  
  // Format the number with leading zeros (5 digits)
  const formattedNumber = lastInvoiceNumber.toString().padStart(5, '0');
  
  return `FC/${year}/${formattedNumber}`;
}

// Generate manual invoice number with unified numbering system and new format
export function generateManualInvoiceNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2); // Get last 2 digits of year
  
  // Initialize the system if not already done
  if (lastInvoiceNumber === 0) {
    initInvoiceNumberSystem();
  }
  
  // Increment the last invoice number (same sequence as automatic invoices)
  lastInvoiceNumber++;
  
  // Format the number with leading zeros (5 digits)
  const formattedNumber = lastInvoiceNumber.toString().padStart(5, '0');
  
  return `FP/${year}/${formattedNumber}`;
}

// Get the current invoice number without incrementing
export function getCurrentInvoiceNumber(): number {
  if (lastInvoiceNumber === 0) {
    initInvoiceNumberSystem();
  }
  return lastInvoiceNumber;
}

// Set the current invoice number (for manual adjustment)
export function setCurrentInvoiceNumber(number: number): void {
  if (number > 0) {
    lastInvoiceNumber = number;
  }
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR');
}

export function calculateAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100);
}

export function calculateTotal(items: InvoiceItem[]): { subtotal: number, taxAmount: number, total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = items.reduce((sum, item) => sum + calculateTax(item.amount, item.taxRate), 0);
  const total = subtotal + taxAmount;
  
  return { subtotal, taxAmount, total };
}

// Function to convert number to words (in French)
export function numberToWords(num: number): string {
  // This is a simplified version - for production, consider using a library
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  if (num === 0) return 'zéro';
  
  function convert(n: number): string {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const unit = n % 10;
      const ten = Math.floor(n / 10);
      return unit ? `${tens[ten]}-${units[unit]}` : tens[ten];
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      return remainder
        ? `${hundred > 1 ? `${units[hundred]} cents` : 'cent'} ${convert(remainder)}`
        : `${hundred > 1 ? `${units[hundred]} cents` : 'cent'}`;
    }
    if (n < 1000000) {
      const thousand = Math.floor(n / 1000);
      const remainder = n % 1000;
      return remainder
        ? `${thousand > 1 ? `${convert(thousand)} mille` : 'mille'} ${convert(remainder)}`
        : `${thousand > 1 ? `${convert(thousand)} mille` : 'mille'}`;
    }
    return 'nombre trop grand';
  }
  
  const result = convert(Math.floor(num));
  const decimal = Math.round((num - Math.floor(num)) * 100);
  
  return decimal ? `${result} et ${convert(decimal)} centimes` : result;
}

/**
 * Generate invoices with varied amounts within min/max range
 * - Only allow 2-5 invoices with the exact same total amount
 * - Rest should have varied amounts within the range
 * - Sequential numbering based on chronological order
 */
export const generateInvoices = (
  inventory: GasCylinder[],
  clients: Client[],
  settings: Settings,
  excludedHolidays: number[] = [],
  maxInvoiceCount?: number,
  reservedQuantities?: Record<string, number>
): { invoices: Invoice[], remainingInventory: GasCylinder[] } => {
  // Clone inventory to avoid modifying original
  const workingInventory = JSON.parse(JSON.stringify(inventory)) as GasCylinder[];

  // Reserve quantities by removing them from available remaining quantity
  const reserved: Record<string, number> = {};
  if (reservedQuantities) {
    workingInventory.forEach(c => {
      const r = Math.max(0, Math.min(reservedQuantities[c.type] || 0, c.remainingQuantity));
      reserved[c.type] = r;
      c.remainingQuantity -= r;
    });
  }

  // When limiting invoice count, bypass the minimum invoice amount constraint
  const effectiveMinAmount = (maxInvoiceCount && maxInvoiceCount > 0) ? 0 : settings.minInvoiceAmount;

  const invoices: Invoice[] = [];

  
  // Track unique totals and their count to limit identical invoices
  const totalCounts: Record<number, number> = {};
  const MAX_IDENTICAL_INVOICES = Math.floor(2 + Math.random() * 4); // Random between 2-5
  
  // Shuffle the clients array to ensure random distribution
  const shuffledClients = [...clients].sort(() => Math.random() - 0.5);
  let clientIndex = 0;
  
  // Calculate total inventory value
  const getTotalValue = (inv: GasCylinder[]): number => {
    return inv.reduce((sum, item) => {
      const itemTotal = item.remainingQuantity * item.unitPrice;
      const tax = itemTotal * (item.taxRate / 100);
      return sum + itemTotal + tax;
    }, 0);
  };
  
  // While inventory has value above minimum invoice amount
  while (getTotalValue(workingInventory) >= settings.minInvoiceAmount && clients.length > 0) {
    if (maxInvoiceCount && maxInvoiceCount > 0 && invoices.length >= maxInvoiceCount) {
      break;
    }
    // Get next client in rotation
    const client = shuffledClients[clientIndex % shuffledClients.length];
    clientIndex++;
    
    // Create a new invoice
    const invoiceItems: InvoiceItem[] = [];
    
    // Randomize target amount for this invoice within min-max range
    // This creates more natural variation in invoice amounts
    let targetAmount: number;
    
    do {
      targetAmount = Math.floor(
        settings.minInvoiceAmount + 
        (Math.random() * (settings.maxInvoiceAmount - settings.minInvoiceAmount))
      );
      // Round to nearest 100 for more natural looking amounts
      targetAmount = Math.round(targetAmount / 100) * 100;
    } while (
      totalCounts[targetAmount] >= MAX_IDENTICAL_INVOICES && 
      Object.keys(totalCounts).length < 10
    );
    
    let invoiceTotal = 0;
    
    // Add items to invoice up to target amount
    for (const cylinder of workingInventory) {
      if (cylinder.remainingQuantity <= 0) continue;
      
      // Calculate how many cylinders can be added while staying under target
      let quantity = 0;
      let amount = 0;
      
      while (
        cylinder.remainingQuantity > quantity && 
        invoiceTotal + amount + cylinder.unitPrice + (cylinder.unitPrice * cylinder.taxRate / 100) <= targetAmount
      ) {
        quantity++;
        amount = quantity * cylinder.unitPrice;
        const tax = amount * (cylinder.taxRate / 100);
        invoiceTotal = invoiceItems.reduce((sum, item) => sum + item.amount + (item.amount * item.taxRate / 100), 0) + amount + tax;
      }
      
      if (quantity > 0) {
        invoiceItems.push({
          description: cylinder.type,
          quantity,
          unitPrice: cylinder.unitPrice,
          taxRate: cylinder.taxRate,
          amount
        });
        
        // Update inventory
        cylinder.remainingQuantity -= quantity;
        cylinder.distributedQuantity += quantity;
      }
    }
    
    if (invoiceItems.length > 0) {
      const { subtotal, taxAmount, total } = calculateTotal(invoiceItems);
      
      // Only create invoice if it meets minimum amount
      if (total >= settings.minInvoiceAmount) {
        // Track invoice totals for limiting identical amounts
        totalCounts[Math.round(total)] = (totalCounts[Math.round(total)] || 0) + 1;
        
        // Create invoice with sequential number
        invoices.push({
          id: crypto.randomUUID(),
          number: generateInvoiceNumber(), // This will ensure sequential numbering with new format
          date: formatDate(new Date()),
          client,
          items: invoiceItems,
          subtotal,
          taxAmount,
          total,
          companyName: settings.companyName
        });
      } else {
        // Return items to inventory if invoice doesn't meet minimum
        invoiceItems.forEach(item => {
          const cylinder = workingInventory.find(c => c.type === item.description);
          if (cylinder) {
            cylinder.remainingQuantity += item.quantity;
            cylinder.distributedQuantity -= item.quantity;
          }
        });
      }
    }
    
    // Check if we can create any more invoices with the remaining inventory
    if (getTotalValue(workingInventory) < settings.minInvoiceAmount) {
      break;
    }
  }
  
  return { invoices, remainingInventory: workingInventory };
}

// Generate distribution days, excluding weekends and specified holidays
export function generateDistributionDays(year: number, month: number, holidays: number[] = []): number[] {
  const days = [];
  const lastDay = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    
    // Skip weekends (0=Sunday, 6=Saturday) and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(day)) {
      days.push(day);
    }
  }
  
  return days;
}

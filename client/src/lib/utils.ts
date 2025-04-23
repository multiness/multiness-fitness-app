import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatiert einen Preis sicher als EUR-Währung mit 2 Nachkommastellen
 * @param price Der zu formatierende Preis (kann ein String, eine Zahl oder undefined sein)
 * @param defaultValue Rückgabewert, falls der Preis nicht gültig ist
 * @returns Der formatierte Preis mit 2 Nachkommastellen oder defaultValue
 */
export function formatPrice(price: string | number | null | undefined, defaultValue: string = '0.00'): string {
  // Bei undefined oder null den Standardwert zurückgeben
  if (price === undefined || price === null) {
    return defaultValue;
  }
  
  // Versuche, den Preis in eine Zahl zu konvertieren
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Überprüfe, ob der Preis eine gültige Zahl ist
  if (isNaN(numericPrice)) {
    return defaultValue;
  }
  
  // Formatiere den Preis mit 2 Nachkommastellen
  return numericPrice.toFixed(2);
}

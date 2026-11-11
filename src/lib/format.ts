import { siteConfig } from "@/config/site";

const currencyFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 0,
});

/** Formats an amount as hotel currency, e.g. `৳5,500` / `BDT 5,500`. */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

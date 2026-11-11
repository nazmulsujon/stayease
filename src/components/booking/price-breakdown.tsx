import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";

/** "BDT 5,500 × 3 nights = BDT 16,500" (FR-BOOK-02). */
export function PriceBreakdown({
  pricePerNight,
  nights,
  totalPrice,
}: {
  pricePerNight: number;
  nights: number;
  totalPrice: number;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">
          {formatCurrency(pricePerNight)} × {nights} {nights === 1 ? "night" : "nights"}
        </dt>
        <dd className="tabular-nums">{formatCurrency(pricePerNight * nights)}</dd>
      </div>
      <Separator />
      <div className="flex justify-between gap-4 text-base font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatCurrency(totalPrice)}</dd>
      </div>
      <p className="text-xs text-muted-foreground">Pay at the hotel on arrival. No online payment needed.</p>
    </dl>
  );
}

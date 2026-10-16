import { formatMoney } from "./money";

export const SPLITS = ["even", "first", "second", "custom"] as const;

export type Split = (typeof SPLITS)[number];

export const SPLIT_LABELS: Record<Split, string> = {
  even: "Mitad y mitad",
  first: "Todo en el pago del 15",
  second: "Todo en el pago del 30",
  custom: "Personalizado",
};

/** A monthly amount and how it is distributed between the two halves of the month. */
export type Allocation = {
  monthlyAmountCents: number;
  split: Split;
  customFirstHalfCents: number | null;
};

export type Halves = {
  first: number;
  second: number;
};

export function splitAmount({
  monthlyAmountCents: total,
  split,
  customFirstHalfCents,
}: Allocation): Halves {
  switch (split) {
    case "even": {
      const first = Math.ceil(total / 2);
      return { first, second: total - first };
    }
    case "first":
      return { first: total, second: 0 };
    case "second":
      return { first: 0, second: total };
    case "custom": {
      const first = Math.min(customFirstHalfCents ?? 0, total);
      return { first, second: total - first };
    }
  }
}

export const ZERO_HALVES: Halves = { first: 0, second: 0 };

export function addHalves(a: Halves, b: Halves): Halves {
  return { first: a.first + b.first, second: a.second + b.second };
}

export function subtractHalves(a: Halves, b: Halves): Halves {
  return { first: a.first - b.first, second: a.second - b.second };
}

export function totalOf(halves: Halves): number {
  return halves.first + halves.second;
}

export function describeHalves(allocation: Allocation): string {
  const { first, second } = splitAmount(allocation);
  return `15 ${formatMoney(first)} · 30 ${formatMoney(second)}`;
}

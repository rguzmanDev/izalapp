export const ACCOUNT_TYPES = ["checking", "savings", "credit"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Corriente",
  savings: "Ahorro",
  credit: "Tarjeta de crédito",
};

export const ACCOUNT_TYPES = ["checking", "savings", "credit"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Cuenta Corriente",
  savings: "Cuenta de Ahorro",
  credit: "Tarjeta de crédito",
};

/** Prefix of the account name wherever it is shown, so the user only types a nickname. */
export const ACCOUNT_NAME_PREFIXES: Record<AccountType, string> = {
  checking: "Cuenta corriente",
  savings: "Cuenta de ahorro",
  credit: "Tarjeta de crédito",
};

export const PAYMENT_DUE_MODES = ["dayOfMonth", "daysAfterCutoff"] as const;

export type PaymentDueMode = (typeof PAYMENT_DUE_MODES)[number];

export const PAYMENT_DUE_MODE_LABELS: Record<PaymentDueMode, string> = {
  dayOfMonth: "Un día fijo del mes",
  daysAfterCutoff: "Días después del corte",
};

export const MAX_DAYS_AFTER_CUTOFF = 45;

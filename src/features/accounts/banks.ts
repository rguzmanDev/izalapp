/**
 * Banks supervised by the Superintendencia del Sistema Financiero (SSF) of El Salvador.
 * The name shown is the one stored in `financial_account.bank`; anything else goes through "Otro".
 */
export const BANK_GROUPS = [
  {
    label: "Bancos",
    banks: [
      "Banco Agrícola",
      "Banco Cuscatlán",
      "Davivienda",
      "BAC",
      "Banco Promerica",
      "Banco Atlántida",
      "Banco Industrial",
      "Banco Azul",
      "ABANK",
      "Banco Apoyo Integral",
      "Citibank",
    ],
  },
  {
    label: "Bancos estatales",
    banks: ["Banco Hipotecario", "BFA"],
  },
  {
    label: "Bancos cooperativos y otros",
    banks: [
      "Fedecrédito",
      "Mi Banco",
      "BTS",
      "Bancovi",
      "Primer Banco de los Trabajadores",
      "Banco Izalqueño de los Trabajadores",
      "COMEDICA",
    ],
  },
] as const;

const BANK_NAMES: readonly string[] = BANK_GROUPS.flatMap((group) => group.banks);

export function isListedBank(bank: string): boolean {
  return BANK_NAMES.includes(bank);
}

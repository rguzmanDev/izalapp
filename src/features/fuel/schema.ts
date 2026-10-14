import { z } from "zod";
import {
  checkbox,
  optionalId,
  optionalMoney,
  optionalText,
  positiveDecimal,
  positiveInteger,
  requiredId,
} from "@/lib/validation";

/** When the total is left empty it is gallons × price per gallon. */
export const fuelLogSchema = z
  .object({
    occurredOn: z.iso.date("Fecha inválida"),
    odometer: positiveInteger,
    gallons: positiveDecimal(3),
    pricePerGallon: positiveDecimal(3),
    amountCents: optionalMoney,
    station: optionalText,
    isFullTank: checkbox,
    itemId: optionalId,
    accountId: requiredId,
  })
  .transform((value) => ({
    ...value,
    amountCents: value.amountCents ?? Math.round(value.gallons * value.pricePerGallon * 100),
  }));

export type FuelLogInput = z.output<typeof fuelLogSchema>;

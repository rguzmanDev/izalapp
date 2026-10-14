import { z } from "zod";
import {
  GALLONS_MAX_DIGITS,
  ODOMETER_MAX_DIGITS,
  PRICE_PER_GALLON_MAX_DIGITS,
} from "@/lib/limits";
import {
  checkbox,
  optionalId,
  optionalMoney,
  optionalText,
  positiveNumber,
  requiredId,
} from "@/lib/validation";

/** When the total is left empty it is gallons × price per gallon. */
export const fuelLogSchema = z
  .object({
    occurredOn: z.iso.date("Fecha inválida"),
    odometer: positiveNumber(0, ODOMETER_MAX_DIGITS),
    gallons: positiveNumber(3, GALLONS_MAX_DIGITS),
    pricePerGallon: positiveNumber(3, PRICE_PER_GALLON_MAX_DIGITS),
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

/** Input limits shared by the form fields and the server validation. */

export const NAME_MAX_LENGTH = 60;
export const NOTE_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const DAY_OF_MONTH_MAX = 31;

/** Digits accepted by the numeric inputs, sized to fit their database columns. */
export const MONEY_MAX_DIGITS = 9; // $9,999,999.99
export const ODOMETER_MAX_DIGITS = 7; // 9,999,999 mi
export const GALLONS_MAX_DIGITS = 7; // 9,999.999 gal
export const PRICE_PER_GALLON_MAX_DIGITS = 6; // $9,999.99

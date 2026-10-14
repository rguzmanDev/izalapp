const numberFormatter = (maximumFractionDigits: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits });

const integers = numberFormatter(0);
const oneDecimal = numberFormatter(1);
const threeDecimals = numberFormatter(3);

export const formatMiles = (miles: number) => `${integers.format(miles)} mi`;

export const formatGallons = (gallons: number) => `${threeDecimals.format(gallons)} gal`;

export const formatMpg = (milesPerGallon: number) => `${oneDecimal.format(milesPerGallon)} mi/gal`;

export const formatPricePerGallon = (price: number) => `$${price.toFixed(3)}/gal`;

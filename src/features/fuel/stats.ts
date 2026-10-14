type Refill = { odometer: number; gallons: number; isFullTank: boolean; amountCents: number };

export type RefillStats = {
  /** Miles driven since the previous refill. */
  distance: number | null;
  /** Only known on a full tank that follows another full tank. */
  milesPerGallon: number | null;
};

export type FuelSummary = {
  lastOdometer: number | null;
  averageMilesPerGallon: number | null;
  costPerMileCents: number | null;
  averagePricePerGallonCents: number | null;
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Stats for each refill. `refills` must be sorted by odometer, lowest first. */
export function refillStats(refills: Refill[]): RefillStats[] {
  let lastFull: Refill | null = null;
  let gallonsSinceFull = 0;

  return refills.map((refill, index) => {
    const previous = refills[index - 1];
    gallonsSinceFull += refill.gallons;

    let milesPerGallon: number | null = null;
    if (refill.isFullTank) {
      if (lastFull) milesPerGallon = (refill.odometer - lastFull.odometer) / gallonsSinceFull;
      lastFull = refill;
      gallonsSinceFull = 0;
    }

    return { distance: previous ? refill.odometer - previous.odometer : null, milesPerGallon };
  });
}

/** Averages between the first and last full tank, where fuel used is known exactly. */
export function summarizeFuel(refills: Refill[]): FuelSummary {
  const totalGallons = sum(refills.map((refill) => refill.gallons));
  const first = refills.findIndex((refill) => refill.isFullTank);
  const last = refills.findLastIndex((refill) => refill.isFullTank);

  let averageMilesPerGallon = null;
  let costPerMileCents = null;
  if (first !== -1 && last > first) {
    const measured = refills.slice(first + 1, last + 1);
    const distance = refills[last].odometer - refills[first].odometer;
    averageMilesPerGallon = distance / sum(measured.map((refill) => refill.gallons));
    costPerMileCents = sum(measured.map((refill) => refill.amountCents)) / distance;
  }

  return {
    lastOdometer: refills.at(-1)?.odometer ?? null,
    averageMilesPerGallon,
    costPerMileCents,
    averagePricePerGallonCents:
      totalGallons > 0 ? sum(refills.map((refill) => refill.amountCents)) / totalGallons : null,
  };
}

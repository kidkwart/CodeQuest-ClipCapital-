/**
 * Ghana phone number validation.
 *
 * Accepts the following formats:
 *   +233XXXXXXXXX   (international, no space)
 *   0XXXXXXXXX      (local, 10 digits)
 *   233XXXXXXXXX    (international without +)
 *
 * Mobile prefixes: 020, 023, 024, 025, 026, 027, 028, 050, 054, 055, 056, 057, 059
 */

const GHANA_MOBILE_PREFIXES = [
  "020",
  "023",
  "024",
  "025",
  "026",
  "027",
  "028",
  "050",
  "054",
  "055",
  "056",
  "057",
  "059",
];

const INTERNATIONAL_PREFIXES = GHANA_MOBILE_PREFIXES.map((p) => "233" + p.slice(1));

/**
 * Normalise any Ghana phone format to E.164: +233XXXXXXXXX
 */
export function normaliseGhanaPhone(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("233") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `+233${digits.slice(1)}`;
  }

  throw new Error(`Invalid Ghana phone number: ${input}`);
}

/**
 * Validate that the number is a recognised Ghana mobile prefix.
 */
export function isValidGhanaPhone(input: string): boolean {
  try {
    const normalised = normaliseGhanaPhone(input);
    const local = normalised.slice(3); // strip +233

    const prefix3 = "0" + local.slice(0, 2);
    return GHANA_MOBILE_PREFIXES.includes(prefix3);
  } catch {
    return false;
  }
}

/**
 * Full validation — normalise + prefix check.
 * Returns the E.164 string or throws.
 */
export function validateGhanaPhone(input: string): string {
  const normalised = normaliseGhanaPhone(input);
  if (!isValidGhanaPhone(normalised)) {
    throw new Error(
      `Unrecognised Ghana mobile prefix. Accepted: ${GHANA_MOBILE_PREFIXES.join(", ")}`,
    );
  }
  return normalised;
}

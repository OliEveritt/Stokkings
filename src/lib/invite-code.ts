// Crockford-style base32 alphabet minus 0/O/1/I/L to avoid ambiguity.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_SEGMENT_LEN = 4;
const CODE_SEGMENTS = 2;

export const INVITE_CODE_LENGTH = CODE_SEGMENT_LEN * CODE_SEGMENTS;
export const INVITE_CODE_REGEX = new RegExp(
  `^[${CODE_ALPHABET}]{${CODE_SEGMENT_LEN}}-[${CODE_ALPHABET}]{${CODE_SEGMENT_LEN}}$`
);

function pickChars(bytes: Uint8Array, count: number): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export function generateInviteCode(randomBytes?: Uint8Array): string {
  const total = CODE_SEGMENT_LEN * CODE_SEGMENTS;
  const bytes = randomBytes ?? crypto.getRandomValues(new Uint8Array(total));
  if (bytes.length < total) {
    throw new Error(`generateInviteCode requires at least ${total} bytes`);
  }
  const raw = pickChars(bytes, total);
  return `${raw.slice(0, CODE_SEGMENT_LEN)}-${raw.slice(CODE_SEGMENT_LEN)}`;
}

export function normalizeInviteCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

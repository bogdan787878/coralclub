/** Formatting and checks for the card form. Pure functions; nothing is stored. */

const digits = (s: string) => s.replace(/\D/g, "");

/** "4242424242424242" → "4242 4242 4242 4242" (Amex: 4-6-5). */
export function formatCardNumber(raw: string): string {
  const d = digits(raw).slice(0, 19);
  if (/^3[47]/.test(d)) {
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  return (d.match(/.{1,4}/g) ?? []).join(" ");
}

/** "1226" → "12/26"; a first digit above 1 becomes "0N/". */
export function formatExpiry(raw: string, previous = ""): string {
  let d = digits(raw).slice(0, 4);
  if (d.length === 1 && Number(d) > 1) d = `0${d}`;
  // deleting the slash should delete the digit before it too
  if (previous.length > raw.length && previous.endsWith("/") && d.length <= 2) {
    return d.slice(0, 1);
  }
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  if (d.length === 2 && raw.length >= 2 && !previous.endsWith("/"))
    return `${d}/`;
  return d;
}

/** Luhn checksum — catches typos, not fake cards. */
export function luhn(number: string): boolean {
  const d = digits(number);
  if (d.length < 12) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export type CardErrors = Partial<
  Record<"number" | "expiry" | "cvc" | "name", string>
>;

export function checkCard(
  f: { number: string; expiry: string; cvc: string; name: string },
  now = new Date(),
): CardErrors {
  const e: CardErrors = {};
  const n = digits(f.number);
  if (!n) e.number = "Enter your card number";
  else if (n.length < 13 || !luhn(n)) e.number = "Check your card number";

  const m = /^(\d{2})\/(\d{2})$/.exec(f.expiry);
  if (!m) e.expiry = "Use MM/YY";
  else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    const endOfMonth = new Date(year, month, 1);
    if (month < 1 || month > 12) e.expiry = "Check the month";
    else if (endOfMonth <= now) e.expiry = "This card has expired";
  }

  const c = digits(f.cvc);
  if (c.length < 3) e.cvc = "3 or 4 digits";

  if (!/[A-Za-z]{2}/.test(f.name)) e.name = "Enter the name on the card";
  return e;
}

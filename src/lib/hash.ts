// Client side hashing so a PIN or a password never crosses the wire in the
// clear. This is not a substitute for server side stretching: it means the
// server stores a digest rather than the secret, and a network capture yields
// a digest rather than something a person reuses on another site.
async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPin(pin: string): Promise<string> {
  return sha256(pin);
}

/** Salted with a fixed application label so a password digest and a PIN digest
    of the same six digits are not the same string. */
export async function hashPassword(password: string): Promise<string> {
  return sha256(`biya.password.v1:${password}`);
}

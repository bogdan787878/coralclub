/**
 * The shopper's contact details, kept in this browser only (localStorage,
 * never sent anywhere by this app): the checkout fills them in on the next
 * visit, and the sign-up step can use them to pre-fill its form.
 */
export type FriendContact = {
  first: string;
  last: string;
  phone: string;
  email: string;
};

const KEY = "coralclub.friend.contact";

export function readContact(): FriendContact | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<FriendContact>;
    return {
      first: c.first ?? "",
      last: c.last ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
    };
  } catch {
    return null;
  }
}

export function saveContact(c: FriendContact): void {
  if (!c.first && !c.last && !c.phone && !c.email) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* storage unavailable — nothing to keep */
  }
}

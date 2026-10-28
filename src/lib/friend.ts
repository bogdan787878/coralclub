/**
 * "Friend of the club": unique referral links. A link carries the distributor's
 * REF_CODE (`?ref=570445656503`) or Coral ID (`?d=8819457`); the page asks the
 * shop who that is, remembers the answer, and hands the visitor's cart to the
 * shop's basket with that distributor's REF_CODE — so the shop itself counts
 * the sale for them, at club prices and without registering.
 *
 * Read-only calls only:  GET /restApi/registration/consultant/?refCode=… |
 * ?memberId=…  (the shop answers any origin, no cookies needed).
 */
import { useSyncExternalStore } from "react";
import { FRIEND_REF_CODE } from "./beautySystem";
import { MARKET } from "./market";

export const SHOP = `https://${MARKET.site}`;

export type Friend = {
  refCode: string;
  /** The distributor's Coral ID. */
  memberId: string;
  name: string;
  avatar: string;
};

export type FriendSource = "link" | "saved" | "demo";

type Stored = { friend: Friend; at: number };

const KEY = "coralclub.friend";
/** A link stays the owner of the sale for 30 days; a newer link replaces it. */
export const FRIEND_TTL_DAYS = 30;

/** Resolves a distributor by REF_CODE or Coral ID; null when the shop doesn't know it. */
export async function lookupDistributor(q: {
  refCode?: string;
  memberId?: string;
}): Promise<Friend | null> {
  const params = new URLSearchParams();
  if (q.refCode) params.set("refCode", q.refCode);
  if (q.memberId) params.set("memberId", q.memberId);
  if (![...params.keys()].length) return null;
  try {
    const r = await fetch(
      `${SHOP}/restApi/registration/consultant/?${params}`,
      { headers: { Accept: "application/json" }, credentials: "omit" },
    );
    const d = (await r.json()) as {
      status?: boolean;
      result?: {
        MEMBER_ID: string;
        NAME: string;
        AVATAR: string;
        REF_CODE: string;
      };
    };
    if (!d.status || !d.result?.REF_CODE) return null;
    return {
      refCode: String(d.result.REF_CODE),
      memberId: String(d.result.MEMBER_ID),
      name: d.result.NAME,
      avatar: d.result.AVATAR,
    };
  } catch {
    return null;
  }
}

/* --------------------------- remembered friend --------------------------- */

let snapshot: Friend | null | undefined;

function read(): Friend | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    const fresh = Date.now() - s.at < FRIEND_TTL_DAYS * 86_400_000;
    return fresh && s.friend?.refCode ? s.friend : null;
  } catch {
    return null;
  }
}

export function saveFriend(friend: Friend): void {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ friend, at: Date.now() }),
    );
  } catch {
    /* storage unavailable — the friend still lives in memory for this visit */
  }
  snapshot = friend;
  window.dispatchEvent(new Event("coralclub:friend"));
}

export function forgetFriend(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  snapshot = null;
  window.dispatchEvent(new Event("coralclub:friend"));
}

const subscribe = (cb: () => void) => {
  window.addEventListener("coralclub:friend", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("coralclub:friend", cb);
    window.removeEventListener("storage", cb);
  };
};

/** The distributor remembered from the last referral link (null if none). */
export function useSavedFriend(): Friend | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (snapshot === undefined) snapshot = read();
      return snapshot;
    },
    () => null,
  );
}

/* --------------------------------- links --------------------------------- */

/** The cart handed to the shop's basket, tied to the distributor. */
export function shopBasketUrl(
  lines: { coralId: string; qty: number }[],
  friend: Pick<Friend, "refCode" | "memberId">,
): string {
  const items = lines
    .filter((l) => l.coralId && l.qty > 0)
    .map((l) => `${encodeURIComponent(l.coralId)}=${l.qty}`);
  return `${SHOP}/shop/shop_basket.php?${[
    `REF_CODE=${encodeURIComponent(friend.refCode)}`,
    `langss=${MARKET.linkLanguage}`,
    `user=${encodeURIComponent(friend.memberId)}`,
    "f=y",
    ...items,
  ].join("&")}`;
}

/** The shop's own sign-in. */
export const loginUrl = () => `${SHOP}/auth/`;

/** The shop's own sign-up, opened as an invitation from this distributor. */
export const registrationUrl = (friend: Pick<Friend, "refCode">) =>
  `${SHOP}/auth/registration/?REF_CODE=${encodeURIComponent(friend.refCode)}`;

/** The distributor used when a visitor arrives without a referral link. */
export const DEMO_REF_CODE = FRIEND_REF_CODE;

/** A distributor's unique link to the project (UTM included for GA4). */
export function referralLink(
  base: string,
  friend: Pick<Friend, "refCode" | "memberId">,
) {
  const q = new URLSearchParams({
    ref: friend.refCode,
    utm_source: "friend",
    utm_medium: "ref",
    utm_campaign: "all_all_friend_ref_hydration_de",
    utm_content: friend.memberId,
  });
  return `${base}?${q}`;
}

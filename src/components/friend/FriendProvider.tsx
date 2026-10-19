"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setTrackingContext, track, trackOnce } from "@/lib/analytics";
import {
  DEMO_REF_CODE,
  lookupDistributor,
  saveFriend,
  useSavedFriend,
  type Friend,
  type FriendSource,
} from "@/lib/friend";
import styles from "./Friend.module.css";

type Ctx = {
  /** Who gets the sale; null only while the shop is being asked. */
  friend: Friend | null;
  source: FriendSource | null;
  /** The link carried a code the shop doesn't know. */
  invalidLink: boolean;
};

const FriendCtx = createContext<Ctx>({
  friend: null,
  source: null,
  invalidLink: false,
});
export const useFriend = () => useContext(FriendCtx);

/**
 * Works out whose referral link this visit belongs to (the link in the
 * address, else the one remembered from an earlier visit, else a test
 * distributor), and keeps it for every page of the project.
 */
export function FriendProvider({ children }: { children: ReactNode }) {
  const saved = useSavedFriend();
  const [fresh, setFresh] = useState<{
    friend: Friend;
    source: FriendSource;
  } | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const ref = (q.get("ref") ?? "").replace(/\D/g, "");
    const d = (q.get("d") ?? "").replace(/\D/g, "");
    let alive = true;
    (async () => {
      if (ref || d) {
        const found = await lookupDistributor(
          ref ? { refCode: ref } : { memberId: d },
        );
        if (!alive) return;
        trackOnce("friend_link_open", () =>
          track("friend_link_open", {
            ref_id: found?.memberId ?? d,
            link_status: found ? "ok" : "invalid",
          }),
        );
        if (found) {
          saveFriend(found);
          setFresh({ friend: found, source: "link" });
          return;
        }
        setInvalidLink(true);
      }
      // no (valid) link on this page: the remembered one stays in charge
    })();
    return () => {
      alive = false;
    };
  }, []);

  // no link anywhere yet — a test distributor, so the flow can still be tried
  const [demo, setDemo] = useState<Friend | null>(null);
  const needDemo = !fresh && !saved;
  useEffect(() => {
    if (!needDemo) return;
    let alive = true;
    lookupDistributor({ refCode: DEMO_REF_CODE }).then(
      (f) => alive && setDemo(f),
    );
    return () => {
      alive = false;
    };
  }, [needDemo]);

  const value = useMemo<Ctx>(() => {
    if (fresh) return { ...fresh, invalidLink };
    if (saved) return { friend: saved, source: "saved", invalidLink };
    if (demo) return { friend: demo, source: "demo", invalidLink };
    return { friend: null, source: null, invalidLink };
  }, [fresh, saved, demo, invalidLink]);

  useEffect(() => {
    if (value.friend) {
      setTrackingContext({
        ref_id: value.friend.memberId,
        ref_source: value.source,
      });
    }
  }, [value.friend, value.source]);

  return <FriendCtx.Provider value={value}>{children}</FriendCtx.Provider>;
}

/** The strip under the header: who invited the visitor and what that gives. */
export function FriendBanner() {
  const { friend, source, invalidLink } = useFriend();

  return (
    <div className={styles.banner} role="status">
      {invalidLink && (
        <p className={styles.bannerWarn}>
          Ссылка не распознана магазином — показан дистрибьютор по умолчанию.
        </p>
      )}
      {friend ? (
        <div className={styles.bannerRow}>
          {friend.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar comes from the shop, any host
            <img
              src={friend.avatar}
              alt=""
              width={40}
              height={40}
              className={styles.avatar}
            />
          ) : (
            <span className={styles.avatar} aria-hidden="true" />
          )}
          <p className={styles.bannerText}>
            {source === "demo"
              ? "Тест: ссылки нет, покупка засчитается "
              : "Вас пригласил(а) "}
            <strong>{friend.name}</strong> · Coral ID {friend.memberId}
          </p>
          <span className={styles.bannerTag}>Клубная цена −20%</span>
        </div>
      ) : (
        <p className={styles.bannerText}>Определяем дистрибьютора…</p>
      )}
    </div>
  );
}

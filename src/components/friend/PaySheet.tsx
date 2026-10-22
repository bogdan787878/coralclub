"use client";

import { useEffect } from "react";
import { asset } from "@/lib/asset";
import { getPayOrder } from "@/lib/shopPay";
import styles from "./PaySheet.module.css";

/**
 * The card step as a bottom sheet over the checkout (a centred dialog on a
 * wide screen), in a frame. The frame is either our own card page (a
 * separate document, so it runs without analytics and without any script of
 * the checkout page; it tells us when the payment went through) or, where
 * the shop's gateway has its own page, that page (`tall`). Either way the
 * order is watched: once the shop says it is paid, the checkout moves on to
 * the confirmation page.
 */
/** The shop's page around its gateway: header, footer, banners, chat. */
const SHOP_CHROME = `
  .headerTemplateMini, .footerTemplateMini, .mobile-global-countries,
  .smartbanner, [class*="smartbanner"], .headerNotification,
  .dxt-coral--menu, [class*="INDposition"],
  [class*="callback"], [class*="cookie"] { display: none !important; }
  html, body { background: #fff !important; margin: 0 !important; }
`;

/** Same origin only (the shop's own domain, our proxy): tidy the shop's page. */
function tidyShopPage(frame: HTMLIFrameElement) {
  try {
    const doc = frame.contentDocument;
    if (!doc?.head || doc.getElementById("cc-tidy")) return;
    const style = doc.createElement("style");
    style.id = "cc-tidy";
    style.textContent = SHOP_CHROME;
    doc.head.appendChild(style);
    // the accessibility button keeps itself on with an inline !important
    doc.getElementById("INDshadowRootWrap")?.remove();
  } catch {
    /* another origin (the gateway itself): leave it as it is */
  }
}

export function PaySheet({
  src,
  orderId,
  tall = false,
  onClose,
  onChangeMethod,
}: {
  src: string;
  orderId: string;
  /** the shop's own page: taller, with «Change payment method» under it */
  tall?: boolean;
  onClose: () => void;
  onChangeMethod: () => void;
}) {
  // the shop's gateway page does not talk to us: ask the shop whether it is paid
  useEffect(() => {
    let alive = true;
    const look = async () => {
      const r = await getPayOrder(orderId);
      if (alive && "order" in r && r.order.paid) {
        window.location.assign(
          asset(`/friend/checkout/done/?order=${r.order.id}`),
        );
      }
    };
    const t = setInterval(look, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [orderId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; order?: string } | null;
      if (d?.type === "cc-change") {
        onChangeMethod();
        return;
      }
      if (d?.type !== "cc-paid") return;
      const id = String(d.order ?? "").replace(/\D/g, "");
      if (id)
        window.location.assign(asset(`/friend/checkout/done/?order=${id}`));
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("message", onMessage);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("message", onMessage);
      document.body.style.overflow = prev;
    };
  }, [onClose, onChangeMethod]);

  return (
    <>
      <div className={styles.sheetBackdrop} onClick={onClose} />
      <div
        className={`${styles.sheet} ${tall ? styles.sheetTall : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Pay by card"
      >
        <div className={styles.sheetHead}>
          <span className={styles.sheetGrip} aria-hidden="true" />
          <button
            type="button"
            className={styles.sheetClose}
            aria-label="Close"
            onClick={onClose}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3.5 3.5l9 9m0-9l-9 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <iframe
          className={styles.frame}
          src={src}
          title="Card payment"
          onLoad={(e) => {
            if (tall) tidyShopPage(e.currentTarget);
          }}
        />
        {tall && (
          <div className={styles.sheetFoot}>
            <button
              type="button"
              className={styles.ghost}
              onClick={onChangeMethod}
            >
              Change payment method
            </button>
          </div>
        )}
      </div>
    </>
  );
}

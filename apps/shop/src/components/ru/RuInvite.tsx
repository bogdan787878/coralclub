"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cc4 } from "@coral/api";
import { inviteUrl } from "@/lib/ru/ref";
import { Button, Sheet } from "@/components/ui";
import styles from "./RuInvite.module.css";

/** «Поделиться» как в макете (и в iOS): квадрат со стрелкой вверх. */
function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1" />
      <path d="M12 15V3M8.5 6.5 12 3l3.5 3.5" />
    </svg>
  );
}

/**
 * Пригласить в клуб — для вошедшего участника (дистрибьютора). Ссылка ведёт в этот магазин на регистрацию с ним
 * в консультантах (lib/ru/ref.ts: …/login/?tab=register&ref=<Coral ID>); из кабинета — только Coral ID (/account).
 *   «Зарегистрировать вручную» — регистрация нового участника под собой (форма магазина, консультант — вы);
 *   «Ссылка» — поделиться ссылкой (или скопировать);
 *   «QR-код» — QR ссылки: показать, поделиться картинкой или сохранить.
 */
export function RuInvite({ memberId, accountWhy = "", onManual }: { memberId: string; accountWhy?: string; onManual: () => void }) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [qr, setQr] = useState("");

  // ссылка — в этот магазин: регистрация с вами в консультантах (ссылка кабинета coral.club/….html уводит на
  // регистрацию сайта США). Нет Coral ID — ссылка кабинета (/account/ref_link), если он её выдал
  useEffect(() => {
    if (memberId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- адрес сайта известен только в браузере
      setLink(inviteUrl(memberId));
      setError("");
      return;
    }
    let alive = true;
    cc4<{ data?: string | { link?: string; url?: string }; message?: string }>("/account/ref_link").then((r) => {
      if (!alive) return;
      const d = r.json?.data;
      const l = typeof d === "string" ? d : (d?.link ?? d?.url ?? "");
      setLink(l);
      if (!l) {
        const api = r.ok ? "ссылка пустая" : `API ответил ${r.status || "нет связи"}${r.json?.message ? `: ${r.json.message}` : ""}`;
        setError(`Не удалось получить пригласительную ссылку: ${[accountWhy && `аккаунт — ${accountWhy}`, `ссылка — ${api}`].filter(Boolean).join("; ")}. Попробуйте выйти и войти заново.`);
      }
    });
    return () => {
      alive = false;
    };
  }, [memberId, accountWhy]);

  useEffect(() => {
    if (!link) return;
    let alive = true;
    QRCode.toDataURL(link, { width: 720, margin: 2, errorCorrectionLevel: "M", color: { dark: "#011130", light: "#ffffff" } })
      .then((url) => alive && setQr(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [link]);

  const shareLink = async () => {
    if (!link) return;
    setNote("");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Приглашение в Coral Club", url: link });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setNote("Ссылка скопирована");
    } catch {
      setNote(link);
    }
  };

  const qrFile = async () => {
    const blob = await (await fetch(qr)).blob();
    return new File([blob], "coral-club-priglashenie.png", { type: "image/png" });
  };
  const shareQr = async () => {
    try {
      const file = await qrFile();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Приглашение в Coral Club" });
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    // поделиться файлом нельзя — сохранить картинку
    const a = document.createElement("a");
    a.href = qr;
    a.download = "coral-club-priglashenie.png";
    a.click();
  };

  return (
    <section className={styles.invite} aria-labelledby="ru-invite-h">
      <h2 id="ru-invite-h" className={styles.title}>
        Пригласить в клуб
      </h2>
      {/* кнопки — UI kit: главная — регистрация вручную, ссылка и QR — второстепенные */}
      <Button variant="primary" block onClick={onManual}>
        Зарегистрировать вручную
      </Button>
      <div className={styles.row}>
        <Button variant="secondary" block onClick={shareLink} disabled={!link}>
          <span className={styles.btnIcon}>
            <ShareIcon />
            Ссылка
          </span>
        </Button>
        <Button variant="secondary" block onClick={() => setQrOpen(true)} disabled={!link || !qr}>
          <span className={styles.btnIcon}>
            <ShareIcon />
            QR-код
          </span>
        </Button>
      </div>
      {link === null && <p className={styles.note}>Загружаем вашу ссылку…</p>}
      {error && <p className={styles.note}>{error}</p>}
      {note && (
        <p className={styles.note} role="status">
          {note}
        </p>
      )}

      <Sheet open={qrOpen} onClose={() => setQrOpen(false)} title="QR-код приглашения" closeLabel="Закрыть">
        <div className={styles.qrBody}>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR из data: URL, нарисован на странице */}
          {qr && <img className={styles.qr} src={qr} alt="QR-код вашей пригласительной ссылки" width={280} height={280} />}
          <p className={styles.note}>Наведите камеру телефона — откроется регистрация в клубе под вами.</p>
          <Button variant="primary" block onClick={shareQr}>
            Поделиться QR-кодом
          </Button>
        </div>
      </Sheet>
    </section>
  );
}

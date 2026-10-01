"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Container, Heading, Section } from "@/components/ui";
import { ProtoHeader } from "@/components/proto/ProtoHeader";
import { clearProtoCart, formatRub, protoCartTotal, useProtoCart } from "@/lib/protoCart";
import styles from "./page.module.css";

const DELIVERY = 300;

type DeliveryMethod = "courier" | "pickup";
type PaymentMethod = "yoomoney" | "card" | "paypal";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 10l9-6 9 6M4 10h16v9H4v-9zM4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const PAYMENTS: { id: PaymentMethod; label: string; icon: () => React.JSX.Element }[] = [
  { id: "yoomoney", label: "ЮMoney", icon: BankIcon },
  { id: "card", label: "Оплата картой", icon: CardIcon },
  { id: "paypal", label: "PayPal", icon: WalletIcon },
];

type Field =
  | "address"
  | "house"
  | "apt"
  | "entrance"
  | "floor"
  | "intercom"
  | "zip"
  | "fullName"
  | "phone"
  | "email";

export default function ProtoCheckoutPage() {
  const router = useRouter();
  const lines = useProtoCart();
  const subtotal = protoCartTotal(lines);
  const total = lines.length ? subtotal + DELIVERY : 0;

  const [delivery, setDelivery] = useState<DeliveryMethod>("courier");
  const [payment, setPayment] = useState<PaymentMethod>("yoomoney");
  const [fields, setFields] = useState<Record<Field, string>>({
    address: "",
    house: "",
    apt: "",
    entrance: "",
    floor: "",
    intercom: "",
    zip: "",
    fullName: "",
    phone: "",
    email: "",
  });
  const [promo, setPromo] = useState("");
  const [wantsEmails, setWantsEmails] = useState(true);
  const [agreed, setAgreed] = useState(true);

  const setField = (f: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [f]: e.target.value }));

  const submit = () => {
    clearProtoCart();
    router.push("/proto/success");
  };

  return (
    <main>
      <ProtoHeader step="checkout" />

      <div className={styles.summaryBar}>
        <div className={styles.summaryBarInner}>
          <span className={styles.summaryBarLabel}>Состав заказа</span>
          <span className={styles.summaryBarTotal}>{formatRub(total)}</span>
        </div>
      </div>

      <Section tone="surface">
        <Container>
          <div className={styles.layout}>
            <div>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={`${styles.tab}${delivery === "courier" ? ` ${styles.tabOn}` : ""}`}
                  onClick={() => setDelivery("courier")}
                >
                  Курьер
                </button>
                <button
                  type="button"
                  className={`${styles.tab}${delivery === "pickup" ? ` ${styles.tabOn}` : ""}`}
                  onClick={() => setDelivery("pickup")}
                >
                  Самовывоз
                </button>
              </div>

              {delivery === "courier" ? (
                <>
                  <Heading as="h2" className={styles.sectionTitle}>
                    Адрес
                  </Heading>
                  <div className={styles.grid}>
                    <div className={`${styles.field} ${styles.fieldFull}`}>
                      <label className={styles.label} htmlFor="address">
                        Найти адрес<span className={styles.required}>*</span>
                      </label>
                      <input
                        id="address"
                        className={styles.input}
                        value={fields.address}
                        onChange={setField("address")}
                        placeholder="Город, улица"
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="house">
                        Дом<span className={styles.required}>*</span>
                      </label>
                      <input id="house" className={styles.input} value={fields.house} onChange={setField("house")} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="apt">
                        Квартира
                      </label>
                      <input id="apt" className={styles.input} value={fields.apt} onChange={setField("apt")} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="entrance">
                        Подъезд
                      </label>
                      <input id="entrance" className={styles.input} value={fields.entrance} onChange={setField("entrance")} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="floor">
                        Этаж
                      </label>
                      <input id="floor" className={styles.input} value={fields.floor} onChange={setField("floor")} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="intercom">
                        Домофон
                      </label>
                      <input id="intercom" className={styles.input} value={fields.intercom} onChange={setField("intercom")} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="zip">
                        Индекс<span className={styles.required}>*</span>
                      </label>
                      <input id="zip" className={styles.input} value={fields.zip} onChange={setField("zip")} />
                    </div>
                  </div>
                </>
              ) : (
                <p className={styles.pickupNote}>
                  Выберите пункт самовывоза на карте — ближайшие точки Coral Club в вашем городе.
                </p>
              )}
            </div>

            <div>
              <Heading as="h2" className={styles.sectionTitle}>
                Получатель
              </Heading>
              <div className={styles.grid}>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor="fullName">
                    Имя и фамилия<span className={styles.required}>*</span>
                  </label>
                  <input
                    id="fullName"
                    className={styles.input}
                    value={fields.fullName}
                    onChange={setField("fullName")}
                    placeholder="Иван Иванов"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="phone">
                    Телефон<span className={styles.required}>*</span>
                  </label>
                  <input
                    id="phone"
                    className={styles.input}
                    value={fields.phone}
                    onChange={setField("phone")}
                    placeholder="+7 999 111-22-33"
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor="email">
                    Email<span className={styles.required}>*</span>
                  </label>
                  <input
                    id="email"
                    className={styles.input}
                    value={fields.email}
                    onChange={setField("email")}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <Heading as="h2" className={styles.sectionTitle}>
                Способы оплаты
              </Heading>
              <div className={styles.payOptions}>
                {PAYMENTS.map((p) => {
                  const on = payment === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      className={`${styles.payOption}${on ? ` ${styles.payOptionOn}` : ""}`}
                      onClick={() => setPayment(p.id)}
                    >
                      <span className={styles.payIcon}>
                        <Icon />
                      </span>
                      <span className={styles.payLabel}>{p.label}</span>
                      <span className={`${styles.radioDot}${on ? ` ${styles.radioDotOn}` : ""}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Heading as="h2" className={styles.sectionTitle}>
                Состав заказа
              </Heading>

              {lines.length > 0 && (
                <div className={styles.orderThumbs}>
                  {lines.map((l) => (
                    <div className={styles.orderThumb} key={l.variant}>
                      <Image src={l.image} alt={l.name} fill sizes="56px" />
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.orderSummary}>
                <div className={styles.orderRow}>
                  <span>Товары ({lines.length})</span>
                  <span>{formatRub(subtotal)}</span>
                </div>
                <div className={styles.orderRow}>
                  <span>Доставка</span>
                  <span>{formatRub(DELIVERY)}</span>
                </div>
                <div className={styles.orderRow}>
                  <span>Итого:</span>
                  <span className={styles.orderTotal}>{formatRub(total)}</span>
                </div>
              </div>

              <div className={styles.promoRow}>
                <input
                  className={`${styles.input} ${styles.promoInput}`}
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Промокод"
                />
                <Button variant="secondary">Применить</Button>
              </div>
            </div>

            <button type="button" className={styles.checkboxRow} onClick={() => setWantsEmails((v) => !v)}>
              <span className={`${styles.checkbox}${wantsEmails ? "" : ` ${styles.checkboxOff}`}`}>
                <CheckIcon />
              </span>
              <span className={styles.checkboxText}>Я хочу получать письма о скидках и акциях</span>
            </button>

            <button type="button" className={styles.checkboxRow} onClick={() => setAgreed((v) => !v)}>
              <span className={`${styles.checkbox}${agreed ? "" : ` ${styles.checkboxOff}`}`}>
                <CheckIcon />
              </span>
              <span className={styles.checkboxText}>
                Оформляя заказ, вы соглашаетесь с{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Политикой обработки персональных данных
                </a>{" "}
                и принимаете{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Условия продажи
                </a>
                .
              </span>
            </button>

            <Button variant="primary" className={styles.submit} disabled={!agreed || !lines.length} onClick={submit}>
              Перейти к оплате
            </Button>
          </div>
        </Container>
      </Section>
    </main>
  );
}

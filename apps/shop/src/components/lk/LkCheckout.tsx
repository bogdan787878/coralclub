"use client";

import Link from "next/link";
import {
  AddressSearch,
  CountryMenu,
  CourierSlots,
  DeliveryModeSwitch,
  MapPicker,
  PickupPointButton,
  MAP_RU,
  COUNTRY_RU,
  PICKUP_RU,
  PickupSheet,
} from "@/components/checkout";
import { Consent, FloatInput, Loader, OptionCard, OptionCards, OptionInfo } from "@/components/ui";
import { addressSearchEnabled } from "@/lib/addressSearch";
import { useMemberCheckout } from "@/lib/lk/useMemberCheckout";
import styles from "@/components/checkout/CheckoutPage.module.css";
import extra from "@/components/checkout/CheckoutExtras.module.css";
import own from "./LkCheckout.module.css";

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The member area's checkout: the friend project's checkout screen (same
 * sections, same styles and parts) in Russian, on the member's own session. All
 * the logic is in lib/lk/useMemberCheckout; this file only draws it.
 */
export function LkCheckout() {
  const c = useMemberCheckout();
  const { form, delivery: d, payment: p, promoState: pr, bonusState: b, lines, money, field, attempted } = c;
  const place = Boolean(form.city);
  const nonLatinEmail = form.email.trim() !== "" && !/^[\x21-\x7E]+@[\x21-\x7E]+\.[\x21-\x7E]+$/.test(form.email.trim());
  const nameGap = attempted && form.fullName.trim() !== "" && form.fullName.trim().split(/\s+/).length < 2;
  const addressGap = attempted && !form.picked && form.searchText.trim() !== "";

  const summary = (
    <div className={styles.sum}>
      <ul className={styles.sumLines}>
        {lines.map((l) => (
          <li key={l.coralId} className={styles.sumLine}>
            <span className={styles.thumb}>
              <span className={styles.thumbImg}>
                {/* eslint-disable-next-line @next/next/no-img-element -- the shop's own picture, an absolute address */}
                {l.image && <img src={l.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
              </span>
              <span className={styles.badge}>{l.qty}</span>
            </span>
            <span className={styles.lineName}>{l.name}</span>
            <span className={styles.lineSum}>{l.price}</span>
          </li>
        ))}
      </ul>
      <dl className={styles.rows}>
        {c.memberSaving > 0 && (
          <div className={styles.rowGood}>
            <dt>Скидка участника</dt>
            <dd>−{money(c.memberSaving)}</dd>
          </div>
        )}
        <div>
          <dt>Товары</dt>
          <dd>{money(c.goodsSum)}</dd>
        </div>
        {pr.promo && c.promoOff > 0 && (
          <div className={styles.rowGood}>
            <dt>Промокод {pr.promo}</dt>
            <dd>−{money(c.promoOff)}</dd>
          </div>
        )}
        <div>
          <dt>Доставка</dt>
          <dd>{c.deliveryPrice === null ? "Считается дальше" : c.deliveryPrice > 0 ? money(c.deliveryPrice) : "Бесплатно"}</dd>
        </div>
        <div className={styles.rowTotal}>
          <dt>Итого</dt>
          <dd>{c.shownTotal !== null ? money(c.shownTotal) : "—"}</dd>
        </div>
      </dl>
      {c.totalSaving > 0 && <p className={styles.saved}>Вы экономите {money(c.totalSaving)}</p>}
    </div>
  );
  const barTotal = c.shownTotal ?? c.goodsSum;

  if (c.order) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <h1 className={styles.title}>Заказ № {c.order.id} оформлен</h1>
          {c.sending ? (
            <>
              <p className={styles.host}>Переходим к оплате…</p>
              <Loader lines={3}>Переходим к оплате</Loader>
            </>
          ) : (
            <>
              <p className={styles.host}>
                {c.order.failed
                  ? `Страницу оплаты открыть не удалось (${c.order.failed}). Заказ создан и ждёт оплаты, можно повторить переход.`
                  : "Заказ создан."}
              </p>
              {c.order.failed && (
                <button type="button" className={styles.pay} onClick={() => void c.retryPayment()}>
                  Повторить переход к оплате
                </button>
              )}
              <Link href="/lk/" className={own.link}>
                В личный кабинет
              </Link>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page} data-analytics-location="checkout">
      <div className={own.bar}>
        <Link href="/lk/cart/" className={own.back}>
          ← Корзина
        </Link>
        <CountryMenu countries={c.countries} value={c.country} onChange={c.changeCountry} labels={COUNTRY_RU} />
      </div>
      {lines.length === 0 ? (
        <div className={styles.empty}>
          <h1 className={styles.title}>Оформление заказа</h1>
          <p className={styles.host}>В корзине пусто.</p>
          <Link href="/lk/cart/" className={own.link}>
            Вернуться в корзину
          </Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <details className={styles.sumMobile}>
            <summary className={styles.sumHead}>
              <span>
                Состав заказа <Chevron />
              </span>
              <span className={styles.sumHeadPrice}>
                <strong>{money(barTotal)}</strong>
              </span>
            </summary>
            <div className={styles.sumBodyMobile}>{summary}</div>
          </details>

          <div className={styles.main}>
            <h1 className={extra.visuallyHidden}>Оформление заказа</h1>

            {c.ready === "idle" && <Loader lines={6}>Готовим заказ…</Loader>}
            {c.error && (
              <p className={styles.error} role="alert">
                {c.error}
              </p>
            )}
            {c.warn && <p className={styles.error}>{c.warn}</p>}

            {!d.pickupNone && (
              <DeliveryModeSwitch
                value={d.pickup ? "pickup" : "courier"}
                labels={{ courier: "Доставка", pickup: "Самовывоз" }}
                label="Как получить заказ"
                onChange={(id) => {
                  d.setMode(id);
                  if (id === "pickup" && form.city) d.setSheetOpen(true);
                }}
              />
            )}

            <section className={styles.section}>
              <h2 className={styles.h2}>Доставка</h2>
              {d.pickup && d.pickupItems.length === 0 && place ? (
                <p className={styles.hint}>
                  {d.deliveryFor === d.deliveryKey ? `Пунктов выдачи в стране «${c.countryName}» пока нет. Выберите доставку.` : "Ищем пункты выдачи…"}
                </p>
              ) : !d.pickup ? (
                <>
                  {form.manual || !addressSearchEnabled ? (
                    <FloatInput
                      {...field("address")}
                      label="Улица и дом"
                      placeholder="Тверская 7"
                      value={form.address}
                      onChange={form.setAddress}
                      error={attempted && form.street !== "" && form.build === ""}
                      hint={attempted && form.street !== "" && form.build === "" ? "Добавьте номер дома, например Тверская 7" : undefined}
                      autoComplete="address-line1"
                    />
                  ) : (
                    <AddressSearch
                      {...field("address")}
                      country={c.country}
                      label="Найти адрес"
                      placeholder="Улица, дом, город"
                      value={form.searchText}
                      onChange={(v) => {
                        form.setSearchText(v);
                        if (form.picked) {
                          // typing again drops the earlier pick
                          form.setPicked(false);
                          form.setAddress("");
                          form.setZip("");
                          form.setCityDraft("");
                        }
                      }}
                      error={addressGap}
                      hint={addressGap ? "Выберите адрес из списка или на карте" : undefined}
                      onPick={c.applyAddress}
                    />
                  )}
                  {addressSearchEnabled && (
                    <div className={styles.addLines}>
                      <button type="button" className={styles.addLine} onClick={() => d.setMapOpen(true)}>
                        Выбрать на карте
                      </button>
                      {form.manual && (
                        <button
                          type="button"
                          className={styles.addLine}
                          onClick={() => {
                            form.setPicked(Boolean(form.street && form.build && form.zip.trim() && form.city));
                            form.setSearchText(form.street && form.build && form.zip.trim() && form.city ? `${form.address}, ${form.zip.trim()} ${form.city}` : "");
                            form.setManual(false);
                          }}
                        >
                          Искать адрес
                        </button>
                      )}
                    </div>
                  )}
                  {(form.manual || form.apartment) && (
                    <FloatInput label="Квартира, подъезд (необязательно)" placeholder="кв. 5, подъезд 2" value={form.apartment} onChange={form.setApartment} autoComplete="address-line2" />
                  )}
                  {(form.manual || !addressSearchEnabled) && (
                    <>
                      <div className={styles.row}>
                        <FloatInput {...field("zip")} label="Индекс" placeholder="125009" value={form.zip} onChange={form.setZip} inputMode="numeric" autoComplete="postal-code" />
                        <FloatInput {...field("city")} label="Город" value={form.cityDraft} onChange={form.setCityDraft} autoComplete="address-level2" />
                      </div>
                      {(form.needsRegion || form.region) && (
                        <FloatInput {...field("region")} label="Регион, например Республика Татарстан" value={form.region} onChange={form.setRegion} autoComplete="address-level1" />
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <FloatInput {...field("city")} label="Город" value={form.cityDraft} onChange={form.setCityDraft} autoComplete="address-level2" />
                  {(form.needsRegion || form.region) && (
                    <FloatInput {...field("region")} label="Регион, например Республика Татарстан" value={form.region} onChange={form.setRegion} autoComplete="address-level1" />
                  )}
                  <div className={`${styles.pickup} ${c.field("point").shake ? styles.shake : ""}`} data-field="point">
                    {!form.city ? (
                      <p className={styles.hint}>Введите город, чтобы найти пункты выдачи рядом.</p>
                    ) : d.pointsLoading ? (
                      <Loader>Ищем пункты выдачи…</Loader>
                    ) : d.points.length === 0 ? (
                      <p className={styles.hint}>Пунктов выдачи рядом с «{form.city}» нет. Попробуйте соседний город или выберите доставку по адресу.</p>
                    ) : (
                      <>
                        <PickupPointButton
                          error={attempted && !d.point}
                          onClick={() => d.setSheetOpen(true)}
                          title={d.point ? (d.pickupItems.find((i) => i.ID === d.point?.TYPE)?.NAME ?? d.point.NAME) : undefined}
                          address={d.point ? [d.point.ADDRESS, d.point.CITY].filter(Boolean).join(", ") : undefined}
                          emptyTitle="Выбрать пункт выдачи"
                          action={d.point ? "Изменить" : `${d.points.length} рядом`}
                        />
                        {attempted && !d.point && (
                          <p className={`${styles.floatHint} ${styles.floatHintError}`} role="alert">
                            Выберите пункт выдачи
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.h2}>Контакты</h2>
              <FloatInput
                {...field("email")}
                error={nonLatinEmail}
                hint={nonLatinEmail ? "Только латинские буквы (похожая буква из другого алфавита не подойдёт)" : undefined}
                label="E-mail"
                placeholder="name@example.com"
                value={form.email}
                onChange={form.setEmail}
                inputMode="email"
                autoComplete="email"
              />
              <FloatInput
                {...field("first")}
                label="Имя и фамилия"
                placeholder="Иван Петров"
                value={form.fullName}
                onChange={form.setFullName}
                error={nameGap}
                hint={nameGap ? "Добавьте фамилию" : undefined}
                autoComplete="name"
              />
              <FloatInput {...field("phone")} label="Телефон" placeholder="+7 900 000-00-00" value={form.phone} onChange={form.setPhone} inputMode="tel" autoComplete="tel" />
            </section>

            <section className={styles.section}>
              <h2 className={styles.h2}>Способ доставки</h2>
              {!place ? (
                <p className={styles.hint}>Укажите адрес, чтобы увидеть способы доставки.</p>
              ) : d.deliveryLoading ? (
                <Loader>Загружаем способы доставки…</Loader>
              ) : d.items.length > 0 ? (
                d.items.length === 1 ? (
                  <OptionInfo
                    title={d.items[0].NAME}
                    detail={[d.items[0].TRANSIT, d.items[0].FREE_DELIVERY && d.items[0].PRICE ? `бесплатно от ${money(d.items[0].FREE_DELIVERY)}` : ""].filter(Boolean).join(" · ")}
                    aside={d.items[0].PRICE ? money(d.items[0].PRICE) : "Бесплатно"}
                    good={!d.items[0].PRICE}
                  />
                ) : (
                  <OptionCards label="Способ доставки">
                    {d.items.map((it) => (
                      <OptionCard
                        key={it.ID}
                        name="delivery"
                        checked={d.deliveryId === it.ID}
                        onChange={() => d.setDeliveryChoice(it.ID)}
                        title={it.NAME}
                        good={!it.PRICE}
                        lines={
                          <>
                            {it.TRANSIT && <span>{it.TRANSIT}</span>}
                            {it.FREE_DELIVERY && it.PRICE ? <span>бесплатно от {money(it.FREE_DELIVERY)}</span> : null}
                            <span>{it.PRICE ? money(it.PRICE) : "Бесплатно"}</span>
                          </>
                        }
                      />
                    ))}
                  </OptionCards>
                )
              ) : (
                <p className={styles.hint}>{d.deliveryErr || "Для этого адреса нет способов доставки."}</p>
              )}
              {d.slotDay && d.slotHours && (
                <CourierSlots days={d.slotDays} day={d.slotDay} hours={d.slotHours} onDay={d.setSlotDate} onHours={d.setSlotTime} title="Дата и время доставки" dayLabel="День доставки" hoursLabel="Часы доставки" />
              )}
            </section>

            <section className={styles.section} id="payment-method">
              <h2 className={styles.h2}>Оплата</h2>
              {!place ? (
                <p className={styles.hint}>Способы оплаты появятся после выбора адреса.</p>
              ) : p.paymentsLoading ? (
                <Loader>Загружаем способы оплаты…</Loader>
              ) : p.payments.length === 1 ? (
                <OptionInfo title={p.payments[0].NAME} />
              ) : (
                <OptionCards label="Способ оплаты">
                  {p.payments.map((m) => (
                    <OptionCard
                      key={m.ID}
                      name="payment"
                      checked={p.paymentId === m.ID}
                      onChange={() => p.setPaymentChoice(m.ID)}
                      title={m.NAME}
                      footer={
                        m.IMAGE ? (
                          // eslint-disable-next-line @next/next/no-img-element -- the shop's own method logo
                          <img src={m.IMAGE} alt="" style={{ width: 32, height: 32, objectFit: "contain", objectPosition: "left" }} />
                        ) : (
                          <span />
                        )
                      }
                    />
                  ))}
                </OptionCards>
              )}
            </section>

            <div className={styles.discount}>
              {!pr.promoOpen && !pr.promo ? (
                <button type="button" className={styles.discountToggle} onClick={() => pr.setPromoOpen(true)} disabled={!d.deliveryId}>
                  Добавить промокод
                </button>
              ) : (
                <>
                  <div className={styles.discountRow}>
                    <input value={pr.promoDraft || pr.promo} onChange={(e) => pr.setPromoDraft(e.target.value)} placeholder="Промокод" aria-label="Промокод" autoCapitalize="characters" />
                    <button type="button" className={styles.apply} onClick={() => void pr.applyPromo()} disabled={!pr.promoDraft.trim() || !d.deliveryId}>
                      Применить
                    </button>
                  </div>
                  {pr.promoMsg && <p className={styles.fieldHint}>{pr.promoMsg}</p>}
                  {pr.promo && <p className={styles.fieldHint}>Промокод {pr.promo} применён.</p>}
                </>
              )}
            </div>

            {b.walletHave > 0 && (
              <div className={styles.discount}>
                {!b.bonusOpen && !b.bonus ? (
                  <button type="button" className={styles.discountToggle} onClick={() => b.setBonusOpen(true)}>
                    Списать бонусы (доступно {money(b.walletHave)})
                  </button>
                ) : (
                  <>
                    <div className={styles.discountRow}>
                      <input
                        value={b.bonusDraft}
                        onChange={(e) => b.setBonusDraft(e.target.value)}
                        inputMode="numeric"
                        placeholder={`До ${b.walletLimit}`}
                        aria-label="Сколько бонусов списать"
                      />
                      <button type="button" className={styles.apply} onClick={() => b.setBonusTo(Number(b.bonusDraft.replace(/\D/g, "")) || 0)}>
                        Списать
                      </button>
                    </div>
                    <p className={styles.fieldHint}>
                      {b.bonus ? `Списывается ${money(b.bonus)}. ` : ""}Можно списать до {money(b.walletLimit)} из {money(b.walletHave)}.{" "}
                      <button type="button" className={styles.addLine} onClick={() => b.setBonusTo(b.walletLimit)}>
                        Максимум
                      </button>
                      {b.bonus > 0 && (
                        <>
                          {" "}
                          <button type="button" className={styles.addLine} onClick={() => b.setBonusTo(0)}>
                            Не списывать
                          </button>
                        </>
                      )}
                    </p>
                  </>
                )}
              </div>
            )}

            <section className={styles.totalCard}>
              <h2 className={styles.h2}>Итого</h2>
              {c.totalsLoading && <Loader>Считаем…</Loader>}
              <div className={c.totalsLoading ? styles.dim : undefined}>
                <dl className={styles.rows}>
                  {c.memberSaving > 0 && (
                    <div className={styles.rowGood}>
                      <dt>Скидка участника</dt>
                      <dd>−{money(c.memberSaving)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Товары</dt>
                    <dd>{money(c.goodsSum)}</dd>
                  </div>
                  <div>
                    <dt>Доставка</dt>
                    <dd>{c.deliveryPrice === null ? "—" : c.deliveryPrice > 0 ? money(c.deliveryPrice) : "Бесплатно"}</dd>
                  </div>
                  <div className={styles.rowTotal}>
                    <dt>Итого</dt>
                    <dd>{c.shownTotal !== null ? money(c.shownTotal) : "—"}</dd>
                  </div>
                </dl>
              </div>
              <p className={styles.host}>Цены включают налоги. Доставка указана выше.</p>
              {c.totalSaving > 0 && <p className={styles.saved}>Общая экономия {money(c.totalSaving)}</p>}
            </section>

            <div className={styles.consents}>
              <Consent name="terms" checked={form.acceptTerms} onChange={form.setAcceptTerms} shake={c.field("terms").shake} attention={attempted && !form.acceptTerms}>
                Принимаю{" "}
                <a href="https://coralclub.ru/faq/terms/" target="_blank" rel="noopener noreferrer">
                  условия оферты
                </a>{" "}
                и{" "}
                <a href="https://coralclub.ru/faq/privacy/" target="_blank" rel="noopener noreferrer">
                  политику конфиденциальности
                </a>
              </Consent>
              <Consent name="data" checked={form.agreeData} onChange={form.setAgreeData} shake={c.field("data").shake} attention={attempted && !form.agreeData}>
                Согласен на обработку персональных данных
              </Consent>
            </div>

            <button type="button" className={styles.pay} disabled={c.sending || c.ready !== "ok" || c.totalsLoading || !c.canOrder} onClick={() => void c.submit()}>
              {c.sending ? "Оформляем заказ…" : "Перейти к оплате"}
            </button>
          </div>

          <aside className={styles.sumDesktop} aria-label="Состав заказа">
            {summary}
          </aside>
        </div>
      )}
      {d.sheetOpen && d.pickup && !d.pointsLoading && d.points.length > 0 && (
        <PickupSheet
          country={c.country}
          countryName={c.countryName}
          city={form.city}
          points={d.points}
          services={d.pickupItems}
          selected={d.point?.CODE ?? ""}
          money={money}
          onSelect={(code) => {
            d.setPointCode(code);
            d.setSheetOpen(false);
          }}
          onClose={() => d.setSheetOpen(false)}
          labels={PICKUP_RU}
        />
      )}
      {d.mapOpen && addressSearchEnabled && (
        <MapPicker
          country={c.country}
          countryName={c.countryName}
          nearby={form.city || undefined}
          onSelect={(a) => {
            c.applyAddress(a);
            d.setMapOpen(false);
          }}
          onClose={() => d.setMapOpen(false)}
          labels={MAP_RU}
        />
      )}
    </main>
  );
}

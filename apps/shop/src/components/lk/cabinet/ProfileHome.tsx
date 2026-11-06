"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";
import { fio, initials, money, points } from "@/lib/lk/cabinet/format";
import { BonusSheet, InviteSheet, PayoutSheet, PointsSheet } from "./Actions";
import { Ranks } from "./Ranks";
import { useSheet } from "./Sheet";
import { useCabinet, type Cabinet } from "./useCabinet";
import { Metrics, TasksBlock } from "./Widgets";

/** Аватар участника: фото из API или инициалы. */
export function Avatar({ p, className = "" }: { p: Cabinet["profile"]; className?: string }) {
  return (
    <span className={`h-avatar ${className}${p ? "" : " sk"}`}>
      {p?.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- фото из API кабинета, без оптимизатора картинок
        <img src={p.avatar} alt="" referrerPolicy="no-referrer" />
      ) : (
        initials(p)
      )}
    </span>
  );
}

/**
 * Главная кабинета («Профиль», перенесено из кабинета на чистом JS, #/me): участник и лента рангов, основной и
 * трансферный счёт, быстрые действия, история заказов и структура, «Мои показатели», «Задачи».
 */
export function ProfileHome() {
  const cab = useCabinet();
  const sheet = useSheet();
  const p = cab.profile;
  const balanceText = typeof cab.balance === "number" ? money(cab.balance, cab.currency) : "—";
  const act = {
    points: () => sheet.open("Перевод баллов", <PointsSheet cab={cab} onDone={cab.reload} />),
    bonus: () => sheet.open("Перевод бонусов", <BonusSheet cab={cab} onDone={cab.reload} />),
    payout: () => sheet.open("Вывести на карту", <PayoutSheet cab={cab} />),
    invite: () => sheet.open("Пригласить в клуб", <InviteSheet cab={cab} />),
  };
  return (
    <main className="home">
      <div id="h-main">
        <section className="h-user-wrap" aria-label="Участник и ранги">
          <Link className="h-who" href="/lk/profile/" aria-label="Открыть профиль">
            <Avatar p={p} />
            <b className={p ? "" : "sk"}>{p ? fio(p) : "—"}</b>
            <i aria-hidden="true">
              <Icon name="next" />
            </i>
          </Link>
          <Ranks cab={cab} />
        </section>
        <section className="h-balance" aria-label="Баланс">
          {cab.points !== undefined && (
            <Link className="h-tag" href="/lk/transfer/" title={cab.points === null ? "Метод трансферного счёта не вернул баллы" : "Баллы трансферного счёта за текущий месяц"}>
              <Icon name="crown" />
              <span>Трансферный счёт · {cab.points === null ? "нет данных" : points(cab.points)}</span>
            </Link>
          )}
          <Link className="h-bal" href="/lk/wallet/" aria-label="Открыть Coral Кошелёк">
            <span className={`h-amount${cab.balance === undefined ? " sk" : ""}`}>{balanceText}</span>
            <span className="h-caption">
              Счёт основной
              <i aria-hidden="true">
                <Icon name="next" />
              </i>
            </span>
          </Link>
        </section>
        <nav className="h-actions h-actions-4" aria-label="Быстрые действия">
          <button className="h-act" type="button" onClick={act.points}>
            <span>
              <Icon name="arrowRight" />
            </span>
            Перевод баллов
          </button>
          <button className="h-act" type="button" onClick={act.bonus}>
            <span>
              <Icon name="checkCircle" />
            </span>
            Перевод бонусов
          </button>
          <button className="h-act" type="button" onClick={act.payout}>
            <span>
              <Icon name="card" />
            </span>
            Вывести на карту
          </button>
          <button className="h-act" type="button" onClick={act.invite}>
            <span>
              <Icon name="userPlus" />
            </span>
            Пригласить в клуб
          </button>
        </nav>
        <Link className="h-link" href="/lk/orders/">
          <span className="h-link-ic" aria-hidden="true">
            <Icon name="bag" />
          </span>
          <span className="h-link-text">
            <b>История заказов</b>
            <span>Все заказы и их статусы</span>
          </span>
        </Link>
        <Link className="h-link" href="/lk/structure/">
          <span className="h-link-ic" aria-hidden="true">
            <Icon name="users" />
          </span>
          <span className="h-link-text">
            <b>Моя структура</b>
            <span>Кто в вашей команде</span>
          </span>
        </Link>
        <Metrics cab={cab} />
        <TasksBlock cab={cab} />
      </div>
    </main>
  );
}

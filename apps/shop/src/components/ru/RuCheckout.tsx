"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui";
import { LkCheckout } from "@/components/lk/LkCheckout";
import { loadMemberCart } from "@/lib/lk/memberCart";
import { RU_BASE } from "@/lib/ru/shop";
import { useRuMember } from "@/lib/ru/live";

/**
 * Оформление магазина России — только для участника (механика регистрации): гостя отправляем на вход, а после
 * него обратно сюда. Сам экран — оформление участника (как в «Друге клуба», на сессии участника через шлюз):
 * доставка и пункты выдачи по стране, данные аккаунта, способы оплаты, промокод, итог, заказ и переход к банку.
 */
export function RuCheckout() {
  const member = useRuMember();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (member === false) router.replace(`${RU_BASE}/login/?next=${encodeURIComponent(`${RU_BASE}/checkout/`)}`);
    if (!member) return;
    let alive = true;
    // оформление считает итог по копии корзины участника: сначала читаем её с сервера
    loadMemberCart().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [member, router]);

  if (!member || !ready) {
    return (
      <div style={{ padding: "48px 16px" }}>
        <Loader>{member ? "Загружаем корзину…" : "Переходим ко входу…"}</Loader>
      </div>
    );
  }
  return <LkCheckout base={RU_BASE} doneLink={{ href: `${RU_BASE}/`, label: "Вернуться в магазин" }} />;
}

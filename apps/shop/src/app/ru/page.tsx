import type { Metadata } from "next";
import { RuHome } from "@/components/ru/RuHome";
import styles from "@/components/ru/Ru.module.css";

export const metadata: Metadata = {
  title: "Система здоровья начинается с воды — Coral Club",
  robots: { index: false, follow: false },
};

/** Главная магазина России: три фазы — Гидратация, Детокс, Баланс (см. components/ru/RuHome). */
export default function RuHomePage() {
  return (
    <div className={`appShell ${styles.home}`}>
      <RuHome />
    </div>
  );
}

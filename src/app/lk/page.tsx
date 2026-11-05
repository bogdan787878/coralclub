import Link from "next/link";

export default function LkHome() {
  return (
    <main style={{ padding: "48px 16px", fontFamily: "var(--font-sans)" }}>
      <h1>Личный кабинет</h1>
      <p>Корзина и оформление заказа в едином оформлении проекта.</p>
      <p>
        <Link href="/lk/cart/">Корзина</Link>
      </p>
      <p>
        <Link href="/lk/checkout/">Оформление заказа</Link>
      </p>
    </main>
  );
}

import type { Metadata } from "next";
import { AccountForm } from "@/components/account/AccountForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Create account — Coral Club",
  description: "Create a Coral Club account or sign in with email or phone.",
};

export default function AccountCreatePage() {
  return (
    <div className={styles.backdrop}>
      <main className={styles.screen}>
        <AccountForm />
      </main>
    </div>
  );
}

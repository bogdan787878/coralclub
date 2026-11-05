import type { Metadata } from "next";
import { RegistrationLab } from "@/components/lab/RegistrationLab";

/** Test stand for the shop's own registration (restApi/registration/new),
 *  used through the local proxy only. Not linked, kept out of search. */
export const metadata: Metadata = {
  title: "Регистрация — тестовый стенд",
  robots: { index: false, follow: false },
};

export default function RegistrationLabPage() {
  return <RegistrationLab />;
}

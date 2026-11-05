import type { Metadata } from "next";
import { SignInLab } from "@/components/lab/SignInLab";

/** A test stand for the sign-in form on a phone: real <input type="email">,
 *  real iOS keyboard. Not linked from anywhere, kept out of search. */
export const metadata: Metadata = {
  title: "Sign in — Coral Club (keyboard test)",
  robots: { index: false, follow: false },
};

export default function SignInLabPage() {
  return <SignInLab />;
}

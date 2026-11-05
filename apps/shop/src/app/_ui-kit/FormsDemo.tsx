"use client";

import { useState } from "react";
import {
  Consent,
  FloatInput,
  Loader,
  OptionCard,
  OptionCards,
  OptionInfo,
} from "@/components/ui";

/** UI kit showcase: form building blocks of the checkout (client side: they are controlled). */
export function FormsDemo() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Anna Meyer");
  const [method, setMethod] = useState("dhl");
  const [pay, setPay] = useState("card");
  const [terms, setTerms] = useState(false);
  const bad = email !== "" && !/\S+@\S+\.\S+/.test(email);
  return (
    <>
      <FloatInput
        label="Email"
        value={email}
        onChange={setEmail}
        type="email"
        error={bad}
        hint={bad ? "Check the address" : undefined}
      />
      <FloatInput label="Full name" value={name} onChange={setName} />
      <FloatInput label="Required, skipped" value="" onChange={() => {}} attention />
      <OptionCards label="Shipping method">
        {[
          ["dhl", "DHL", "2–3 days", "€4.00"],
          ["express", "DHL Express", "next day", "€8.00"],
        ].map(([id, title, days, price]) => (
          <OptionCard
            key={id}
            name="demo-shipping"
            checked={method === id}
            onChange={() => setMethod(id)}
            title={title}
            lines={
              <>
                <span>{days}</span>
                <span>{price}</span>
              </>
            }
          />
        ))}
      </OptionCards>
      <OptionCards label="Payment method">
        {[
          ["card", "Credit or debit card"],
          ["transfer", "Bank transfer"],
        ].map(([id, title]) => (
          <OptionCard
            key={id}
            name="demo-payment"
            checked={pay === id}
            onChange={() => setPay(id)}
            title={title}
            footer={<span />}
          />
        ))}
      </OptionCards>
      <OptionInfo title="Standard delivery" detail="3–5 days" aside="Free" good />
      <Consent checked={terms} onChange={setTerms} name="demo-terms">
        I accept the terms and conditions
      </Consent>
      <Loader>Calculating…</Loader>
    </>
  );
}

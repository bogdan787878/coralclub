"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { PriceSelector } from "./PriceSelector";

export type BuyBoxOption = {
  id: string;
  label: string;
  note?: string;
  price: string;
  cta: { label: string; href: string };
};

export type BuyBoxProps = {
  options: BuyBoxOption[];
};

/**
 * BuyBox — the price selector plus the primary action. The action follows
 * the selected tier: the member price adds to bag, the regular price prompts
 * sign-up.
 */
export function BuyBox({ options }: BuyBoxProps) {
  const [selectedId, setSelectedId] = useState(options[0]?.id);
  const selected = options.find((o) => o.id === selectedId) ?? options[0];

  return (
    <>
      <PriceSelector
        options={options}
        value={selectedId}
        onChange={setSelectedId}
      />
      <Button variant="primary" block href={selected.cta.href}>
        {selected.cta.label}
      </Button>
    </>
  );
}

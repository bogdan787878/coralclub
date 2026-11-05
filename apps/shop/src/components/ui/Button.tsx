import type { ComponentProps } from "react";
import Link from "next/link";
import { Button as UiButton } from "@coral/ui";

/** Кнопка UI kit, внутренние ссылки которой идут через next/link. */
export function Button(props: ComponentProps<typeof UiButton>) {
  return <UiButton linkAs={Link} {...props} />;
}

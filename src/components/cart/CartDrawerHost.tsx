"use client";

import { useEffect, useState } from "react";
import { onCartOpen } from "@/lib/cart";
import { CartDrawer } from "./CartDrawer";

/**
 * CartDrawerHost — mounts the cart drawer and opens it on an `openCart()`
 * request, without rendering any trigger of its own. Use on pages that have
 * no header cart icon but still need the drawer (e.g. the PDP, whose buy
 * bar has a "Cart" button).
 */
export function CartDrawerHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => onCartOpen(() => setOpen(true)), []);

  return <CartDrawer open={open} onClose={() => setOpen(false)} />;
}

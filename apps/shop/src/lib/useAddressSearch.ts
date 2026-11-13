/**
 * Address search as a reactive value: on as soon as a key is known. On the
 * shop's own domain the key is in the build; elsewhere (GitHub Pages,
 * localhost) it is asked from the checkout gateway the moment a checkout page
 * opens, and the field becomes a search line when it arrives.
 */
import { useEffect, useState } from "react";
import {
  addressSearchEnabled,
  loadPlacesKeyFromGateway,
  onPlacesKeyChanged,
} from "./addressSearch";
import { gatewayUrl } from "./lk/config";
import { onShopDomain } from "./shopApi";

export function useAddressSearchEnabled(): boolean {
  const [on, setOn] = useState(addressSearchEnabled);
  useEffect(() => {
    if (addressSearchEnabled()) return;
    // off the shop's domain the checkout gateway keeps the Places key for us
    if (!onShopDomain()) void loadPlacesKeyFromGateway(gatewayUrl());
    return onPlacesKeyChanged(() => setOn(addressSearchEnabled()));
  }, []);
  return on;
}

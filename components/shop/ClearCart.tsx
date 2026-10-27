"use client";

import { useEffect } from "react";
import { clearShopCart } from "./ShopClient";

/** BL-084 — on the success page: the order is paid, so the browser's cart is emptied. */
export default function ClearCart() {
  useEffect(() => clearShopCart(), []);
  return null;
}

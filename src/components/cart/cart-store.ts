"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string;
  image?: string;
  price: number;
  qty: number;
};

const KEY = "ll_cart_v1";
const MAX_QTY = 5;
const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    items = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function commit(next: CartItem[]) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* private mode – giỏ hàng chỉ sống trong phiên */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const cart = {
  add(item: Omit<CartItem, "qty">, qty = 1) {
    load();
    const existing = items.find((i) => i.variantId === item.variantId);
    commit(
      existing
        ? items.map((i) => (i.variantId === item.variantId ? { ...i, ...item, qty: Math.min(MAX_QTY, i.qty + qty) } : i))
        : [...items, { ...item, qty: Math.min(MAX_QTY, qty) }],
    );
  },
  setQty(variantId: string, qty: number) {
    load();
    if (qty <= 0) return cart.remove(variantId);
    commit(items.map((i) => (i.variantId === variantId ? { ...i, qty: Math.min(MAX_QTY, qty) } : i)));
  },
  /** Đồng bộ giá/tên mới nhất từ server. */
  sync(fresh: Pick<CartItem, "variantId" | "price" | "name" | "variantName">[], removed: string[]) {
    load();
    commit(
      items
        .filter((i) => !removed.includes(i.variantId))
        .map((i) => {
          const f = fresh.find((x) => x.variantId === i.variantId);
          return f ? { ...i, ...f } : i;
        }),
    );
  },
  remove(variantId: string) {
    load();
    commit(items.filter((i) => i.variantId !== variantId));
  },
  clear() {
    commit(EMPTY);
  },
};

export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return items;
    },
    () => EMPTY,
  );
}

export const cartCount = (list: CartItem[]) => list.reduce((s, i) => s + i.qty, 0);
export const cartTotal = (list: CartItem[]) => list.reduce((s, i) => s + i.qty * i.price, 0);

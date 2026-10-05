"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary">
      <Printer size={16} /> In / Lưu PDF
    </button>
  );
}

import type { ReactNode } from "react";
import { ProductShell } from "@/components/shared/product-shell";

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return (
    <ProductShell active="business" workspace="business" childHasMain>
      {children}
    </ProductShell>
  );
}

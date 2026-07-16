"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const productEase = [0.16, 1, 0.3, 1] as const;

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false} mode="sync">
      <motion.div
        key={pathname}
        initial={
          shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 0, y: 6, filter: "blur(3px)" }
        }
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={
          shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 0, y: -3, filter: "blur(2px)" }
        }
        transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: productEase }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

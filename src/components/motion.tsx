import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const ease = [0.22, 1, 0.36, 1] as const;

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <motion.header
      initial="hidden"
      animate="show"
      variants={stagger}
      className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </motion.p>
        )}
        <motion.h1 variants={fadeUp} className="mt-2 font-display text-4xl leading-[1.05] text-foreground md:text-5xl">
          {title}
        </motion.h1>
        {description && (
          <motion.p variants={fadeUp} className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </motion.p>
        )}
      </div>
      {children && <motion.div variants={fadeUp}>{children}</motion.div>}
    </motion.header>
  );
}

export function DemoBadge({ label = "Demo data" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-match-b bg-card/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-match-ink">
      <span className="size-1.5 rounded-full bg-match-ink/60" />
      {label}
    </span>
  );
}

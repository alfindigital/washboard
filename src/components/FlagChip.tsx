import type { FundingFlag, GapFlag } from "@/types";
import { flagClass, fundLabel, gapLabel } from "@/lib/ui";

export function GapChip({ flag }: { flag: GapFlag }) {
  const label = flag.exclClass ? `${gapLabel(flag)} · ${flag.exclClass}` : gapLabel(flag);
  return <span className={flagClass(flag.level)} title={flag.falsifier}>{label}</span>;
}

export function FundChip({ flag }: { flag: FundingFlag }) {
  return <span className={flagClass(flag.level)} title={flag.falsifier}>{fundLabel(flag)}</span>;
}

export function DualMark() {
  return (
    <span className="flag flag-danger" title="flagged by both lenses — turnover anomaly and price-vs-participation">
      dual
    </span>
  );
}

'use client';

import { CountdownChip } from '@/components/ui/CountdownChip';
import { usePoolContext } from '@/contexts/PoolContext';

/**
 * Deadline + this section's info buttons, rendered at the top of the
 * section's own content.
 *
 * These used to be teleported into a chrome strip below the Topbar via
 * NavCenterContext, alongside the pool name. The name is now in the
 * Sidebar's ScopeSwitcher, and the rest is page content — it describes
 * what you are looking at, not where you are — so it renders in place
 * instead of being lifted into the shell.
 */
export function PoolSectionHeader({ actions }: Readonly<{ actions?: React.ReactNode }>) {
  const { poolDeadline } = usePoolContext();

  return (
    <div className="pool-section-header">
      <CountdownChip deadline={poolDeadline} />
      {actions ? <div className="pool-section-header-actions">{actions}</div> : null}
    </div>
  );
}

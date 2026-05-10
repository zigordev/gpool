'use client';

import { BracketVisualization } from '@/components/BracketVisualization';
import { useAdminContext } from '@/contexts/AdminContext';

export default function AdminFinalPage() {
  const {
    bracket,
    teams,
    poolId,
    updatingMatch,
    handleUpdateTeam,
    handleSaveBracketResult,
    bracketResults,
    submittingBracketResult,
  } = useAdminContext();

  return (
    <div className="content-panel">
      <BracketVisualization
        bracket={bracket}
        teams={teams}
        poolId={poolId}
        mode="admin"
        updatingMatch={updatingMatch}
        onUpdateTeam={handleUpdateTeam}
        onUpdateResult={handleSaveBracketResult}
        bracketResults={bracketResults}
        submittingResult={submittingBracketResult}
      />
    </div>
  );
}

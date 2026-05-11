'use client';

import { useMemo, useState } from 'react';
import { BracketVisualization } from '@/components/BracketVisualization';
import { useAdminContext } from '@/contexts/AdminContext';
import { computeAdminCandidateOptions } from '@/lib/bracket-projection';

export default function AdminFinalPage() {
  const {
    bracket,
    teams,
    poolId,
    updatingMatch,
    handleUpdateTeam,
    handleSaveBracketResult,
    handleReEvaluateBracket,
    bracketResults,
    submittingBracketResult,
  } = useAdminContext();
  const [reEvaluating, setReEvaluating] = useState(false);
  const adminCandidateOptions = useMemo(
    () => computeAdminCandidateOptions(bracket, teams),
    [bracket, teams],
  );

  const onReEvaluate = async () => {
    setReEvaluating(true);
    try { await handleReEvaluateBracket(); } finally { setReEvaluating(false); }
  };

  return (
    <div className="content-panel">
      <section className="surface" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={onReEvaluate}
            disabled={reEvaluating || !poolId || poolId === 'all-pools'}
          >
            {reEvaluating ? 'Re-evaluating…' : 'Re-evaluate predictions'}
          </button>
        </div>
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
          candidateOptions={adminCandidateOptions}
        />
      </section>
    </div>
  );
}

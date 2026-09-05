'use client';

import { useState } from 'react';

import { Button as DsButton } from 'design-system/components/core/Button.jsx';
import { StatTile as DsStatTile } from 'design-system/components/data-display/StatTile.jsx';
import { PageHeader } from 'design-system/components/data-display/PageHeader.jsx';
import { Badge as DsBadge } from 'design-system/components/feedback/Badge.jsx';
import { Icon } from 'design-system/components/icons/Icon.jsx';
import { Table } from 'design-system/components/data-display/Table.jsx';
import { Field } from 'design-system/components/forms/Field.jsx';
import { DateField } from 'design-system/components/forms/DateField.jsx';

import { Section } from 'design-system/components/data-display/Section.jsx';
import { Modal } from 'design-system/components/overlay/Modal.jsx';
import { RankTable } from '@/components/pool/RankTable';
import { PlayerStatsTable } from '@/components/pool/PlayerStatsTable';

export function PreviewGallery() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <main className="container-app" style={{ padding: 24 }}>
      <PageHeader
        eyebrow="Dev only"
        title="Design system preview"
        description="Shared primitives beside gpool's own, in gpool's theme. Use the theme toggle to check dark and light."
      />

      {/* Button converged: gpool's implementation is gone, its loading and
          icon slots now live in the design system. One row, not a pair. */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Button — converged</h2>
        <p style={{ margin: '0 0 12px', fontSize: '.8rem', color: 'rgb(var(--fg-muted))' }}>
          One implementation. gpool&apos;s loading and icon slots were promoted into the design system.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: 16, border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)' }}>
          <DsButton variant="primary">Primary</DsButton>
          <DsButton variant="secondary">Secondary</DsButton>
          <DsButton variant="outline">Outline</DsButton>
          <DsButton variant="ghost">Ghost</DsButton>
          <DsButton variant="danger">Danger</DsButton>
          <DsButton variant="primary" loading>Saving</DsButton>
          <DsButton variant="outline" leadingIcon={<Icon name="plus" size={14} />}>Leading</DsButton>
          <DsButton variant="outline" trailingIcon={<Icon name="chevron-right" size={14} />}>Trailing</DsButton>
          <DsButton variant="ghost" size="icon" aria-label="Settings"><Icon name="settings" /></DsButton>
          <DsButton variant="outline" size="sm">Small</DsButton>
        </div>
      </section>

      <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Badge</h2>
      <p style={{ margin: '0 0 12px', fontSize: '.8rem', color: 'rgb(var(--fg-muted))' }}>
        One implementation. gpool&apos;s brand-named variants (pitch, sunset, gold, live) are gone;
        the semantic ones say what the badge means rather than what colour it is.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: 16, border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', marginBottom: 28 }}>
        <DsBadge>Neutral</DsBadge>
        <DsBadge variant="accent">Accent</DsBadge>
        <DsBadge variant="success" dot>Success</DsBadge>
        <DsBadge variant="warning" leadingIcon={<Icon name="clock" size={11} />}>2d 4h</DsBadge>
        <DsBadge variant="danger">Danger</DsBadge>
        <DsBadge variant="info">Info</DsBadge>
      </div>

      <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>StatTile</h2>
      <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
        <DsStatTile label="Members" value={12} hint="3 admins" icon={<Icon name="users" size={13} />} />
        <DsStatTile tone="accent" label="Jackpot" value="€1,240" hint="Draw 12 Jun" />
        <DsStatTile tone="accent" valueTone="danger" label="Balance" value="-€310" hint="valueTone: danger" />
      </div>

      <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Modal — promoted from gpool</h2>
      <p style={{ margin: '0 0 12px', fontSize: '.8rem', color: 'rgb(var(--fg-muted))' }}>
        Portalled, focus-trapped, Esc-closable, restores focus, locks body scroll. The design
        system&apos;s previous one did none of it.
      </p>
      <div style={{ marginBottom: 28 }}>
        <DsButton variant="outline" onClick={() => setModalOpen(true)}>Open modal</DsButton>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Delete pool?"
          description="This cannot be undone."
          size="sm"
          footer={<>
            <DsButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</DsButton>
            <DsButton variant="danger" onClick={() => setModalOpen(false)}>Delete</DsButton>
          </>}
        >
          <p style={{ margin: 0, fontSize: '.875rem', color: 'rgb(var(--fg-muted))' }}>
            Tab is trapped inside; Esc closes; focus returns to the button that opened it.
          </p>
        </Modal>
      </div>

      <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Section — promoted from gpool</h2>
      <p style={{ margin: '0 0 12px', fontSize: '.8rem', color: 'rgb(var(--fg-muted))' }}>
        Eight gpool screens used this; kini and the operator console each approximate it. The
        collapsible header is a real button with aria-expanded and aria-controls.
      </p>
      <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
        <Section eyebrow="Group phase" title="Standings" description="Updated as results are entered."
                 trailing={<DsBadge>12 teams</DsBadge>} collapsible>
          <p style={{ margin: 0, fontSize: '.85rem', color: 'rgb(var(--fg-muted))' }}>Collapsible body.</p>
        </Section>
        <Section tone="subtle" density="compact" title="Compact, subtle tone">
          <p style={{ margin: 0, fontSize: '.85rem', color: 'rgb(var(--fg-muted))' }}>For nesting inside a card.</p>
        </Section>
      </div>

      <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Table + DateField</h2>
      <p style={{ margin: '0 0 12px', fontSize: '.8rem', color: 'rgb(var(--fg-muted))' }}>
        Table is presentational only — gpool&apos;s existing .data-table convention, lifted into
        the design system. Sorting and pagination stay with whatever engine a screen uses.
      </p>
      <div style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
        <Field label="Deadline" hint="Native control, styled to match Input.">
          <DateField type="datetime-local" defaultValue="2026-06-11T20:00" />
        </Field>
        <Table caption="Standings" maxHeight={220} density="compact">
          <thead>
            <tr><th>#</th><th>Team</th><th className="ds-table-num">Played</th><th className="ds-table-num">Points</th></tr>
          </thead>
          <tbody>
            {[['1','Spain',3,9],['2','Brazil',3,6],['3','Japan',3,4],['4','Canada',3,0]].map((r) => (
              <tr key={r[0] as string}>
                <td>{r[0]}</td><td>{r[1]}</td>
                <td className="ds-table-num">{r[2]}</td>
                <td className="ds-table-num">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>RankTable — on the shared Table</h2>
      <p style={{ margin: '0 0 12px', fontSize: '.8rem', color: 'rgb(var(--fg-muted))' }}>
        The real component with fixture rows. Its frozen identity column and display-face numbers
        are its own; everything else now comes from the design system.
      </p>
      <div style={{ marginBottom: 28 }}>
        <RankTable
          spyEnabled
          currentUserId="u2"
          onSpy={() => {}}
          ranking={[
            { rank: 1, userId: 'u1', userName: 'Ana Torres', groupPhasePoints: 41, finalPhasePoints: 18, playerPoints: 9, movement: { previousRank: 3, delta: 2, matchdayPoints: 12 } },
            { rank: 2, userId: 'u2', userName: 'You', groupPhasePoints: 39, finalPhasePoints: 18, playerPoints: 7 },
            { rank: 3, userId: 'u3', userName: 'Marc Villalonga Puig', groupPhasePoints: 38, finalPhasePoints: 12, playerPoints: 11, movement: { previousRank: 2, delta: -1, matchdayPoints: 3 } },
          ]}
        />
      </div>

      <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>PlayerStatsTable — caption + footer slots</h2>
      <p style={{ margin: '0 0 12px', fontSize: '.8rem', color: 'rgb(var(--fg-muted))' }}>
        The filter strip and the pagination strip are the Table&apos;s caption and footer, so they
        sit inside the frame. Its two-row sticky header and frozen name column stay its own.
      </p>
      <div style={{ marginBottom: 28 }}>
        <PlayerStatsTable
          toolbar={<DsButton variant="outline" size="sm" leadingIcon={<Icon name="search" size={13} />}>Filter players</DsButton>}
          goldenBootPlayerIds={['p1']}
          tournamentMvpPlayerId="p1"
          computeTotal={(p) => p.totalPoints ?? 0}
          t={(key) => key.split('.').pop() ?? key}
          players={[
            { playerId: 'p1', teamId: 't1', teamName: 'Spain', name: 'Lamine Yamal', position: 'forward', goals: 4, assists: 2, mvps: 1, totalPoints: 31 },
            { playerId: 'p2', teamId: 't2', teamName: 'Brazil', name: 'Vinícius Júnior', position: 'forward', goals: 3, assists: 3, totalPoints: 27, teamEliminated: true },
          ]}
        />
      </div>

    </main>
  );
}

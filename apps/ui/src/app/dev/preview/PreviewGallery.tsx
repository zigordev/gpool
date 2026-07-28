'use client';

import { Button as DsButton } from '../../../../design-system/components/core/Button.jsx';
import { StatTile as DsStatTile } from '../../../../design-system/components/data-display/StatTile.jsx';
import { PageHeader } from '../../../../design-system/components/data-display/PageHeader.jsx';
import { Badge as DsBadge } from '../../../../design-system/components/feedback/Badge.jsx';
import { Icon } from '../../../../design-system/components/icons/Icon.jsx';

import { Button as GpButton } from '@/components/ui/Button';
import { Badge as GpBadge } from '@/components/ui/Badge';
import { StatTile as GpStatTile } from '@/components/ui/StatTile';
import { EmptyState as GpEmptyState } from '@/components/ui/EmptyState';

function Pair({ title, note, ds, gp }: { title: string; note?: string; ds: React.ReactNode; gp: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{title}</h2>
      {note ? <p style={{ margin: '0 0 12px', fontSize: '.8rem', color: 'rgb(var(--fg-muted))' }}>{note}</p> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div style={{ padding: 16, border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)' }}>
          <p style={{ margin: '0 0 10px', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))' }}>Design system</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>{ds}</div>
        </div>
        <div style={{ padding: 16, border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)' }}>
          <p style={{ margin: '0 0 10px', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))' }}>gpool today</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>{gp}</div>
        </div>
      </div>
    </section>
  );
}

export function PreviewGallery() {
  return (
    <main className="container-app" style={{ padding: '24px 0 64px' }}>
      <PageHeader
        eyebrow="Dev only"
        title="Design system preview"
        description="Shared primitives beside gpool's own, in gpool's theme. Use the theme toggle to check dark and light."
      />

      <Pair
        title="Button — variants"
        note="gpool adds a gradient `solid` variant; the design system has `secondary` instead."
        ds={<>
          <DsButton variant="primary">Primary</DsButton>
          <DsButton variant="secondary">Secondary</DsButton>
          <DsButton variant="outline">Outline</DsButton>
          <DsButton variant="ghost">Ghost</DsButton>
          <DsButton variant="danger">Danger</DsButton>
        </>}
        gp={<>
          <GpButton variant="primary">Primary</GpButton>
          <GpButton variant="solid">Solid</GpButton>
          <GpButton variant="outline">Outline</GpButton>
          <GpButton variant="ghost">Ghost</GpButton>
          <GpButton variant="danger">Danger</GpButton>
        </>}
      />

      <Pair
        title="Button — loading and icons"
        note="Ported up from gpool into the design system; both should now behave the same."
        ds={<>
          <DsButton variant="primary" loading>Saving</DsButton>
          <DsButton variant="outline" leadingIcon={<Icon name="plus" size={14} />}>Leading</DsButton>
          <DsButton variant="outline" trailingIcon={<Icon name="chevron-right" size={14} />}>Trailing</DsButton>
          <DsButton variant="primary" size="icon" aria-label="Settings"><Icon name="settings" /></DsButton>
        </>}
        gp={<>
          <GpButton variant="primary" loading>Saving</GpButton>
          <GpButton variant="outline" leadingIcon={<Icon name="plus" size={14} />}>Leading</GpButton>
          <GpButton variant="outline" trailingIcon={<Icon name="chevron-right" size={14} />}>Trailing</GpButton>
          <GpButton variant="primary" iconOnly aria-label="Settings"><Icon name="settings" /></GpButton>
        </>}
      />

      <Pair
        title="Badge"
        note="gpool's variants are brand-semantic (pitch, sunset, gold, live); the design system's are generic."
        ds={<>
          <DsBadge>Neutral</DsBadge>
          <DsBadge variant="accent">Accent</DsBadge>
          <DsBadge variant="success" dot>Success</DsBadge>
          <DsBadge variant="warning">Warning</DsBadge>
          <DsBadge variant="danger">Danger</DsBadge>
          <DsBadge variant="info">Info</DsBadge>
        </>}
        gp={<>
          <GpBadge>Neutral</GpBadge>
          <GpBadge variant="pitch">Pitch</GpBadge>
          <GpBadge variant="sunset">Sunset</GpBadge>
          <GpBadge variant="gold">Gold</GpBadge>
          <GpBadge variant="live">Live</GpBadge>
          <GpBadge variant="info">Info</GpBadge>
        </>}
      />

      <Pair
        title="StatTile"
        note="gpool uses a gradient accent treatment; the design system tones the border, and can tone the value."
        ds={<div style={{ display: 'grid', gap: 10, width: '100%' }}>
          <DsStatTile label="Members" value={12} hint="3 admins" icon={<Icon name="users" size={13} />} />
          <DsStatTile tone="accent" label="Jackpot" value="€1,240" hint="Draw 12 Jun" />
          <DsStatTile tone="accent" valueTone="danger" label="Balance" value="-€310" hint="valueTone: danger" />
        </div>}
        gp={<div style={{ display: 'grid', gap: 10, width: '100%' }}>
          <GpStatTile label="Members" value={12} hint="3 admins" icon={<Icon name="users" size={13} />} />
          <GpStatTile emphasis="accent" label="Jackpot" value="€1,240" hint="Draw 12 Jun" />
          <GpStatTile label="Balance" value="-€310" hint="no value toning" />
        </div>}
      />

      <h2 style={{ margin: '0 0 4px', fontSize: '1rem' }}>EmptyState — gpool only</h2>
      <p style={{ margin: '0 0 12px', fontSize: '.8rem', color: 'rgb(var(--fg-muted))' }}>
        Bespoke illustrations (pitch line-drawing, referee whistle). Deliberately not replaced by the
        design system&apos;s generic circle — this is a real design asset, not duplication.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <GpEmptyState variant="pitch" title="No pools yet" description="Create the first pool to get started." />
        <GpEmptyState variant="whistle" title="No results" description="Nothing matches these filters." />
      </div>
    </main>
  );
}

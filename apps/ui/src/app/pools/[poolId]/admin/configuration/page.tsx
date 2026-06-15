'use client';

import { useState, type ComponentType } from 'react';
import { useI18n } from '@/i18n/client';
import { useAdminContext } from '@/contexts/AdminContext';
import AdminRankingPage from '@/app/pools/[poolId]/admin/ranking/page';
import AdminGroupsPage from '@/app/pools/[poolId]/admin/groups/page';
import AdminFinalPage from '@/app/pools/[poolId]/admin/final/page';
import AdminPlayersPage from '@/app/pools/[poolId]/admin/players/page';
import { Badge } from '@/components/ui/Badge';
import { BsFillDiagram3Fill } from 'react-icons/bs';
import { FaLayerGroup } from 'react-icons/fa6';
import { GiSoccerKick } from 'react-icons/gi';
import { IoSettings } from 'react-icons/io5';

type ConfigurationTab = 'general' | 'groups' | 'final' | 'players';

export default function AdminConfigurationPage() {
  const { t } = useI18n();
  const {
    poolName,
    savingConfig,
    prizeTotalInvalid,
    groupConfigMissingCount,
    finalConfigMissingCount,
    playersConfigMissingCount,
  } = useAdminContext();
  const [activeTab, setActiveTab] = useState<ConfigurationTab>('general');

  const tabs: Array<{
    key: ConfigurationTab;
    label: string;
    shortLabel: string;
    icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
    missingCount?: number;
  }> = [
    {
      key: 'general',
      label: t('adminResults.tabs.general'),
      shortLabel: t('adminResults.tabs.short.general'),
      icon: IoSettings,
    },
    {
      key: 'groups',
      label: t('adminResults.tabs.groupPhase'),
      shortLabel: t('adminResults.tabs.short.groupPhase'),
      icon: FaLayerGroup,
      missingCount: groupConfigMissingCount,
    },
    {
      key: 'final',
      label: t('adminResults.tabs.finalPhase'),
      shortLabel: t('adminResults.tabs.short.finalPhase'),
      icon: BsFillDiagram3Fill,
      missingCount: finalConfigMissingCount,
    },
    {
      key: 'players',
      label: t('adminResults.tabs.players'),
      shortLabel: t('adminResults.tabs.short.players'),
      icon: GiSoccerKick,
      missingCount: playersConfigMissingCount,
    },
  ];

  return (
    <div className="configuration-workspace">
      <header className="configuration-heading">
        <span className="configuration-heading-icon" aria-hidden>
          <IoSettings size={20} />
        </span>
        <div style={{ minWidth: 0 }}>
          <p className="eyebrow" style={{ margin: 0 }}>
            {t('adminResults.tabs.configuration')}
          </p>
          <h1 className="configuration-title">
            {t('adminResults.configurationFor', { poolName: poolName || '…' })}
          </h1>
        </div>
        <span
          className="configuration-save-state"
          role="status"
          style={{ color: prizeTotalInvalid ? 'rgb(var(--live))' : undefined }}
        >
          {savingConfig
            ? t('adminResults.scoring.savingAuto')
            : prizeTotalInvalid
              ? t('adminResults.scoring.notSavedInvalid')
              : t('adminResults.scoring.savedAuto')}
        </span>
      </header>

      <nav
        className="configuration-tabs"
        role="tablist"
        aria-label={t('adminResults.tabs.label')}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`configuration-tab${active ? ' configuration-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={14} aria-hidden />
              <span className="configuration-tab-label">{tab.label}</span>
              <span className="configuration-tab-label-short">{tab.shortLabel}</span>
              {tab.missingCount ? (
                <Badge
                  variant="sunset"
                  title={t('adminResults.tabs.missingConfigCount', { count: tab.missingCount })}
                  aria-label={t('adminResults.tabs.missingConfigCount', { count: tab.missingCount })}
                >
                  {tab.missingCount}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </nav>

      <section
        className="configuration-tab-content"
        role="tabpanel"
        aria-label={tabs.find((tab) => tab.key === activeTab)?.label}
      >
        {activeTab === 'general' ? <AdminRankingPage /> : null}
        {activeTab === 'groups' ? <AdminGroupsPage /> : null}
        {activeTab === 'final' ? <AdminFinalPage /> : null}
        {activeTab === 'players' ? <AdminPlayersPage /> : null}
      </section>
    </div>
  );
}

import type { StylesConfig } from 'react-select';

const C = {
  inputBg:   'rgb(var(--input-bg))',
  bgElevated: 'rgb(var(--bg-elevated))',
  bgSubtle:  'rgb(var(--bg-subtle))',
  border:    'rgb(var(--border))',
  fg:        'rgb(var(--fg))',
  fgMuted:   'rgb(var(--fg-muted))',
  pitch:     'rgb(var(--pitch))',
};

export function selectStyles<Option = unknown, IsMulti extends boolean = false>(
  overrides?: StylesConfig<Option, IsMulti>,
): StylesConfig<Option, IsMulti> {
  return {
    control: (base) => ({
      ...base,
      backgroundColor: C.inputBg,
      borderColor: C.border,
      boxShadow: 'none',
      '&:hover': { borderColor: C.pitch },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: C.bgElevated,
      border: `1px solid ${C.border}`,
      boxShadow: '0 4px 14px rgb(0 0 0 / 0.15)',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? `rgb(var(--pitch) / 0.15)`
        : state.isFocused
        ? C.bgSubtle
        : C.bgElevated,
      color: C.fg,
      '&:active': { backgroundColor: C.bgSubtle },
    }),
    singleValue: (base) => ({ ...base, color: C.fg }),
    input: (base) => ({ ...base, color: C.fg }),
    placeholder: (base) => ({ ...base, color: C.fgMuted }),
    ...overrides,
  };
}

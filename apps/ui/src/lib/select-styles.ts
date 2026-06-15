import type { StylesConfig, GroupBase } from 'react-select';

const C = {
  inputBg:   'rgb(var(--input-bg))',
  disabledBg: 'rgb(var(--disabled-bg))',
  bgElevated: 'rgb(var(--bg-elevated))',
  bgSubtle:  'rgb(var(--bg-subtle))',
  border:    'rgb(var(--border))',
  controlBorder: 'rgb(var(--control-border))',
  disabledBorder: 'rgb(var(--disabled-border))',
  fg:        'rgb(var(--fg))',
  fgMuted:   'rgb(var(--fg-muted))',
  pitch:     'rgb(var(--pitch))',
};

type AnyStyles = StylesConfig<unknown, boolean, GroupBase<unknown>>;

function applyControl(base: object, state: { isFocused: boolean; isDisabled: boolean }): object {
  return {
    ...base,
    backgroundColor: state.isDisabled ? C.disabledBg : C.inputBg,
    borderColor: state.isDisabled
      ? C.disabledBorder
      : state.isFocused
      ? 'rgb(var(--accent-from))'
      : C.controlBorder,
    borderRadius: 'var(--radius-md)',
    minHeight: '2.5rem',
    boxShadow: state.isFocused ? '0 0 0 3px rgb(var(--accent-from) / 0.15)' : 'none',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    cursor: state.isDisabled ? 'not-allowed' : 'default',
    opacity: 1,
    '&:hover': {
      borderColor: state.isDisabled
        ? C.disabledBorder
        : state.isFocused
        ? 'rgb(var(--accent-from))'
        : 'rgb(var(--fg-subtle))',
    },
  };
}

export function selectStyles<Option = unknown, IsMulti extends boolean = false>(
  overrides?: StylesConfig<Option, IsMulti>,
): StylesConfig<Option, IsMulti> {
  const { control: controlOverride, ...restOverrides } = (overrides ?? {}) as AnyStyles;

  return {
    control: (base, state) => {
      const ours = applyControl(base, state);
      return controlOverride ? controlOverride(ours as never, state as never) : ours;
    },
    menu: (base) => ({
      ...base,
      backgroundColor: C.bgElevated,
      border: `1px solid ${C.border}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 4px 14px rgb(0 0 0 / 0.15)',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isDisabled
        ? C.bgElevated
        : state.isSelected
        ? `rgb(var(--pitch) / 0.15)`
        : state.isFocused
        ? C.bgSubtle
        : C.bgElevated,
      color: state.isDisabled ? C.fgMuted : C.fg,
      opacity: state.isDisabled ? 0.45 : 1,
      cursor: state.isDisabled ? 'not-allowed' : 'default',
      '&:active': { backgroundColor: state.isDisabled ? C.bgElevated : C.bgSubtle },
    }),
    singleValue: (base, state) => ({
      ...base,
      color: state.isDisabled ? C.fgMuted : C.fg,
    }),
    input: (base) => ({ ...base, color: C.fg }),
    placeholder: (base) => ({ ...base, color: C.fgMuted }),
    ...(restOverrides as StylesConfig<Option, IsMulti>),
  } as StylesConfig<Option, IsMulti>;
}

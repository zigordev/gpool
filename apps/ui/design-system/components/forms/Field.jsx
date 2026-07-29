import React from 'react';

/** Label + control + hint/error, with the label actually wired to the control.
 *
 * Association works by generating an id and cloning it onto a single element
 * child — skipped when the child already has an id, or when there are several
 * children, since which one the label refers to is ambiguous then (pass
 * `htmlFor` and set the id yourself in that case).
 *
 * Without this the label is decorative: clicking it focuses nothing, and a
 * screen reader announces the input as unlabelled.
 */
export function Field({ label, hint, error, required, htmlFor, children, className = '', style }) {
  // useId, not a module counter: a counter advances once per render on the
  // server and again on the client, so the two disagree and every Field
  // hydrates with a mismatched htmlFor/id pair.
  const generated = React.useId();
  const only = React.Children.count(children) === 1 ? React.Children.only(children) : null;
  const childId = React.isValidElement(only) ? only.props.id : undefined;
  const controlId = htmlFor ?? childId ?? (React.isValidElement(only) ? generated : undefined);

  const control =
    React.isValidElement(only) && !childId && !htmlFor
      ? React.cloneElement(only, { id: controlId })
      : children;

  const message = error ?? hint;
  const messageId = `${controlId ?? generated}-msg`;

  return (
    <div className={`ds-field ${className}`.trim()} style={{ display: 'grid', gap: 6, ...style }}>
      {label ? (
        <label
          htmlFor={controlId}
          style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 'var(--ds-weight-semibold)', color: 'var(--ds-color-fg)', fontFamily: 'var(--ds-font-sans)' }}
        >
          {label}
          {required ? <span style={{ color: 'var(--ds-color-danger)' }} aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
      {control}
      {message ? (
        <span
          id={messageId}
          role={error ? 'alert' : undefined}
          style={{ fontSize: 'var(--ds-text-xs)', color: error ? 'var(--ds-color-danger)' : 'var(--ds-color-fg-subtle)', fontFamily: 'var(--ds-font-sans)' }}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}

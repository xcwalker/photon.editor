import React from 'react'

export type DropdownOption<T = string> = {
  value: T
  label?: string
  disabled?: boolean
}

export function Dropdown<T = string>({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  width,
  style,
}: {
  value: T | undefined
  options: Array<DropdownOption<T>>
  onChange: (next: T) => void
  placeholder?: string
  disabled?: boolean
  width?: number | string
  style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'inline-flex', width: width ?? 'auto' }}>
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value as unknown as T)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid var(--secondary)',
          background: 'var(--primary)',
          color: 'var(--text)',
          outline: 'none',
          ...style,
        }}
      >
        {placeholder && (
          <option value="" disabled={true} hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt, i) => (
          <option key={`opt-${i}`} value={String(opt.value)} disabled={opt.disabled}>
            {opt.label ?? String(opt.value)}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Dropdown

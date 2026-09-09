'use client'

import { useState } from 'react'

/**
 * Password input with a show/hide toggle.
 *
 * Worth having on a phone: typing a long password blind on a small keyboard
 * is where people give up and reuse something weak instead.
 */
export function PasswordField({
  id = 'password',
  name = 'password',
  label = 'Password',
  autoComplete,
  minLength,
  hint,
}: {
  id?: string
  name?: string
  label?: string
  autoComplete?: string
  minLength?: number
  hint?: string
}) {
  const [shown, setShown] = useState(false)

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={shown ? 'text' : 'password'}
          className="field pr-14"
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />

        <button
          type="button"
          onClick={() => setShown((current) => !current)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-5 w-5"
          >
            {shown ? (
              // Struck-through eye: currently visible, tap to hide.
              <>
                <path d="M10.7 5.1A9.9 9.9 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-2.4 3.2M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                <path d="m2 2 20 20" />
              </>
            ) : (
              <>
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>

      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

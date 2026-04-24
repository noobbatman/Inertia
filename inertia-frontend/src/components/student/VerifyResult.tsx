import { useState } from 'react'
import type { VerifyResponse } from '../../types'
import { formatSeconds } from '../../utils/format'

export function VerifyResult({ result }: { result: VerifyResponse }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!result.jwt_token) return
    await navigator.clipboard.writeText(result.jwt_token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (result.success) {
    return (
      <div style={{ border: '2px solid var(--pass)', boxShadow: '4px 4px 0 var(--pass)', background: 'var(--paper)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--pass)', background: 'rgba(45,106,79,0.1)' }}>
          <div style={{ fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--pass)', fontWeight: 700 }}>
            ✓ Proof-of-Thought verified
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontStyle: 'italic', marginTop: 4 }}>
            Push proceeding.
          </div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>
            JWT token
          </div>
          <code style={{
            display: 'block', wordBreak: 'break-all',
            fontFamily: 'var(--ui)', fontSize: 11, lineHeight: 1.5,
            background: 'var(--ink)', color: 'var(--paper)',
            padding: '12px 14px', marginBottom: 10,
          }}>
            {result.jwt_token}
          </code>
          <button
            type="button"
            onClick={() => { void handleCopy() }}
            style={{
              border: '1px solid var(--ink)', background: copied ? 'var(--pass)' : 'var(--paper)',
              color: copied ? 'var(--paper)' : 'var(--ink)',
              padding: '6px 14px', fontFamily: 'var(--ui)', fontSize: 10,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
              transition: 'background .2s, color .2s',
            }}
          >
            {copied ? '✓ Copied' : 'Copy token'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ border: '2px solid var(--caution)', boxShadow: '4px 4px 0 var(--ink)', background: 'var(--paper)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--caution)', background: 'rgba(244,196,48,0.15)' }}>
        <div style={{ fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--caution-deep)', fontWeight: 700 }}>
          ✗ Verification failed
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', marginTop: 4 }}>
          {result.message}
        </div>
      </div>
      <div style={{ padding: '12px 16px', fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)' }}>
        {result.attempt_number && (
          <div>Attempt <strong>#{result.attempt_number}</strong></div>
        )}
        {result.lockout_seconds ? (
          <div style={{ marginTop: 4 }}>
            Reflection period: <strong style={{ color: 'var(--signal)' }}>{formatSeconds(result.lockout_seconds)}</strong>
          </div>
        ) : null}
      </div>
    </div>
  )
}

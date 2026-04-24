import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { auditDiff } from '../../api/audit'
import { requestPuzzle } from '../../api/puzzle'
import { verifyAnswer } from '../../api/verify'
import { AuditSummary } from '../../components/student/AuditSummary'
import { LockoutOverlay } from '../../components/student/LockoutOverlay'
import { PuzzleCard } from '../../components/student/PuzzleCard'
import { VerifyResult } from '../../components/student/VerifyResult'
import { useCountdown } from '../../hooks/useCountdown'
import type { AuditResponse, PuzzleResponse, VerifyResponse } from '../../types'
import { handleApiError, type HandledApiError } from '../../utils/error'

type StudentStep = 'idle' | 'audit' | 'puzzle' | 'verify'

interface RunAuditOptions {
  studentId?: string
  diff?: string
  autoStartPuzzle?: boolean
}

/* ── Reusable ink button ───────────────────────────────────── */
function InkButton({ onClick, disabled, children, variant = 'primary' }: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  variant?: 'primary' | 'ghost'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: '1px solid var(--ink)',
        background: disabled ? 'var(--paper-2)' : variant === 'primary' ? 'var(--ink)' : 'var(--paper)',
        color: disabled ? 'var(--ink-muted)' : variant === 'primary' ? 'var(--paper)' : 'var(--ink)',
        padding: '9px 18px', fontFamily: 'var(--ui)', fontSize: 11,
        letterSpacing: '0.12em', textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background .1s, transform .1s',
        opacity: disabled ? 0.55 : 1,
      }}
      onMouseEnter={e => {
        if (disabled) return
        const el = e.currentTarget as HTMLElement
        el.style.background = 'var(--caution)'
        el.style.color = 'var(--ink)'
        el.style.transform = 'translate(-2px,-2px)'
        el.style.boxShadow = '3px 3px 0 var(--ink)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = disabled ? 'var(--paper-2)' : variant === 'primary' ? 'var(--ink)' : 'var(--paper)'
        el.style.color = disabled ? 'var(--ink-muted)' : variant === 'primary' ? 'var(--paper)' : 'var(--ink)'
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
    >
      {children}
    </button>
  )
}

export function StudentPage() {
  const initialQuery = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      studentId: params.get('student_id') ?? '',
      diff: params.get('diff') ?? '',
    }
  }, [])

  const [studentId, setStudentId] = useState(initialQuery.studentId)
  const [diff, setDiff] = useState(initialQuery.diff)
  const [answer, setAnswer] = useState('')
  const [step, setStep] = useState<StudentStep>('idle')
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null)
  const [puzzleResult, setPuzzleResult] = useState<PuzzleResponse | null>(null)
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null)
  const [busyLabel, setBusyLabel] = useState<string | null>(null)
  const [proofOfIntent, setProofOfIntent] = useState('')
  const [intentSubmitted, setIntentSubmitted] = useState(false)
  const didAutoRunRef = useRef(false)

  const clearSession = useCallback(() => {
    setStep('idle')
    setAuditResult(null)
    setPuzzleResult(null)
    setVerifyResult(null)
    setAnswer('')
    setProofOfIntent('')
    setIntentSubmitted(false)
    setLockoutSeconds(null)
    setInlineError(null)
  }, [])

  const applyHandledError = useCallback(
    (handled: HandledApiError) => {
      setInlineError(handled.inlineMessage)
      setToastMessage(handled.toastMessage)
      if (handled.lockoutSeconds !== null) setLockoutSeconds(handled.lockoutSeconds)
      if (handled.shouldResetSession) clearSession()
    },
    [clearSession],
  )

  const runPuzzle = useCallback(async () => {
    if (!auditResult) { setInlineError('Audit required first.'); return }
    const sid = studentId.trim(), d = diff.trim()
    if (!sid || !d) { setInlineError('Student ID and diff are required.'); return }

    setBusyLabel('Generating puzzle…')
    setInlineError(null)
    setVerifyResult(null)
    try {
      const puzzle = await requestPuzzle(d, auditResult.complexity_score, auditResult.difficulty, sid)
      setPuzzleResult(puzzle)
      setAnswer('')
      setStep('puzzle')
      setLockoutSeconds(null)
    } catch (error) {
      applyHandledError(handleApiError(error))
      setStep('audit')
    } finally {
      setBusyLabel(null)
    }
  }, [applyHandledError, auditResult, diff, studentId])

  const runAudit = useCallback(async (options?: RunAuditOptions) => {
    const sid = (options?.studentId ?? studentId).trim()
    const d = (options?.diff ?? diff).trim()
    if (!sid || !d) { setInlineError('Student ID and diff are required.'); return }

    setBusyLabel('Analyzing diff…')
    setInlineError(null)
    setToastMessage(null)
    setVerifyResult(null)
    setPuzzleResult(null)
    setLockoutSeconds(null)
    setIntentSubmitted(false)

    try {
      const audit = await auditDiff(d, sid)
      setAuditResult(audit)
      setStep('audit')

      if (options?.autoStartPuzzle && audit.requires_puzzle) {
        setBusyLabel('Generating puzzle…')
        const puzzle = await requestPuzzle(d, audit.complexity_score, audit.difficulty, sid)
        setPuzzleResult(puzzle)
        setAnswer('')
        setStep('puzzle')
      }
    } catch (error) {
      applyHandledError(handleApiError(error))
    } finally {
      setBusyLabel(null)
    }
  }, [applyHandledError, diff, studentId])

  const runVerify = useCallback(async () => {
    if (!puzzleResult) { setInlineError('No puzzle available.'); return }
    const sid = studentId.trim(), a = answer.trim()
    if (!sid || !a) { setInlineError('Provide Student ID and answer.'); return }

    setBusyLabel('Verifying…')
    setInlineError(null)
    try {
      const verification = await verifyAnswer(puzzleResult.token_id, sid, a)
      setVerifyResult(verification)
      setStep('verify')
      if (!verification.success && verification.lockout_seconds !== null) {
        setLockoutSeconds(verification.lockout_seconds)
      }
    } catch (error) {
      const handled = handleApiError(error)
      applyHandledError(handled)
      if (handled.shouldResetSession) setStudentId('')
    } finally {
      setBusyLabel(null)
    }
  }, [answer, applyHandledError, puzzleResult, studentId])

  const handlePuzzleExpire = useCallback(() => {
    if (!puzzleResult) return
    setInlineError('Time ran out. Request another puzzle.')
    setPuzzleResult(null)
    setAnswer('')
    setStep('audit')
  }, [puzzleResult])

  const handleLockoutExpire = useCallback(() => {
    setLockoutSeconds(null)
    if (auditResult?.requires_puzzle) void runPuzzle()
  }, [auditResult?.requires_puzzle, runPuzzle])

  const puzzleSeconds = puzzleResult?.timer_seconds ?? 0
  const remainingPuzzleSeconds = useCountdown(puzzleSeconds, handlePuzzleExpire)

  useEffect(() => {
    if (didAutoRunRef.current) return
    if (initialQuery.studentId && initialQuery.diff) {
      didAutoRunRef.current = true
      void runAudit({ studentId: initialQuery.studentId, diff: initialQuery.diff, autoStartPuzzle: true })
    }
  }, [initialQuery.diff, initialQuery.studentId, runAudit])

  useEffect(() => {
    if (!toastMessage) return
    const id = window.setTimeout(() => setToastMessage(null), 6000)
    return () => window.clearTimeout(id)
  }, [toastMessage])

  const canRequestPuzzle = auditResult?.requires_puzzle &&
    (!auditResult.requires_proof_of_intent || intentSubmitted)

  return (
    <div className="paper-bg" style={{ minHeight: '100vh', fontFamily: 'var(--ui)' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', right: 20, top: 20, zIndex: 60,
          background: 'var(--ink)', color: 'var(--paper)',
          padding: '12px 18px', fontFamily: 'var(--ui)', fontSize: 12,
          border: '1px solid var(--ink)', boxShadow: '4px 4px 0 var(--signal)',
          maxWidth: 320,
        }}>
          {toastMessage}
        </div>
      )}

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 28px',
        background: 'rgba(244,240,230,0.95)', backdropFilter: 'blur(6px)',
        borderBottom: '1px solid var(--ink)',
        fontFamily: 'var(--ui)', fontSize: 11,
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic' }}>Inertia.edu</span>
          <span style={{ marginLeft: 10, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            / Student flow
          </span>
        </Link>
        <Link to="/dashboard" style={{
          textDecoration: 'none', color: 'var(--ink-muted)',
          fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
          border: '1px solid var(--paper-line)', padding: '5px 12px',
        }}>
          Dashboard →
        </Link>
      </nav>

      {/* Main */}
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Input card */}
        <div style={{ border: '1px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)', marginBottom: 20 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ink)', background: 'var(--paper-2)' }}>
            <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Checkpoint entry
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontStyle: 'italic', marginTop: 2 }}>
              Submit your diff
            </div>
          </div>
          <div style={{ padding: '18px', background: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6 }}>
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="alice.rahman"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  fontFamily: 'var(--ui)', fontSize: 13,
                  border: '1px solid var(--ink)', background: 'var(--paper)',
                  padding: '9px 12px', outline: 'none', color: 'var(--ink)',
                }}
                onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--caution)' }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6 }}>
                Git diff
              </label>
              <textarea
                value={diff}
                onChange={(e) => setDiff(e.target.value)}
                placeholder="Paste git diff content..."
                rows={7}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  fontFamily: 'var(--ui)', fontSize: 12, lineHeight: 1.6,
                  border: '1px solid var(--ink)', background: 'var(--paper)',
                  padding: '9px 12px', outline: 'none', resize: 'vertical', color: 'var(--ink)',
                }}
                onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--caution)' }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--paper-line)', background: 'var(--paper-2)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <InkButton onClick={() => { void runAudit() }} disabled={busyLabel !== null}>
              {busyLabel === 'Analyzing diff…' ? 'Analyzing…' : 'Run audit'}
            </InkButton>
            {auditResult?.requires_puzzle && (
              <InkButton
                onClick={() => { void runPuzzle() }}
                disabled={busyLabel !== null || !canRequestPuzzle}
                variant="ghost"
              >
                {busyLabel === 'Generating puzzle…' ? 'Generating…' : 'Request puzzle'}
              </InkButton>
            )}
            {step !== 'idle' && (
              <InkButton onClick={clearSession} disabled={false} variant="ghost">
                Clear session
              </InkButton>
            )}
          </div>
        </div>

        {/* Inline error */}
        {inlineError && (
          <div style={{
            border: '1px solid var(--signal)', background: 'rgba(215,64,44,0.08)',
            padding: '10px 14px', marginBottom: 16,
            fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--signal)',
          }}>
            {inlineError}
          </div>
        )}

        {/* Busy label */}
        {busyLabel && (
          <div style={{
            padding: '10px 14px', marginBottom: 16,
            fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--ink-muted)',
            borderLeft: '3px solid var(--caution)',
          }}>
            {busyLabel}
          </div>
        )}

        {/* Audit summary */}
        {auditResult && (
          <div style={{ marginBottom: 20 }}>
            <AuditSummary audit={auditResult} />
          </div>
        )}

        {/* Proof of Intent */}
        {auditResult?.requires_proof_of_intent && !intentSubmitted && (
          <div style={{
            border: '2px solid var(--caution)', boxShadow: '4px 4px 0 var(--ink)',
            marginBottom: 20,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--caution)', background: 'rgba(244,196,48,0.2)' }}>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--caution-deep)', fontWeight: 700, marginBottom: 4 }}>
                ■ Proof of intent required — {auditResult.line_delta}+ lines detected
              </div>
              <p style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', margin: 0 }}>
                This commit exceeds the diff threshold. Describe what problem this commit solves.
              </p>
            </div>
            <div style={{ padding: '16px', background: 'var(--paper)' }}>
              <label style={{ display: 'block', fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>
                What does this commit do?
              </label>
              <textarea
                value={proofOfIntent}
                onChange={(e) => setProofOfIntent(e.target.value)}
                rows={3}
                placeholder="Describe the problem this commit solves and how your code addresses it..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  fontFamily: 'var(--ui)', fontSize: 12, lineHeight: 1.6,
                  border: '1px solid var(--ink)', background: 'var(--paper)',
                  padding: '9px 12px', outline: 'none', resize: 'vertical', color: 'var(--ink)',
                }}
                onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--caution)' }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
              />
              {proofOfIntent.trim().length > 0 && proofOfIntent.trim().length < 20 && (
                <p style={{ fontFamily: 'var(--ui)', fontSize: 10, color: 'var(--caution-deep)', marginTop: 6 }}>
                  {20 - proofOfIntent.trim().length} more characters needed.
                </p>
              )}
              <div style={{ marginTop: 12 }}>
                <InkButton
                  onClick={() => setIntentSubmitted(true)}
                  disabled={proofOfIntent.trim().length < 20}
                >
                  Submit intent
                </InkButton>
              </div>
            </div>
          </div>
        )}

        {/* Intent submitted confirmation */}
        {auditResult?.requires_proof_of_intent && intentSubmitted && (
          <div style={{
            border: '1px solid var(--pass)', background: 'rgba(45,106,79,0.08)',
            padding: '10px 16px', marginBottom: 20,
            fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--pass)',
          }}>
            ✓ Intent submitted — you may now request a puzzle
          </div>
        )}

        {/* Puzzle card */}
        {puzzleResult && step === 'puzzle' && (
          <div style={{ marginBottom: 20 }}>
            <PuzzleCard
              puzzle={puzzleResult}
              answer={answer}
              onAnswerChange={setAnswer}
              onSubmit={() => { void runVerify() }}
              remainingSeconds={remainingPuzzleSeconds}
              disabled={busyLabel !== null}
            />
          </div>
        )}

        {/* Verify result */}
        {verifyResult && (
          <VerifyResult result={verifyResult} />
        )}
      </main>

      {/* Lockout overlay */}
      {lockoutSeconds !== null && lockoutSeconds > 0 && (
        <LockoutOverlay lockoutSeconds={lockoutSeconds} onExpire={handleLockoutExpire} />
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../../components/common/ThemeToggle'

/* ── Scroll-progress hook ─────────────────────────────────── */
function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      setProgress(max > 0 ? el.scrollTop / max : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return progress
}

/* ── Intersection observer for strike reveals ───────────── */
function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold: 0.3 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

/* ── Nav ──────────────────────────────────────────────────── */
function Nav() {
  return (
    <nav className="landing-nav" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 28px',
      background: 'rgba(244,240,230,0.92)', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--ink)',
      fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>
        <span style={{ fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontStyle: 'normal', color: 'var(--ink-muted)' }}>⬡</span>
        Inertia.edu
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link to="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '8px 14px',
          background: 'transparent', color: 'var(--ink)',
          textDecoration: 'none', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
          border: '1px solid var(--ink)',
          transition: 'background .15s, color .15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ink)'; (e.currentTarget as HTMLElement).style.color = 'var(--paper)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}
        >
          Dashboard
        </Link>
        <Link to="/student" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px',
          background: 'var(--ink)', color: 'var(--paper)',
          textDecoration: 'none', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
          border: '1px solid var(--ink)',
          transition: 'background .15s, color .15s, transform .15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--caution)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 var(--ink)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ink)'; (e.currentTarget as HTMLElement).style.color = 'var(--paper)'; (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
        >
          Student →
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  )
}

/* ── Hero terminal panel ─────────────────────────────────── */
type TSeg = { t: string; c: string }
type TLine = { id: number; segs: TSeg[] }

function TerminalPanel() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<TLine[]>([])
  const [started, setStarted] = useState(false)
  const aliveRef = useRef(false)
  const lineIdRef = useRef(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true) },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    aliveRef.current = true

    const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo))
    const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms))

    const addLine = (segs: TSeg[]) => {
      const id = lineIdRef.current++
      setLines(prev => {
        const next = [...prev, { id, segs }]
        return next.length > 18 ? next.slice(next.length - 18) : next
      })
    }

    const updateLast = (segs: TSeg[]) => {
      setLines(prev => {
        if (!prev.length) return prev
        const arr = [...prev]
        arr[arr.length - 1] = { ...arr[arr.length - 1], segs }
        return arr
      })
    }

    const PROMPT: TSeg[] = [{ t: '$ ', c: '#e6c66a' }]

    const typeCmd = async (cmd: string) => {
      addLine([...PROMPT, { t: '', c: '#e4dfcf' }])
      for (let i = 1; i <= cmd.length; i++) {
        if (!aliveRef.current) return
        updateLast([...PROMPT, { t: cmd.slice(0, i), c: '#e4dfcf' }])
        await sleep(rnd(28, 78))
      }
      await sleep(130)
    }

    const out = (segs: TSeg[]) => {
      if (!aliveRef.current) return
      addLine(segs)
    }

    const countdownLine = async (from: number, to: number, tickMs: number) => {
      const mk = (n: number): TSeg[] => [
        { t: '[INERTIA] Waiting... ', c: '#6a6555' },
        { t: String(n), c: '#f4c430' },
        { t: 's remaining', c: '#6a6555' },
      ]
      addLine(mk(from))
      for (let n = from - 1; n >= to; n--) {
        if (!aliveRef.current) return
        await sleep(tickMs)
        updateLast(mk(n))
      }
    }

    async function runSequence() {
      await typeCmd('inertia init')
      if (!aliveRef.current) return
      out([{ t: 'Enter join code: R3L9MR', c: '#e4dfcf' }])
      await sleep(40)
      out([{ t: 'Student ID [sazidalam2005@gmail.com]: sazid', c: '#e4dfcf' }])
      await sleep(80)
      out([{ t: '✓ Joined project: cse104 (R3L9MR)', c: '#a7d98a' }])
      await sleep(40)
      out([{ t: '✓ Inertia initialized. Every push now requires Proof-of-Thought.', c: '#a7d98a' }])
      await sleep(900)
      if (!aliveRef.current) return

      await typeCmd('git push')
      if (!aliveRef.current) return
      await sleep(300)
      out([{ t: '[INERTIA] Analyzing commit...', c: '#6a6555' }])
      await sleep(600)
      out([{ t: '========================================', c: '#6a6555' }])
      await sleep(60)
      out([{ t: 'INERTIA: PROOF-OF-THOUGHT REQUIRED', c: '#f4c430' }])
      await sleep(60)
      out([{ t: '========================================', c: '#6a6555' }])
      await sleep(60)
      out([{ t: '  Open this URL in your browser and solve the puzzle:', c: '#e4dfcf' }])
      await sleep(60)
      out([{ t: '  https://inertia-tau.vercel.app/student?token=f1431f24…', c: '#f4c430' }])
      await sleep(60)
      out([{ t: '  Time limit: ', c: '#e4dfcf' }, { t: '120s', c: '#f4c430' }])
      await sleep(60)
      out([{ t: '  Waiting for verification...', c: '#e4dfcf' }])
      await sleep(60)
      out([{ t: '========================================', c: '#6a6555' }])
      await sleep(200)
      if (!aliveRef.current) return

      await countdownLine(120, 84, 60)
      if (!aliveRef.current) return
      await sleep(200)

      out([{ t: '[INERTIA] Puzzle expired or failed. Push blocked. Try pushing again.', c: '#e8917c' }])
      await sleep(100)
      out([{ t: 'error: failed to push', c: '#e8917c' }])
      await sleep(2800)
    }

    async function loop() {
      while (aliveRef.current) {
        setLines([])
        await sleep(400)
        if (!aliveRef.current) break
        await runSequence()
        if (!aliveRef.current) break
        await sleep(1200)
      }
    }

    void loop()
    return () => { aliveRef.current = false }
  }, [started])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines])

  return (
    <div ref={wrapRef} style={{
      border: '1px solid #0e0e0c',
      boxShadow: '12px 12px 0 var(--ink)',
      minHeight: 540,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Title bar */}
      <div style={{
        background: '#1a1a16', borderBottom: '1px solid #2a2a24',
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['#d7402c', '#f4c430', '#a7d98a'] as const).map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <span style={{
          flex: 1, marginLeft: 4,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: '#807a68',
        }}>
          md.sazidalam@Mds-MacBook-Air · testing4
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#e6c66a' }}>
          ⎇ main
        </span>
      </div>

      {/* Body */}
      <div ref={bodyRef} style={{
        flex: 1, background: '#0e0e0c',
        padding: '18px 20px 22px', overflowY: 'auto', overflowX: 'hidden',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.7,
        color: '#e4dfcf', minHeight: 460,
      }}>
        <style>{`
          @keyframes term-blink { 50% { opacity: 0; } }
          .term-cursor {
            display: inline-block; width: 8px; height: 1em;
            background: #e4dfcf; vertical-align: text-bottom; margin-left: 1px;
            animation: term-blink 1.05s step-end infinite;
          }
          @keyframes term-live-pulse {
            0%   { box-shadow: 0 0 0 0   rgba(215,64,44,.6); }
            70%  { box-shadow: 0 0 0 5px rgba(215,64,44,0); }
            100% { box-shadow: 0 0 0 0   rgba(215,64,44,0); }
          }
          .term-dot-live {
            display: inline-block; width: 6px; height: 6px; border-radius: 50%;
            background: #d7402c; animation: term-live-pulse 1.2s infinite;
          }
        `}</style>
        {lines.map((line, li) => (
          <div key={line.id} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {line.segs.map((seg, si) => (
              <span key={si} style={{ color: seg.c }}>{seg.t}</span>
            ))}
            {li === lines.length - 1 && <span className="term-cursor" />}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        background: '#1a1a16', borderTop: '1px solid #2a2a24',
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: '#807a68',
        flexShrink: 0,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="term-dot-live" />
          LIVE
        </span>
        <span>PRE-PUSH HOOK</span>
        <span style={{ flex: 1 }} />
        <span>HS256 / JWT</span>
      </div>
    </div>
  )
}

/* ── Problem section ─────────────────────────────────────── */
function ProblemSection() {
  const ref1 = useRef<HTMLSpanElement>(null)
  const ref2 = useRef<HTMLSpanElement>(null)
  const in1 = useInView(ref1)
  const in2 = useInView(ref2)
  return (
    <section className="section-ink-bg" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '140px 48px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '160px 1fr', gap: 48 }}>
        <div style={{ fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 96, lineHeight: 1, color: 'var(--paper)', display: 'block', marginBottom: 12, letterSpacing: '-0.02em' }}>01</span>
          The Problem
        </div>
        <div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px,5vw,72px)', lineHeight: 1.1, letterSpacing: '-0.01em', margin: 0 }}>
            When a student <span ref={ref1 as React.RefObject<HTMLSpanElement>} className={`strike-reveal${in1 ? ' on' : ''}`}>copies AI code</span> and pushes, they{' '}
            <em style={{ color: 'var(--caution)', fontStyle: 'italic' }}>bypass the mental trace</em> entirely.
          </p>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px,3.5vw,54px)', lineHeight: 1.15, letterSpacing: '-0.01em', marginTop: 40 }}>
            Without cognitive friction, there is no heat. Without heat,{' '}
            <span ref={ref2 as React.RefObject<HTMLSpanElement>} className={`strike-reveal${in2 ? ' on' : ''}`}>knowledge is never forged</span> into long-term memory.
          </p>
          <p style={{ fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 40 }}>
            — Inertia.edu
          </p>
        </div>
      </div>
    </section>
  )
}

/* ── Manifesto section ───────────────────────────────────── */
function ManifestoSection() {
  return (
    <section className="manifesto-section" style={{
      padding: '160px 48px', textAlign: 'center',
      background: 'var(--paper)',
      backgroundImage: 'linear-gradient(to bottom, transparent calc(1.85em - 1px), rgba(14,14,12,0.04) calc(1.85em - 1px), rgba(14,14,12,0.04) 1.85em, transparent 1.85em)',
      backgroundSize: '100% 1.85em',
      borderTop: '1px solid var(--ink)',
    }}>
      <div style={{ fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>// philosophy</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px,4.5vw,64px)', lineHeight: 1.15, letterSpacing: '-0.01em', maxWidth: '22ch', margin: '24px auto 0' }}>
        The resistance of the air is what allows the wing to lift. The{' '}
        <span style={{ background: 'var(--caution)', padding: '0 6px' }}>friction</span> of the code is what allows the{' '}
        <em style={{ fontStyle: 'italic', color: 'var(--ink-2)' }}>mind to grow.</em>
      </div>
      <p style={{ fontFamily: 'var(--ui)', fontSize: 13, color: 'var(--ink-muted)', marginTop: 32, maxWidth: '60ch', marginLeft: 'auto', marginRight: 'auto' }}>
        Stop removing it. Start understanding it.
      </p>
    </section>
  )
}

/* ── CTA section ─────────────────────────────────────────── */
function CtaSection() {
  return (
    <section className="section-ink-bg" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '96px 48px', borderTop: '1px solid var(--ink)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 0 }}>
        {[
          { label: 'Student', desc: 'Submit your diff, get a puzzle, prove you understand your own code.', link: '/student', cta: 'Open student flow' },
          { label: 'Instructor', desc: 'Monitor pushes, spot suspicious solves, clear lockouts in one view.', link: '/dashboard', cta: 'Open dashboard' },
        ].map((c, i) => (
          <div key={i} style={{ padding: '40px 36px', borderRight: i < 1 ? '1px solid rgba(244,240,230,0.15)' : undefined }}>
            <div style={{ fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>0{i + 1} —</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 36, lineHeight: 1, letterSpacing: '-0.01em', marginTop: 8 }}>{c.label}</div>
            <p style={{ fontFamily: 'var(--ui)', fontSize: 13, color: 'var(--ink-muted)', marginTop: 14, lineHeight: 1.6 }}>{c.desc}</p>
            <Link to={c.link} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24,
              padding: '10px 16px', background: 'transparent', color: 'var(--ink)',
              textDecoration: 'none', fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
              border: '1px solid var(--ink-faint)',
              transition: 'background .15s, border-color .15s, color .15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--caution)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--caution)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink-faint)'; }}
            >
              {c.cta} →
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Main landing page ────────────────────────────────────── */
export function LandingPage() {
  const progress = useScrollProgress()

  return (
    <div style={{ background: 'var(--paper)', color: 'var(--ink)', overflowX: 'hidden' }}>
      <Nav />

      {/* Scroll progress bar */}
      <div style={{ position: 'fixed', top: 45, left: 0, right: 0, zIndex: 99, height: 2, background: 'var(--paper-line)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--signal)', width: `${progress * 100}%`, transition: 'width .1s' }} />
      </div>

      {/* Hero */}
      <section style={{ minHeight: '100vh', padding: '140px 48px 48px', display: 'grid', gridTemplateColumns: '0.5fr 1fr', alignItems: 'center', gap: 80, maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        {/* Column grid lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, rgba(14,14,12,0.04) 1px, transparent 1px)', backgroundSize: '8.333% 100%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(96px,14vw,220px)', lineHeight: 0.9, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <em style={{ fontStyle: 'italic' }}>Inertia</em>
              <span style={{ fontStyle: 'normal', color: 'var(--signal)' }}>.</span>
              <span style={{ position: 'absolute', left: '-1%', right: '-1%', bottom: '8%', height: '10%', background: 'var(--caution)', zIndex: -1, transform: 'skew(-2deg,-0.5deg)' }} />
            </span>
          </h1>
          <div style={{ fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', borderLeft: '3px solid var(--ink)', paddingLeft: 12, lineHeight: 1.7 }}>
            Proof-of-Thought enforcement<br />for every git push
          </div>
          <p style={{ maxWidth: '46ch', marginTop: 28, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-2)', fontFamily: 'var(--ui)' }}>
            Inertia.edu intercepts the <strong style={{ color: 'var(--ink)' }}>git push</strong> — the most critical moment in a student's coding cycle — and forces a <strong style={{ color: 'var(--ink)' }}>Proof-of-Thought</strong> before any code can leave the machine.
          </p>
          <div style={{ marginTop: 36, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/student" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '12px 18px', background: 'var(--ink)', color: 'var(--paper)',
              textDecoration: 'none', fontFamily: 'var(--ui)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
              border: '1px solid var(--ink)', transition: 'background .15s, color .15s, transform .15s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--caution)'; el.style.color = 'var(--ink)'; el.style.transform = 'translate(-2px,-2px)'; el.style.boxShadow = '4px 4px 0 var(--ink)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--ink)'; el.style.color = 'var(--paper)'; el.style.transform = ''; el.style.boxShadow = ''; }}
            >
              Try student flow →
            </Link>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <TerminalPanel />
        </div>

      </section>

      <ProblemSection />
      <ManifestoSection />
      <CtaSection />

      {/* Footer */}
      <footer style={{ background: 'var(--paper-2)', padding: '24px 48px', borderTop: '1px solid var(--paper-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
        <span>Inertia.edu</span>
        <span>Friction is the feature.</span>
      </footer>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

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
    <nav style={{
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
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
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
      </div>
    </nav>
  )
}

/* ── Hero countdown ring ─────────────────────────────────── */
function HeroRing() {
  const [t, setT] = useState(180)
  useEffect(() => {
    const id = setInterval(() => setT(p => p <= 0 ? 180 : p - 1), 1000)
    return () => clearInterval(id)
  }, [])
  const pct = t / 180
  const r = 150
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const isUrgent = t <= 30
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, marginLeft: 'auto', aspectRatio: '1/1' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>// checkpoint</div>
      <div style={{ position: 'absolute', top: 0, right: 0, textAlign: 'right', fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>proof-of-thought</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Fc = L + 2R + N</div>
      <div style={{ position: 'absolute', bottom: 0, right: 0, textAlign: 'right', fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>git push</div>
      <svg width="100%" height="100%" viewBox="0 0 360 360" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={180} cy={180} r={r} fill="none" stroke="var(--paper-line)" strokeWidth={14} />
        <circle
          cx={180} cy={180} r={r} fill="none"
          stroke={isUrgent ? 'var(--signal)' : 'var(--ink)'}
          strokeWidth={14}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
        />
        {/* tick marks */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i / 36) * 2 * Math.PI
          const x1 = 180 + 165 * Math.cos(angle)
          const y1 = 180 + 165 * Math.sin(angle)
          const x2 = 180 + 175 * Math.cos(angle)
          const y2 = 180 + 175 * Math.sin(angle)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink-faint)" strokeWidth={1} />
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 96, lineHeight: 1, letterSpacing: '-0.02em', color: isUrgent ? 'var(--signal)' : 'var(--ink)', transition: 'color .3s', fontVariantNumeric: 'tabular-nums' }}>{t}</div>
        <div style={{ fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>seconds · {t >= 120 ? 'HARD' : t >= 60 ? 'MEDIUM' : 'EASY'}</div>
      </div>
      {/* rotating dial ring */}
      <div style={{
        position: 'absolute', inset: '8%', border: '1px dashed var(--ink-faint)', borderRadius: '50%',
        animation: 'rotate-dial 60s linear infinite',
        pointerEvents: 'none',
      }} />
      <style>{`@keyframes rotate-dial { to { transform: rotate(360deg); } }`}</style>
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
    <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '140px 48px' }}>
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
    <section style={{
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
    <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '96px 48px', borderTop: '1px solid var(--ink)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 0 }}>
        {[
          { label: 'Student', desc: 'Submit your diff, get a puzzle, prove you understand your own code.', link: '/student', cta: 'Open student flow' },
          { label: 'Instructor', desc: 'Monitor pushes, spot suspicious solves, clear lockouts in one view.', link: '/dashboard', cta: 'Open dashboard' },
        ].map((c, i) => (
          <div key={i} style={{ padding: '40px 36px', borderRight: i < 1 ? '1px solid rgba(244,240,230,0.15)' : undefined }}>
            <div style={{ fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>0{i + 1} —</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 36, lineHeight: 1, letterSpacing: '-0.01em', marginTop: 8 }}>{c.label}</div>
            <p style={{ fontFamily: 'var(--ui)', fontSize: 13, color: 'rgba(244,240,230,0.65)', marginTop: 14, lineHeight: 1.6 }}>{c.desc}</p>
            <Link to={c.link} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24,
              padding: '10px 16px', background: 'transparent', color: 'var(--paper)',
              textDecoration: 'none', fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
              border: '1px solid rgba(244,240,230,0.3)',
              transition: 'background .15s, border-color .15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--caution)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--caution)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--paper)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,240,230,0.3)'; }}
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
      <section style={{ minHeight: '100vh', padding: '140px 48px 48px', display: 'grid', gridTemplateColumns: '1.25fr 1fr', alignItems: 'center', gap: 80, maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
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
          <HeroRing />
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

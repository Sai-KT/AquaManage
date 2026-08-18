import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, User, Droplets, CheckCircle,
  CloudRain, FileText, ArrowRight, Leaf, Star,
  IdCard, AlertCircle, Zap, Shield, BarChart2, Bell
} from 'lucide-react';

/* ─── Scroll-reveal hook ─────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Reveal wrapper ─────────────────────────────────── */
function Reveal({ children, delay = 0, style: extraStyle = {} }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(36px)',
        transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────── */
const featureSections = [
  {
    tag: 'Core capability.',
    headline: 'Real-time water\nmonitoring.',
    body: 'Every sensor, every drop — tracked live. AquaManage surfaces accurate harvesting levels, consumption data, and system health across all I2IT buildings in a single dashboard that updates the moment data changes.',
    accent: '#38bdf8',
  },
  {
    tag: 'Reporting.',
    headline: 'One tap to\nreport a leak.',
    body: 'Spotted a dripping tap or an overflow? Submit a geotagged issue report in under 10 seconds. Your report goes straight to the maintenance queue with priority scoring so the worst leaks get fixed first.',
    accent: '#34d399',
  },
  {
    tag: 'Transparency.',
    headline: 'Track every\nfix in real-time.',
    body: 'Know exactly where your report stands. Live status updates take you from "Submitted" to "In Progress" to "Resolved" — with timestamps, assigned technician info, and an auto-closed notification when work is done.',
    accent: '#a78bfa',
  },
  {
    tag: 'Analytics.',
    headline: 'Campus-wide\nwater insights.',
    body: 'Aggregated consumption charts, harvesting efficiency graphs, and monthly savings summaries give you the full picture. Track how collective action translates into thousands of litres saved each semester.',
    accent: '#fb923c',
  },
];

const projectCards = [
  {
    title: 'Issue Reporting',
    desc: 'Submit, track, and resolve water issues across I2IT campus — leaks, overflows, or faulty fittings — all in one flow.',
    icon: FileText,
    accent: '#38bdf8',
  },
  {
    title: 'Harvesting Dashboard',
    desc: 'Real-time rainwater harvesting levels across each building, with trend lines and capacity alerts.',
    icon: CloudRain,
    accent: '#34d399',
  },
  {
    title: 'My Reports',
    desc: 'A personal feed of every issue you have ever raised — with live status, timestamps, and resolution notes.',
    icon: BarChart2,
    accent: '#a78bfa',
  },
];

const campusStats = [
  { value: '2.4M', label: 'Litres Saved',   icon: Droplets   },
  { value: '87%',  label: 'Efficiency',      icon: Leaf        },
  { value: '48',   label: 'Issues Resolved', icon: CheckCircle },
];

export default function StudentLogin() {
  const navigate = useNavigate();
  const { user, loginStudent } = useAuth();
  const [nameVal, setNameVal] = useState('');
  const [irnNo, setIrnNo] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (user && user.role === 'student') navigate('/student/report', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleContinue = (e) => {
    if (e) e.preventDefault();
    if (!nameVal.trim()) { setError('Please enter your full name (compulsory).'); return; }
    if (!irnNo.trim())   { setError('Please enter your IRN No. (compulsory).'); return; }
    setError('');
    loginStudent(nameVal, irnNo);
    navigate('/student/report');
  };

  const scrollToLogin = () => {
    document.getElementById('student-login-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: '#030a12', color: '#fff', fontFamily: "'Inter', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Animated particle grid bg ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(14,165,233,0.28) 1px, transparent 1px)',
        backgroundSize: '42px 42px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        opacity: 0.35,
        animation: 'gridDrift 20s ease-in-out infinite alternate',
      }} />

      {/* ── Floating orbs ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', top: '-20%', left: '-15%', background: 'radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 60%)', animation: 'floatOrb 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', bottom: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 60%)', animation: 'floatOrb 15s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', top: '40%', right: '20%', background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)', animation: 'floatOrb 9s ease-in-out infinite 3s' }} />
      </div>

      {/* ── Sticky nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: scrolled ? 'rgba(3,10,18,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(14,165,233,0.1)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.4)',
          }}>
            <Droplets size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.3px' }}>I2IT AquaManage</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[{ label: '//01 HOME', action: null }, { label: '//02 FEATURES', action: () => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' }) }, { label: '//03 PORTAL', action: scrollToLogin }].map((item, i) => (
            <button key={i} onClick={item.action} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
            >
              {item.label} ↗
            </button>
          ))}
        </div>
      </nav>

      {/* ═══════ HERO SECTION ═══════ */}
      <section style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center',
        padding: '120px 24px 80px',
      }}>
        <Reveal>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)',
            borderRadius: 100, padding: '6px 18px', marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Student &amp; Staff Portal</span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 style={{
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 900,
            lineHeight: 1.05, letterSpacing: '-2.5px', margin: '0 0 28px', maxWidth: 860,
          }}>
            Be the change.<br />
            <span style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #34d399 50%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Save campus water.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.8, maxWidth: 540, margin: '0 auto 48px' }}>
            Every report counts. Help I2IT campus stay water-efficient by reporting leaks, tracking repairs, and staying informed — all from your phone.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}>
            <button
              onClick={scrollToLogin}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9375rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 32px rgba(14,165,233,0.4)',
                transition: 'all 0.22s ease', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(14,165,233,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(14,165,233,0.4)'; }}
            >
              Open student portal <ArrowRight size={16} />
            </button>
            <button
              onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.9375rem',
                cursor: 'pointer', transition: 'all 0.22s ease', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              Explore features ↓
            </button>
          </div>
        </Reveal>

        {/* Stats strip */}
        <Reveal delay={0.4}>
          <div style={{
            display: 'flex', gap: 0,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(14,165,233,0.12)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {campusStats.map((s, i) => (
              <div key={i} style={{
                padding: '20px 40px', textAlign: 'center',
                borderRight: i < campusStats.length - 1 ? '1px solid rgba(14,165,233,0.1)' : 'none',
              }}>
                <s.icon size={16} style={{ color: '#38bdf8', display: 'block', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38bdf8', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 4, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s ease-in-out infinite' }}>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(56,189,248,0.6), transparent)', margin: '0 auto' }} />
        </div>
      </section>

      {/* ═══════ FEATURE NARRATIVE SECTIONS (Aaron-style) ═══════ */}
      <div id="features-section" />
      {featureSections.map((section, i) => (
        <section key={i} style={{
          position: 'relative', zIndex: 1,
          padding: 'clamp(80px, 12vw, 140px) clamp(24px, 8vw, 120px)',
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', flexDirection: i % 2 === 0 ? 'row' : 'row-reverse',
          alignItems: 'center', gap: 'clamp(40px, 8vw, 100px)',
          flexWrap: 'wrap',
        }}>
          {/* Text side */}
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <Reveal delay={0.05}>
              <div style={{
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '2px',
                textTransform: 'uppercase', color: section.accent,
                marginBottom: 20, fontFamily: "'Courier New', monospace",
              }}>
                {section.tag}
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900,
                lineHeight: 1.1, letterSpacing: '-1.5px',
                margin: '0 0 24px', whiteSpace: 'pre-line', color: '#fff',
              }}>
                {section.headline}
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.85, margin: 0, maxWidth: 480 }}>
                {section.body}
              </p>
            </Reveal>
          </div>

          {/* Visual card */}
          <Reveal delay={0.1} style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(3,10,18,0.95) 100%)',
              border: `1px solid ${section.accent}22`,
              borderRadius: 24, padding: '48px 40px',
              position: 'relative', overflow: 'hidden',
              boxShadow: `0 0 80px ${section.accent}0a`,
            }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${section.accent}20 0%, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: `${section.accent}18`, border: `1px solid ${section.accent}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 28, boxShadow: `0 8px 32px ${section.accent}20`,
              }}>
                {i === 0 && <Droplets size={28} style={{ color: section.accent }} />}
                {i === 1 && <FileText size={28} style={{ color: section.accent }} />}
                {i === 2 && <CheckCircle size={28} style={{ color: section.accent }} />}
                {i === 3 && <BarChart2 size={28} style={{ color: section.accent }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[78, 55, 91, 63].map((pct, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', width: 60, fontFamily: 'monospace' }}>
                      {['Block A', 'Block B', 'Block C', 'Block D'][j]}
                    </div>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${section.accent}99, ${section.accent})`, borderRadius: 100 }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: section.accent, fontWeight: 700, width: 32, textAlign: 'right' }}>{pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      ))}

      {/* ═══════ PORTAL MODULES CARD GRID (Aaron "Selected work") ═══════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(60px, 10vw, 120px) clamp(24px, 8vw, 120px)', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.3), transparent)', marginBottom: 60 }} />
        <Reveal>
          <div style={{ marginBottom: 60 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12, fontFamily: "'Courier New', monospace" }}>
              Portal modules
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>
              Everything you need,<br />
              <span style={{ background: 'linear-gradient(90deg, #38bdf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>in one place.</span>
            </h2>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {projectCards.map((card, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20, padding: '32px 28px',
                  transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${card.accent}09`; e.currentTarget.style.border = `1px solid ${card.accent}30`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 60px ${card.accent}15`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 13, background: `${card.accent}18`, border: `1px solid ${card.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <card.icon size={20} style={{ color: card.accent }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: 10, letterSpacing: '-0.3px' }}>{card.title}</div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>{card.desc}</div>
                <div style={{ position: 'absolute', bottom: 16, right: 20, fontSize: '0.7rem', color: card.accent, opacity: 0.6, fontWeight: 700 }}>— Available in portal ↗</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════ CTA BRIDGE ("Every report matters.") ═══════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(60px, 10vw, 120px) clamp(24px, 8vw, 120px)', maxWidth: 1200, margin: '0 auto' }}>
        <Reveal>
          <div style={{
            background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(16,185,129,0.04) 100%)',
            border: '1px solid rgba(14,165,233,0.15)', borderRadius: 28,
            padding: 'clamp(40px, 6vw, 72px) clamp(32px, 5vw, 60px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 20, fontFamily: "'Courier New', monospace", position: 'relative', zIndex: 1 }}>
              Every report matters.
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 900, letterSpacing: '-1.5px', margin: '0 0 20px', lineHeight: 1.1, position: 'relative', zIndex: 1 }}>
              Help save thousands of<br />
              <span style={{ background: 'linear-gradient(90deg, #38bdf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>litres every semester.</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, maxWidth: 480, margin: '0 0 36px', position: 'relative', zIndex: 1 }}>
              I2IT students who report issues help the campus save an estimated 2.4 million litres a year. Join the effort — it takes less than a minute.
            </p>
            <button
              onClick={scrollToLogin}
              style={{
                padding: '16px 40px', borderRadius: 14,
                background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                border: 'none', color: '#fff', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 32px rgba(14,165,233,0.45)',
                transition: 'all 0.22s ease', fontFamily: 'inherit', position: 'relative', zIndex: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 44px rgba(14,165,233,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(14,165,233,0.45)'; }}
            >
              Sign in to the portal <ArrowRight size={18} />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ═══════ LOGIN FORM SECTION ═══════ */}
      <section
        id="student-login-form"
        style={{
          position: 'relative', zIndex: 1,
          padding: 'clamp(60px, 10vw, 120px) clamp(24px, 8vw, 120px)',
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', gap: 'clamp(40px, 7vw, 80px)',
          alignItems: 'flex-start', flexWrap: 'wrap',
        }}
      >
        {/* Left context */}
        <div style={{ flex: '1 1 340px', minWidth: 0 }}>
          <Reveal>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 20, fontFamily: "'Courier New', monospace" }}>
              //03 Portal access.
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.75rem)', fontWeight: 900, letterSpacing: '-1px', margin: '0 0 18px', lineHeight: 1.15 }}>
              Sign in.<br />
              <span style={{ background: 'linear-gradient(90deg, #38bdf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Start reporting.</span>
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.8, maxWidth: 380, margin: '0 0 40px' }}>
              Enter your name and IRN No. to get started. No password required — just your campus identity.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: Shield, label: 'Campus verified access', color: '#38bdf8' },
                { icon: Zap, label: 'Instant report submission', color: '#34d399' },
                { icon: Bell, label: 'Live status notifications', color: '#a78bfa' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${item.color}14`, border: `1px solid ${item.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={14} style={{ color: item.color }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Form card */}
        <Reveal delay={0.15} style={{ flex: '1 1 380px', minWidth: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(14,165,233,0.15)',
            borderRadius: 24, padding: '40px 36px',
            boxShadow: '0 0 80px rgba(14,165,233,0.07)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 70, height: 70, borderRadius: 20, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(16,185,129,0.08))',
                border: '1.5px solid rgba(14,165,233,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(14,165,233,0.15)',
                animation: 'logoBounce 2.5s ease-in-out infinite 0.5s',
              }}>
                <BookOpen size={30} style={{ color: '#38bdf8' }} />
              </div>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Student Sign In</h3>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.6 }}>
                Enter your Name &amp; IRN No. to access the portal
              </p>
            </div>

            <form onSubmit={handleContinue}>
              {/* Name */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focusedField === 'name' ? '#38bdf8' : 'rgba(255,255,255,0.22)', transition: 'color 0.2s' }} />
                  <input
                    type="text" placeholder="e.g. Arjun Mehta"
                    value={nameVal}
                    onChange={e => { setNameVal(e.target.value); if (error) setError(''); }}
                    onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                    autoFocus required
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px',
                      background: focusedField === 'name' ? 'rgba(14,165,233,0.07)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${focusedField === 'name' ? 'rgba(14,165,233,0.5)' : 'rgba(255,255,255,0.09)'}`,
                      borderRadius: 12, color: '#fff', fontSize: '0.9375rem',
                      outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s ease', caretColor: '#38bdf8',
                    }}
                  />
                </div>
              </div>

              {/* IRN */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                  IRN No. / PRN No. <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <IdCard size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focusedField === 'irn' ? '#38bdf8' : 'rgba(255,255,255,0.22)', transition: 'color 0.2s' }} />
                  <input
                    type="text" placeholder="e.g. IRN2024891"
                    value={irnNo}
                    onChange={e => { setIrnNo(e.target.value); if (error) setError(''); }}
                    onFocus={() => setFocusedField('irn')} onBlur={() => setFocusedField(null)}
                    required
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px',
                      background: focusedField === 'irn' ? 'rgba(14,165,233,0.07)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${focusedField === 'irn' ? 'rgba(14,165,233,0.5)' : 'rgba(255,255,255,0.09)'}`,
                      borderRadius: 12, color: '#fff', fontSize: '0.9375rem',
                      outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s ease', caretColor: '#38bdf8',
                    }}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 18, fontSize: '0.8125rem', color: '#f87171' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                  border: 'none', borderRadius: 12,
                  color: '#fff', fontWeight: 700, fontSize: '0.9375rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: isHovered ? '0 8px 32px rgba(14,165,233,0.55)' : '0 4px 20px rgba(14,165,233,0.35)',
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.22s ease', fontFamily: 'inherit',
                }}
              >
                Continue to Student Portal
                <ArrowRight size={16} style={{ animation: isHovered ? 'slideRight 0.4s ease infinite alternate' : 'none' }} />
              </button>

              {/* Demo */}
              <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                  Demo: <code style={{ color: '#38bdf8', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: 4 }}>Arjun Mehta</code>
                  {' '}/{' '}
                  <code style={{ color: '#38bdf8', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: 4 }}>IRN2024891</code>
                </div>
                <button
                  type="button"
                  onClick={() => { setNameVal('Arjun Mehta'); setIrnNo('IRN2024891'); setError(''); }}
                  style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 6, color: '#38bdf8', fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Auto-fill
                </button>
              </div>
            </form>

            {/* Verified badge */}
            <div style={{ marginTop: 18, padding: '11px 16px', background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                🆔 <strong style={{ color: '#38bdf8' }}>Verified Portal</strong> — Name &amp; IRN No. mandatory for campus issue reporting
              </div>
            </div>
          </div>

          {/* System status */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(16,185,129,0.65)', fontWeight: 600 }}>System Online</span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.15)', marginLeft: 8 }}>I2IT Hinjewadi · Campus Water Management</span>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.5px' }}>
          © 2025 I2IT AquaManage · Campus Water Management System · Hinjewadi, Pune
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        ::placeholder { color: rgba(255,255,255,0.18) !important; }
        @keyframes logoBounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(14px, -22px) scale(1.03); }
          66%       { transform: translate(-10px, 12px) scale(0.97); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        @keyframes slideRight {
          from { transform: translateX(0); }
          to   { transform: translateX(5px); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(10px); }
        }
        @keyframes gridDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 42px 42px; }
        }
        @media (max-width: 768px) {
          nav { padding: 0 20px !important; }
          nav > div:last-child { display: none; }
        }
      `}</style>
    </div>
  );
}

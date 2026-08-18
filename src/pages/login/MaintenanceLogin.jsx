import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HardHat, Lock, User, Eye, EyeOff,
  Droplets, AlertCircle, ArrowRight,
  Wrench, ClipboardList, CheckSquare,
  Zap, MapPin, Clock
} from 'lucide-react';

const capabilities = [
  { icon: ClipboardList, label: 'Work Orders',    desc: 'View & manage assigned field tasks' },
  { icon: Wrench,        label: 'Field Repairs',  desc: 'Log repairs and mark equipment fixed' },
  { icon: CheckSquare,   label: 'Mark Resolved',  desc: 'Close issues after on-site resolution' },
  { icon: Zap,           label: 'Priority Alerts',desc: 'Receive critical water system alerts' },
  { icon: MapPin,        label: 'Zone Dispatch',  desc: 'Campus zone-based task routing'      },
  { icon: Clock,         label: 'Time Tracking',  desc: 'Log hours against work orders'        },
];

export default function MaintenanceLogin() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [empId,       setEmpId]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [focusedField,setFocusedField]= useState(null);
  const [btnHover,    setBtnHover]    = useState(false);
  const [time,        setTime]        = useState(new Date());
  const canvasRef = useRef(null);

  useEffect(() => {
    if (user && user.role === 'maintenance') navigate('/maintenance/tasks', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Canvas particle field (amber palette) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, pts = [];
    const N = 85, D = 115;
    const COLS = [[245,158,11],[251,191,36],[217,119,6]];

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    const mk = () => {
      const c = COLS[Math.floor(Math.random()*COLS.length)];
      return { x:Math.random()*canvas.width, y:Math.random()*canvas.height,
        vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4,
        r:Math.random()*1.5+.5, ph:Math.random()*Math.PI*2,
        sp:Math.random()*.006+.003, amp:Math.random()*.16+.04, c };
    };
    const init = () => { resize(); pts = Array.from({length:N}, mk); };

    const tick = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p => {
        p.ph += p.sp;
        p.x += p.vx + Math.sin(p.ph*.8)*p.amp;
        p.y += p.vy + Math.cos(p.ph*.6)*p.amp;
        if (p.x<-8) p.x=canvas.width+8;
        else if(p.x>canvas.width+8) p.x=-8;
        if (p.y<-8) p.y=canvas.height+8;
        else if(p.y>canvas.height+8) p.y=-8;
      });
      for(let i=0;i<pts.length;i++) {
        for(let j=i+1;j<pts.length;j++) {
          const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.hypot(dx,dy);
          if(d<D){
            const a=(1-d/D)*.2, [r,g,b]=pts[i].c;
            ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
            ctx.strokeStyle=`rgba(${r},${g},${b},${a})`; ctx.lineWidth=.65; ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        const pulse=Math.sin(p.ph*1.4)*.25+.75, [r,g,b]=p.c;
        const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*7);
        grd.addColorStop(0,`rgba(${r},${g},${b},${.14*pulse})`);
        grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*7,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*pulse,0,Math.PI*2);
        ctx.fillStyle=`rgba(${r},${g},${b},${.88*pulse})`; ctx.fill();
      });
      animId=requestAnimationFrame(tick);
    };
    init(); animId=requestAnimationFrame(tick);
    const ro=new ResizeObserver(init); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const result = login('maintenance', empId, password);
    setLoading(false);
    if (result.success) navigate('/maintenance/tasks');
    else setError(result.error);
  };

  const timeStr = time.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
  const dateStr = time.toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Inter',sans-serif", background:'#0e0800', width:'100%', maxWidth:'100vw', overflowX:'hidden' }}>

      {/* ══════════ LEFT PANEL ══════════ */}
      <div style={{
        flex:'0 0 52%', position:'relative', overflow:'hidden',
        background:'linear-gradient(155deg,#120800 0%,#1a0d00 40%,#221100 70%,#150900 100%)',
        borderRight:'1px solid rgba(245,158,11,0.12)',
        display:'flex', flexDirection:'column',
      }}>

        {/* Canvas particle field */}
        <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:0 }} />

        {/* Hazard stripe texture */}
        <div style={{ position:'absolute', inset:0, opacity:.018, zIndex:1, pointerEvents:'none',
          backgroundImage:'repeating-linear-gradient(55deg,#f59e0b 0px,#f59e0b 8px,transparent 8px,transparent 28px)' }} />

        {/* Scanlines */}
        <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(245,158,11,0.006) 2px,rgba(245,158,11,0.006) 3px)' }} />

        {/* ── Top bar ── */}
        <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'22px 36px', borderBottom:'1px solid rgba(245,158,11,0.1)',
          background:'rgba(0,0,0,0.32)', backdropFilter:'blur(8px)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10,
              background:'linear-gradient(135deg,#f59e0b,#d97706)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 14px rgba(245,158,11,0.45)' }}>
              <Droplets size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'.875rem', color:'#fff', letterSpacing:'-.2px' }}>I2IT AquaManage</div>
              <div style={{ fontSize:'.5rem', color:'rgba(255,255,255,0.3)', letterSpacing:'1.2px', textTransform:'uppercase' }}>Maintenance Operations</div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'.9rem', fontWeight:800, color:'#fbbf24', fontVariantNumeric:'tabular-nums', letterSpacing:'.5px', fontFamily:'monospace' }}>{timeStr}</div>
            <div style={{ fontSize:'.5rem', color:'rgba(255,255,255,0.22)', letterSpacing:'.3px', marginTop:2 }}>{dateStr}</div>
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'32px 48px', position:'relative', zIndex:2 }}>

          {/* Pulsing rings + hardhat */}
          <div style={{ position:'relative', marginBottom:28 }}>
            <div style={{ position:'absolute', inset:-40, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.1)', animation:'ringPulse 3.5s ease-in-out infinite' }} />
            <div style={{ position:'absolute', inset:-24, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.18)', animation:'ringPulse 3.5s ease-in-out .6s infinite' }} />
            <div style={{ position:'absolute', inset:-10, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.28)', animation:'ringPulse 3.5s ease-in-out 1.2s infinite' }} />
            <div style={{
              width:100, height:100, borderRadius:'50%',
              background:'radial-gradient(circle,rgba(245,158,11,0.22) 0%,rgba(245,158,11,0.07) 60%,transparent 100%)',
              border:'1.5px solid rgba(245,158,11,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 70px rgba(245,158,11,0.2),inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
              <HardHat size={46} style={{ color:'#fbbf24' }} strokeWidth={1.4} />
            </div>
          </div>

          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:7,
            background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.22)',
            borderRadius:6, padding:'5px 14px', marginBottom:16 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 8px #f59e0b', animation:'blink 2s infinite' }} />
            <span style={{ fontSize:'.55rem', fontWeight:800, color:'#fbbf24', letterSpacing:'2.5px', textTransform:'uppercase' }}>Field Operations Portal</span>
          </div>

          <h2 style={{ fontSize:'2.1rem', fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1.12, textAlign:'center', margin:'0 0 12px' }}>
            Maintenance<br />
            <span style={{ background:'linear-gradient(90deg,#fbbf24,#fde68a)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Staff Portal
            </span>
          </h2>
          <p style={{ fontSize:'.8rem', color:'rgba(255,255,255,0.3)', textAlign:'center', lineHeight:1.75, maxWidth:310, margin:0 }}>
            Authorised field operations access for I2IT campus maintenance and water system personnel.
          </p>
        </div>

        {/* ── Capability cards ── */}
        <div style={{ position:'relative', zIndex:2, margin:'0 24px 24px',
          background:'rgba(0,0,0,0.42)', border:'1px solid rgba(245,158,11,0.12)',
          borderRadius:14, overflow:'hidden', backdropFilter:'blur(10px)' }}>
          <div style={{ padding:'10px 18px', borderBottom:'1px solid rgba(245,158,11,0.08)',
            display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 7px #f59e0b' }} />
            <span style={{ fontSize:'.55rem', fontWeight:800, color:'rgba(251,191,36,0.65)', letterSpacing:'1.5px', textTransform:'uppercase' }}>Portal Capabilities</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
            {capabilities.map((c, i) => (
              <div key={i} style={{
                padding:'10px 16px',
                borderRight: i%2===0 ? '1px solid rgba(245,158,11,0.07)' : 'none',
                borderBottom: i<4 ? '1px solid rgba(245,158,11,0.07)' : 'none',
                display:'flex', alignItems:'flex-start', gap:8,
              }}>
                <c.icon size={11} style={{ color:'#fbbf24', flexShrink:0, marginTop:2 }} />
                <div>
                  <div style={{ fontSize:'.62rem', color:'rgba(255,255,255,0.6)', fontWeight:700, marginBottom:1 }}>{c.label}</div>
                  <div style={{ fontSize:'.56rem', color:'rgba(255,255,255,0.22)', lineHeight:1.4 }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <div style={{ flex:1, background:'#0d0700', display:'flex', alignItems:'center', justifyContent:'center',
        padding:'48px 56px', position:'relative', overflow:'hidden',
        width:'100%', maxWidth:'100vw', boxSizing:'border-box' }}>

        {/* Corner glows */}
        <div style={{ position:'absolute', top:-80, right:-80, width:360, height:360, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(245,158,11,0.05) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:280, height:280, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(245,158,11,0.03) 0%,transparent 70%)', pointerEvents:'none' }} />

        <div style={{ width:'100%', maxWidth:390, position:'relative', zIndex:1 }}>

          {/* Header */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7,
              background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.18)',
              borderRadius:6, padding:'5px 13px', marginBottom:22 }}>
              <HardHat size={9} style={{ color:'#fbbf24' }} />
              <span style={{ fontSize:'.55rem', fontWeight:800, color:'#fbbf24', letterSpacing:'2px', textTransform:'uppercase' }}>Staff Authentication</span>
            </div>
            <h1 style={{ fontSize:'2rem', fontWeight:900, color:'#fff', letterSpacing:'-.8px', margin:'0 0 10px', lineHeight:1.1 }}>
              Sign In
            </h1>
            <p style={{ fontSize:'.8125rem', color:'rgba(255,255,255,0.28)', margin:0, lineHeight:1.65 }}>
              Use your assigned employee credentials to access the maintenance operations portal.
            </p>
          </div>

          {/* Glassmorphism form card */}
          <div style={{
            background:'rgba(245,158,11,0.025)',
            border:'1px solid rgba(245,158,11,0.12)',
            borderRadius:16, padding:'28px 26px',
            boxShadow:'0 24px 64px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.03)',
            backdropFilter:'blur(12px)',
            marginBottom:20,
          }}>
            {/* Top accent bar */}
            <div style={{ height:2, background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.55),transparent)', borderRadius:99, marginBottom:24 }} />

            <form onSubmit={handleSubmit}>
              {/* Employee ID */}
              <div style={{ marginBottom:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <label style={{ fontSize:'.65rem', fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'.8px', textTransform:'uppercase' }}>Employee ID</label>
                  {focusedField==='emp' && <span style={{ fontSize:'.55rem', color:'rgba(251,191,36,0.75)', fontWeight:700, animation:'blink 1.2s infinite' }}>● ACTIVE</span>}
                </div>
                <div style={{ position:'relative' }}>
                  <User size={13} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
                    color:focusedField==='emp' ? '#fbbf24' : 'rgba(255,255,255,0.18)', transition:'color .2s' }} />
                  <input type="text" placeholder="e.g. EMP-01" value={empId}
                    onChange={e => setEmpId(e.target.value)} required autoFocus
                    onFocus={() => setFocusedField('emp')} onBlur={() => setFocusedField(null)}
                    style={{
                      width:'100%', padding:'12px 36px 12px 38px',
                      background: focusedField==='emp' ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.03)',
                      border:`1.5px solid ${focusedField==='emp' ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius:10, color:'#fff', fontSize:'.875rem',
                      outline:'none', boxSizing:'border-box', transition:'all .2s', caretColor:'#fbbf24',
                    }} />
                  {empId && <div style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)',
                    width:5, height:5, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 6px #fbbf24' }} />}
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <label style={{ fontSize:'.65rem', fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'.8px', textTransform:'uppercase' }}>Password</label>
                  {focusedField==='pwd' && <span style={{ fontSize:'.55rem', color:'rgba(251,191,36,0.75)', fontWeight:700, animation:'blink 1.2s infinite' }}>● ACTIVE</span>}
                </div>
                <div style={{ position:'relative' }}>
                  <Lock size={13} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
                    color:focusedField==='pwd' ? '#fbbf24' : 'rgba(255,255,255,0.18)', transition:'color .2s' }} />
                  <input type={showPwd?'text':'password'} placeholder="••••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} required
                    onFocus={() => setFocusedField('pwd')} onBlur={() => setFocusedField(null)}
                    style={{
                      width:'100%', padding:'12px 42px 12px 38px',
                      background: focusedField==='pwd' ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.03)',
                      border:`1.5px solid ${focusedField==='pwd' ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius:10, color:'#fff', fontSize:'.875rem',
                      outline:'none', boxSizing:'border-box', transition:'all .2s', caretColor:'#fbbf24',
                    }} />
                  <button type="button" onClick={() => setShowPwd(v=>!v)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.22)', padding:4 }}>
                    {showPwd ? <EyeOff size={13}/> : <Eye size={13}/>}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px',
                  background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.17)',
                  borderRadius:9, marginBottom:20, fontSize:'.8rem', color:'#f87171', lineHeight:1.5 }}>
                  <AlertCircle size={13} style={{ flexShrink:0 }}/> <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  width:'100%', padding:'13px',
                  background: loading ? 'rgba(245,158,11,0.18)' : 'linear-gradient(135deg,#92400e,#d97706,#f59e0b)',
                  border: loading ? '1px solid rgba(245,158,11,0.18)' : 'none',
                  borderRadius:10, color:'#fff', fontWeight:700, fontSize:'.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                  boxShadow: btnHover && !loading ? '0 10px 32px rgba(245,158,11,0.45),inset 0 1px 0 rgba(255,255,255,0.1)' : '0 4px 20px rgba(245,158,11,0.22),inset 0 1px 0 rgba(255,255,255,0.07)',
                  transform: btnHover && !loading ? 'translateY(-2px)' : 'translateY(0)',
                  transition:'all .22s ease', letterSpacing:'.3px',
                }}>
                {loading ? (
                  <>
                    <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>
                    Verifying...
                  </>
                ) : (<>Access Maintenance Portal <ArrowRight size={14}/></>)}
              </button>
            </form>
          </div>

          {/* Portal Switcher */}
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <span style={{ fontSize:'.7rem', color:'rgba(255,255,255,0.25)', marginRight:8 }}>Switch portal:</span>
            <button onClick={() => navigate('/login/student')}
              style={{ background:'none', border:'none', color:'#38bdf8', fontSize:'.75rem', fontWeight:600, cursor:'pointer', textDecoration:'underline', marginRight:12 }}>
              Student Login
            </button>
            <button onClick={() => navigate('/login/admin')}
              style={{ background:'none', border:'none', color:'#34d399', fontSize:'.75rem', fontWeight:600, cursor:'pointer', textDecoration:'underline' }}>
              Admin Login
            </button>
          </div>

          {/* Footer */}
          <div>
            <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.15),transparent)', marginBottom:14 }}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:'.6rem', color:'rgba(255,255,255,0.16)', letterSpacing:'.3px' }}>I2IT Hinjewadi · Field Operations</span>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'#f59e0b', display:'inline-block', boxShadow:'0 0 6px rgba(245,158,11,0.8)', animation:'blink 2s infinite' }}/>
                <span style={{ fontSize:'.6rem', color:'rgba(245,158,11,0.55)', fontWeight:600, letterSpacing:'.3px' }}>Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes ringPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.1);opacity:0.18} }
        ::placeholder { color: rgba(255,255,255,0.15) !important; }
      `}</style>
    </div>
  );
}

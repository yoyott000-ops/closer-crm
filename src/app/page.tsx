'use client'
import { useState, useEffect, useRef } from "react";

const C = {
  bg:"#060606", surface:"#0a0a0a", card:"#0f0f0f", card2:"#141414",
  border:"#161616", border2:"#1e1e1e", border3:"#262626",
  red:"#e63535", redDim:"#c02020", redText:"#ff6b6b",
  white:"#f0f0f0", off:"#d4d4d4", muted:"#5a5a5a", muted2:"#333333",
  green:"#22c55e", amber:"#f59e0b", blue:"#3b82f6",
};
const SANS = `'Inter',-apple-system,sans-serif`;

function useInView(ref:any) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
}

function AnimatedSection({children, delay=0}:any) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <div ref={ref} style={{opacity: inView?1:0, transform: inView?"translateY(0)":"translateY(32px)", transition:`all .7s cubic-bezier(.4,0,.2,1) ${delay}ms`}}>
      {children}
    </div>
  );
}

const FEATURE_ICONS:Record<string,any> = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.07 2.18 2 2 0 012.03 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  money: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  target: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
};

const FEATURES = [
  { icon:"dashboard", title:"Dashboard temps réel", desc:"Visualise ton cash collecté, tes commissions actives et ton taux de closing en un coup d'œil. Toutes tes métriques, au même endroit." },
  { icon:"phone", title:"Suivi des appels & deals", desc:"Enregistre chaque appel, chaque deal, chaque statut. Retrouve l'historique complet de tes prospects en 2 secondes." },
  { icon:"money", title:"Commissions automatiques", desc:"Kloze calcule tes commissions en temps réel — one shot ou mensualités. Tu sais exactement combien tu vas toucher ce mois." },
  { icon:"chart", title:"Analytics avancées", desc:"Funnel de conversion, taux de show-up, objections les plus fréquentes. Identifie ce qui bloque et optimise ton closing." },
  { icon:"calendar", title:"Agenda & Booking", desc:"Gère tes RDV, reçois des rappels avant chaque call, et connecte ton Calendly pour automatiser ta prise de rendez-vous." },
  { icon:"target", title:"Performance par offre", desc:"Compare tes offres entre elles. Quel produit génère le plus de cash ? Quel closing rate par programme ? Tu sais tout." },
];

const STATS = [
  { value:"100%", label:"de tes KPIs visibles" },
  { value:"2x", label:"plus de clarté sur tes revenus" },
  { value:"0€", label:"à l'installation" },
  { value:"10j", label:"d'essai gratuit" },
];

const TESTIMONIALS = [
  { name:"Lucas M.", role:"Closer Indépendant", text:"Avant Kloze je notais tout sur Excel. Maintenant j'ouvre le dashboard et je vois exactement où j'en suis. Game changer.", avatar:"LM" },
  { name:"Sarah K.", role:"Closer — Agence Premium", text:"Le suivi des commissions mensualités c'est ce qui me manquait. Je sais exactement ce que je vais toucher chaque mois.", avatar:"SK" },
  { name:"Tom B.", role:"Senior Closer", text:"Simple, rapide, efficace. J'ai mis 10 minutes à tout configurer. Mon taux de closing a augmenté juste parce que je comprends mieux mes chiffres.", avatar:"TB" },
];

const OBJECTIONS = [
  { q:"C'est compliqué à mettre en place ?", a:"Non. Tu te connectes avec Google, tu crées tes offres en 2 minutes, et tu commences à loguer tes appels immédiatement. Zéro configuration technique." },
  { q:"Mes données sont sécurisées ?", a:"Oui. Chaque utilisateur a ses propres données isolées. Nous utilisons Supabase avec authentification Google OAuth — le même niveau de sécurité que les outils pros." },
  { q:"Je peux annuler quand je veux ?", a:"Absolument. Pas d'engagement, pas de frais cachés. Tu résilles en un email et tu gardes l'accès jusqu'à la fin du mois payé." },
  { q:"Ça marche pour les agences de closing ?", a:"Oui. Le mode multi-closer arrive bientôt. En attendant, chaque closer peut avoir son propre compte Kloze." },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{background:C.bg, color:C.white, fontFamily:SANS, minHeight:"100vh", overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(230,53,53,.25); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 99px; }
        a { color: inherit; text-decoration: none; }
        .btn-primary {
          background: ${C.red}; color: white; border: none; border-radius: 10px;
          padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: ${SANS}; transition: all .2s; display: inline-block;
          box-shadow: 0 4px 24px rgba(230,53,53,.35);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(230,53,53,.45); }
        .btn-ghost {
          background: transparent; color: ${C.muted}; border: 1px solid ${C.border2};
          border-radius: 10px; padding: 14px 28px; font-size: 15px; font-weight: 500;
          cursor: pointer; font-family: ${SANS}; transition: all .2s; display: inline-block;
        }
        .btn-ghost:hover { border-color: ${C.border3}; color: ${C.off}; }
        @keyframes pulse-red { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>

      {/* NAVBAR */}
      <nav style={{position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"16px 0", transition:"all .3s", background: scrolled?"rgba(6,6,6,.95)":"transparent", backdropFilter: scrolled?"blur(20px)":"none", borderBottom: scrolled?`1px solid ${C.border}`:"none"}}>
        <div style={{maxWidth:1100, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{width:28, height:28, borderRadius:6, background:`linear-gradient(135deg,${C.red},${C.redDim})`, display:"flex", alignItems:"center", justifyContent:"center"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <span style={{fontSize:16, fontWeight:700, letterSpacing:-.3}}>Kloze</span>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <a href="/auth" className="btn-ghost" style={{padding:"8px 18px", fontSize:13}}>Se connecter</a>
            <a href="/auth" className="btn-primary" style={{padding:"8px 18px", fontSize:13}}>Essai gratuit</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", padding:"120px 24px 80px"}}>
        <div style={{position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)", width:600, height:600, borderRadius:"50%", background:`radial-gradient(circle, rgba(230,53,53,.08) 0%, transparent 70%)`, pointerEvents:"none"}}/>
        <div style={{position:"absolute", top:0, left:0, right:0, bottom:0, backgroundImage:`radial-gradient(circle at 1px 1px, rgba(255,255,255,.03) 1px, transparent 0)`, backgroundSize:"40px 40px", pointerEvents:"none"}}/>

        <div style={{maxWidth:900, margin:"0 auto", textAlign:"center", position:"relative"}}>
          <div style={{display:"inline-flex", alignItems:"center", gap:8, background:"rgba(230,53,53,.08)", border:"1px solid rgba(230,53,53,.2)", borderRadius:99, padding:"6px 16px", marginBottom:32}}>
            <div style={{width:6, height:6, borderRadius:"50%", background:C.red, animation:"pulse-red 2s infinite"}}/>
            <span style={{fontSize:12, fontWeight:500, color:C.redText, letterSpacing:.5}}>Le CRM conçu pour les closers</span>
          </div>

          <h1 style={{fontSize:"clamp(40px, 7vw, 80px)", fontWeight:900, lineHeight:1.05, letterSpacing:-2.5, marginBottom:24}}>
            Arrête de deviner.<br/>
            <span style={{color:C.red}}>Visualise exactement</span><br/>
            ce que tu génères.
          </h1>

          <p style={{fontSize:"clamp(16px, 2vw, 20px)", color:C.muted, lineHeight:1.7, maxWidth:580, margin:"0 auto 48px", fontWeight:400}}>
            Kloze centralise tes appels, tes deals et tes commissions en temps réel. Fini les fichiers Excel, fini les doutes — juste tes chiffres, clairs et nets.
          </p>

          <div style={{display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:64}}>
            <a href="/auth" className="btn-primary" style={{fontSize:16, padding:"16px 36px"}}>Commencer gratuitement →</a>
            <a href="#features" className="btn-ghost" style={{fontSize:16, padding:"16px 36px"}}>Voir les fonctionnalités</a>
          </div>

          <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:16, flexWrap:"wrap"}}>
            <div style={{display:"flex"}}>
              {["LM","SK","TB","EV"].map((initials,i) => (
                <div key={i} style={{width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${C.red},${C.redDim})`, border:`2px solid ${C.bg}`, marginLeft: i>0?-10:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"white"}}>{initials}</div>
              ))}
            </div>
            <span style={{fontSize:13, color:C.muted}}><span style={{color:C.white, fontWeight:600}}>+50 closers</span> utilisent déjà Kloze</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{padding:"0 24px 80px"}}>
        <div style={{maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:C.border, borderRadius:16, overflow:"hidden"}}>
          {STATS.map((s,i) => (
            <AnimatedSection key={i} delay={i*80}>
              <div style={{background:C.surface, padding:"32px 24px", textAlign:"center"}}>
                <div style={{fontSize:42, fontWeight:900, color:C.red, letterSpacing:-1.5, lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:12, color:C.muted, marginTop:8, letterSpacing:.3}}>{s.label}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{padding:"80px 24px"}}>
        <div style={{maxWidth:1100, margin:"0 auto"}}>
          <AnimatedSection>
            <div style={{textAlign:"center", marginBottom:64}}>
              <div style={{fontSize:11, fontWeight:700, color:C.red, letterSpacing:2, textTransform:"uppercase", marginBottom:16}}>Fonctionnalités</div>
              <h2 style={{fontSize:"clamp(28px, 4vw, 48px)", fontWeight:800, letterSpacing:-1.5, marginBottom:16}}>Tout ce dont un closer<br/>a besoin, rien de plus.</h2>
              <p style={{fontSize:16, color:C.muted, maxWidth:480, margin:"0 auto"}}>Pas de bloat, pas de fonctions inutiles. Kloze est taillé pour le closing, et rien d'autre.</p>
            </div>
          </AnimatedSection>

          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:C.border, borderRadius:16, overflow:"hidden"}}>
            {FEATURES.map((f,i) => (
              <AnimatedSection key={i} delay={i*60}>
                <div style={{background:C.surface, padding:"32px 28px", height:"100%", transition:"background .2s"}}
                  onMouseEnter={(e:any)=>e.currentTarget.style.background=C.card2}
                  onMouseLeave={(e:any)=>e.currentTarget.style.background=C.surface}>
                  <div style={{width:40, height:40, borderRadius:10, background:"rgba(230,53,53,.08)", border:"1px solid rgba(230,53,53,.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#ff6b6b", marginBottom:16}}>{FEATURE_ICONS[f.icon]}</div>
                  <div style={{fontSize:16, fontWeight:700, color:C.white, marginBottom:10, letterSpacing:-.3}}>{f.title}</div>
                  <div style={{fontSize:13, color:C.muted, lineHeight:1.7}}>{f.desc}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section style={{padding:"80px 24px"}}>
        <div style={{maxWidth:1100, margin:"0 auto"}}>
          <AnimatedSection>
            <div style={{textAlign:"center", marginBottom:40}}>
              <h2 style={{fontSize:"clamp(24px, 3vw, 40px)", fontWeight:800, letterSpacing:-1.2}}>Tout en un seul dashboard.</h2>
            </div>
            <div style={{background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:32, position:"relative", overflow:"hidden"}}>
              <div style={{position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.red},transparent)`}}/>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:24}}>
                <div style={{width:10, height:10, borderRadius:"50%", background:"#ff5f57"}}/>
                <div style={{width:10, height:10, borderRadius:"50%", background:"#febc2e"}}/>
                <div style={{width:10, height:10, borderRadius:"50%", background:"#28c840"}}/>
                <span style={{fontSize:12, color:C.muted, marginLeft:8}}>kloze.vercel.app</span>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12}}>
                {[["Cash Collecté","12 400 €",C.green],["Comm. Active","1 240 €",C.red],["Closing Rate","33%",C.blue],["Show-up Rate","78%",C.amber]].map(([l,v,c]:any,i) => (
                  <div key={i} style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px"}}>
                    <div style={{fontSize:10, color:C.muted, fontWeight:500, letterSpacing:.3, marginBottom:8, textTransform:"uppercase"}}>{l}</div>
                    <div style={{fontSize:22, fontWeight:700, color:c, letterSpacing:-.5}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                {["Cash collecté / jour","Taux de closing"].map((title, i) => (
                  <div key={i} style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px"}}>
                    <div style={{fontSize:10, color:C.muted, fontWeight:500, letterSpacing:.3, marginBottom:12, textTransform:"uppercase"}}>{title}</div>
                    <div style={{display:"flex", alignItems:"flex-end", gap:4, height:48}}>
                      {[40,65,30,80,55,90,70,45,85,60,95,75].map((h,j) => (
                        <div key={j} style={{flex:1, height:`${h}%`, background:i===0?`linear-gradient(180deg,${C.red},${C.redDim})`:`linear-gradient(180deg,${C.blue},#1d4ed8)`, borderRadius:"2px 2px 0 0", opacity:.8}}/>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{padding:"80px 24px"}}>
        <div style={{maxWidth:1100, margin:"0 auto"}}>
          <AnimatedSection>
            <div style={{textAlign:"center", marginBottom:56}}>
              <div style={{fontSize:11, fontWeight:700, color:C.red, letterSpacing:2, textTransform:"uppercase", marginBottom:16}}>Témoignages</div>
              <h2 style={{fontSize:"clamp(28px, 4vw, 44px)", fontWeight:800, letterSpacing:-1.5}}>Ce que disent les closers</h2>
            </div>
          </AnimatedSection>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16}}>
            {TESTIMONIALS.map((t,i) => (
              <AnimatedSection key={i} delay={i*100}>
                <div style={{background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"28px 24px", height:"100%", position:"relative"}}>
                  <div style={{position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,${C.red}40,transparent)`}}/>
                  <div style={{fontSize:13, color:C.off, lineHeight:1.8, marginBottom:24, fontStyle:"italic"}}>"{t.text}"</div>
                  <div style={{display:"flex", alignItems:"center", gap:12}}>
                    <div style={{width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,rgba(230,53,53,.3),rgba(192,32,32,.1))`, border:`1px solid rgba(230,53,53,.2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.redText}}>{t.avatar}</div>
                    <div>
                      <div style={{fontSize:13, fontWeight:600, color:C.white}}>{t.name}</div>
                      <div style={{fontSize:11, color:C.muted}}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{padding:"80px 24px"}}>
        <div style={{maxWidth:700, margin:"0 auto", textAlign:"center"}}>
          <AnimatedSection>
            <div style={{fontSize:11, fontWeight:700, color:C.red, letterSpacing:2, textTransform:"uppercase", marginBottom:16}}>Tarifs</div>
            <h2 style={{fontSize:"clamp(28px, 4vw, 48px)", fontWeight:800, letterSpacing:-1.5, marginBottom:16}}>Simple. Transparent. Efficace.</h2>
            <p style={{fontSize:16, color:C.muted, marginBottom:48}}>Un seul plan, tout inclus. Pas de surprise.</p>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div style={{background:C.surface, border:"1px solid rgba(230,53,53,.25)", borderRadius:24, padding:"48px 40px", position:"relative", overflow:"hidden"}}>
              <div style={{position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${C.red},transparent)`}}/>
              <div style={{display:"inline-block", background:"rgba(230,53,53,.1)", border:"1px solid rgba(230,53,53,.2)", borderRadius:99, padding:"4px 14px", fontSize:11, fontWeight:700, color:C.redText, letterSpacing:.5, marginBottom:24}}>KLOZE PRO</div>
              <div style={{marginBottom:8}}>
                <span style={{fontSize:64, fontWeight:900, letterSpacing:-2, color:C.white}}>29</span>
                <span style={{fontSize:20, color:C.muted, fontWeight:400}}>€/mois</span>
              </div>
              <div style={{fontSize:13, color:C.muted, marginBottom:40}}>10 jours gratuits — aucune CB requise</div>
              <div style={{display:"flex", flexDirection:"column", gap:12, marginBottom:40, textAlign:"left"}}>
                {["Dashboard & KPIs temps réel","Suivi illimité des appels et deals","Calcul automatique des commissions","Analytics & funnel de conversion","Suivi des objections","Agenda + intégration Calendly","Performance par offre","Accès depuis tous tes appareils"].map((f,i) => (
                  <div key={i} style={{display:"flex", alignItems:"center", gap:12}}>
                    <div style={{width:18, height:18, borderRadius:"50%", background:"rgba(34,197,94,.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{fontSize:14, color:C.off}}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="/auth" className="btn-primary" style={{display:"block", textAlign:"center", fontSize:16, padding:"16px 0", width:"100%"}}>Commencer mon essai gratuit →</a>
              <p style={{fontSize:12, color:C.muted, marginTop:16}}>Pas d'engagement · Annulation à tout moment</p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section style={{padding:"80px 24px"}}>
        <div style={{maxWidth:700, margin:"0 auto"}}>
          <AnimatedSection>
            <div style={{textAlign:"center", marginBottom:56}}>
              <div style={{fontSize:11, fontWeight:700, color:C.red, letterSpacing:2, textTransform:"uppercase", marginBottom:16}}>FAQ</div>
              <h2 style={{fontSize:"clamp(28px, 4vw, 44px)", fontWeight:800, letterSpacing:-1.5}}>Questions fréquentes</h2>
            </div>
          </AnimatedSection>
          <div style={{display:"flex", flexDirection:"column", gap:1, background:C.border, borderRadius:16, overflow:"hidden"}}>
            {OBJECTIONS.map((o,i) => (
              <div key={i} style={{background:C.surface, cursor:"pointer"}} onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px"}}>
                  <span style={{fontSize:14, fontWeight:500, color:C.white}}>{o.q}</span>
                  <span style={{color:C.red, fontSize:18, transform: openFaq===i?"rotate(45deg)":"none", transition:"transform .2s", flexShrink:0, marginLeft:16}}>+</span>
                </div>
                {openFaq===i && (
                  <div style={{padding:"0 24px 20px", fontSize:13, color:C.muted, lineHeight:1.8}}>{o.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding:"80px 24px 120px"}}>
        <AnimatedSection>
          <div style={{maxWidth:800, margin:"0 auto", textAlign:"center", background:`linear-gradient(135deg,rgba(230,53,53,.08),rgba(230,53,53,.02))`, border:"1px solid rgba(230,53,53,.2)", borderRadius:24, padding:"64px 40px", position:"relative", overflow:"hidden"}}>
            <div style={{position:"absolute", top:-100, left:"50%", transform:"translateX(-50%)", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,rgba(230,53,53,.08),transparent 70%)`, pointerEvents:"none"}}/>
            <div style={{fontSize:11, fontWeight:700, color:C.red, letterSpacing:2, textTransform:"uppercase", marginBottom:20}}>Prêt à prendre le contrôle ?</div>
            <h2 style={{fontSize:"clamp(28px, 4vw, 52px)", fontWeight:900, letterSpacing:-1.5, marginBottom:16}}>
              Lance-toi.<br/>Les 10 premiers jours sont offerts.
            </h2>
            <p style={{fontSize:16, color:C.muted, marginBottom:40, maxWidth:480, margin:"0 auto 40px"}}>Rejoins les closers qui ont arrêté de deviner et commencé à piloter leurs revenus.</p>
            <a href="/auth" className="btn-primary" style={{fontSize:17, padding:"18px 48px"}}>Créer mon compte gratuit →</a>
            <p style={{fontSize:12, color:C.muted, marginTop:20}}>Connexion avec Google · Aucune CB · 10 jours offerts</p>
          </div>
        </AnimatedSection>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${C.border}`, padding:"32px 24px"}}>
        <div style={{maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16}}>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{width:22, height:22, borderRadius:5, background:`linear-gradient(135deg,${C.red},${C.redDim})`, display:"flex", alignItems:"center", justifyContent:"center"}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
            </div>
            <span style={{fontSize:13, fontWeight:600}}>Kloze</span>
            <span style={{fontSize:12, color:C.muted}}>— Le CRM des closers</span>
          </div>
          <div style={{fontSize:12, color:C.muted}}>© 2025 Kloze. Tous droits réservés.</div>
        </div>
      </footer>
    </div>
  );
}

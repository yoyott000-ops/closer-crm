'use client'
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from '../lib/supabase';
// next-auth remplacé par supabase OAuth
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const C = {
  bg:"#060606", surface:"#0a0a0a", card:"#0f0f0f", card2:"#141414",
  border:"#161616", border2:"#1e1e1e", border3:"#262626",
  red:"#e63535", redDim:"#c02020", redText:"#ff6b6b", redBg:"rgba(230,53,53,.05)",
  white:"#f0f0f0", off:"#d4d4d4", muted:"#5a5a5a", muted2:"#333333", muted3:"#222222",
  green:"#22c55e", amber:"#f59e0b", blue:"#3b82f6", purple:"#8b5cf6",
  shadow:"0 1px 3px rgba(0,0,0,.4),0 1px 2px rgba(0,0,0,.6)",
  shadowLg:"0 8px 32px rgba(0,0,0,.6)",
  shadowRed:"0 0 0 1px rgba(230,53,53,.2),0 4px 16px rgba(230,53,53,.08)",
};
const SANS = `'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`;
const FONT = `'JetBrains Mono','Fira Code',monospace`;
const RATE = 0.10;
const getRate=(offers:any[],offerId:string,c:any=null)=>{ const o=offers.find((x:any)=>x.id===offerId); if(!o) return RATE; const isPIF=c&&c.paymentType==="one_shot"&&Number(c.cashCollecte||0)>=Number(c.prixAccompagnement||0)&&Number(c.prixAccompagnement||0)>0; const taux=isPIF&&o.commissionBonus>0?o.commissionBonus:o.commission||10; return taux/100; };
const PIE_COLORS = [C.red, C.blue, C.amber, C.purple, C.green, "#ec4899"];

const OBJECTIONS=[
  {v:"prix",             l:"Prix",                 color:"#e63535"},
  {v:"timing",           l:"Timing",               color:"#f59e0b"},
  {v:"manque_confiance", l:"Manque de confiance",  color:"#a855f7"},
  {v:"reflechir",        l:"Besoin de reflechir",  color:"#3b82f6"},
  {v:"partenaire",       l:"Parler au partenaire", color:"#10b981"},
  {v:"pas_besoin",       l:"Pas de besoin",        color:"#64748b"},
  {v:"autre",            l:"Autre",                color:"#777777"},
];

const STATUTS: Record<string, { label:string; color:string; bg:string; dot:string }> = {
  booked:        { label:"Booké",         color:C.purple, bg:"rgba(168,85,247,.1)",  dot:C.purple },
  no_show:       { label:"No Show",       color:C.muted,  bg:"rgba(136,136,136,.1)", dot:C.muted  },
  call_done:     { label:"Call Done",     color:C.blue,   bg:"rgba(59,130,246,.1)",  dot:C.blue   },
  offer_pitched: { label:"Offre Pitchée", color:C.amber,  bg:"rgba(245,158,11,.1)",  dot:C.amber  },
  sale:          { label:"Vente ✓",       color:C.green,  bg:"rgba(34,197,94,.1)",   dot:C.green  },
};

const defaultOffers = [
  { id:"o1", name:"Formation Closing Elite", price:2900, type:"one_shot", commission:10, commissionBonus:15 },
  { id:"o2", name:"Coaching Premium",        price:3000, type:"monthly",  commission:10, commissionBonus:15 },
  { id:"o3", name:"Mastermind VIP",          price:4900, type:"one_shot", commission:10, commissionBonus:15 },
];

function mk(id:string,date:string,prospect:string,offerId:string,status:string,prix:number,type:string,nbM:number,rest:number,cash:number,notes:string=""): any {
  const mensualite = type==="monthly"&&nbM>0 ? Math.round(prix/nbM*100)/100 : (type==="one_shot"?prix:0);
  return { id,date,prospect,email:"",offerId,status,notes,prixAccompagnement:prix,paymentType:type,nombreMensualites:nbM,mensualite,mensualitesRestantes:rest,cashCollecte:cash,datePaiement:date };
}

const defaultCalls = [
  mk("c1","2025-03-01","Thomas Dupont",  "o1","sale",         2900,"one_shot",1, 0, 2900,"Close direct"),
  mk("c2","2025-03-02","Julie Martin",   "o2","sale",         3000,"monthly", 6, 4, 1000,"Paiement 6x"),
  mk("c3","2025-03-03","Marc Bernard",   "o1","no_show",      0,   "one_shot",1, 0, 0),
  mk("c4","2025-03-04","Sophie Leclerc", "o2","sale",         3000,"monthly", 6, 6, 500, "Close 30min"),
  mk("c5","2025-03-05","Kevin Moreau",   "o3","offer_pitched",4900,"one_shot",1, 0, 0,   "Objection prix"),
  mk("c6","2025-03-06","Camille Petit",  "o1","sale",         2900,"one_shot",1, 0, 2900,"Close 45min"),
  mk("c7","2025-03-07","Antoine Roux",   "o3","call_done",    0,   "one_shot",1, 0, 0),
  mk("c8","2025-03-07","Laura Simon",    "o2","sale",         6000,"monthly", 12,10,1000,"12 mois"),
  mk("c9","2025-03-08","Alexis Fontaine","o1","booked",       0,   "one_shot",1, 0, 0,   "RDV demain"),
  mk("c10","2025-03-08","Clara Dubois",  "o2","no_show",      0,   "one_shot",1, 0, 0,   "Pas répondu"),
  mk("c11","2025-03-09","Nadia Benali",  "o3","sale",         4900,"one_shot",1, 0, 4900,"VIP close"),
  mk("c12","2025-03-10","Pierre Garnier","o1","offer_pitched",2900,"one_shot",1, 0, 0,   "Rappel lundi"),
  mk("c13","2025-03-11","Emma Rousseau", "o2","sale",         3000,"monthly", 6, 5, 500, "Motivée"),
  mk("c14","2025-03-12","Lucas Bernard", "o1","no_show",      0,   "one_shot",1, 0, 0),
  mk("c15","2025-03-13","Sarah Cohen",   "o3","sale",         4900,"one_shot",1, 0, 4900,"Decision maker"),
];

function commissionDeal(c:any,rate=RATE):number{ if(c.status!=="sale") return 0; return Math.round(Number(c.cashCollecte||0)*rate*100)/100; }
function commissionMensuelle(c:any,rate=RATE):number{ if(c.status!=="sale"||c.paymentType!=="monthly") return 0; return Math.round(Number(c.mensualite||0)*rate*100)/100; }
function commissionActive(c:any,rate=RATE):number{ if(c.status!=="sale"||c.paymentType!=="monthly") return 0; if(!c.mensualitesRestantes||c.mensualitesRestantes<=0) return 0; return commissionMensuelle(c,rate); }
function getCommActiveGlobale(calls:any[],offers:any[]):number{ return calls.reduce((s:number,c:any)=>s+commissionActive(c,getRate(offers,c.offerId,c)),0); }

function computeKpi(calls:any[],offers:any[]=[]) {
  const effectues=calls.filter((c:any)=>["call_done","offer_pitched","sale"].includes(c.status)).length;
  const pitched=calls.filter((c:any)=>["offer_pitched","sale"].includes(c.status)).length;
  const sales=calls.filter((c:any)=>c.status==="sale");
  const cashCollecte=sales.reduce((s:number,c:any)=>s+Number(c.cashCollecte||0),0);
  const cashContracte=sales.reduce((s:number,c:any)=>s+Number(c.prixAccompagnement||0),0);
  const commTotale=Math.round(sales.reduce((s:number,c:any)=>s+commissionDeal(c,getRate(offers,c.offerId,c)),0)*100)/100;
  const commContractee=Math.round(sales.reduce((s:number,c:any)=>s+Math.round(Number(c.prixAccompagnement||0)*getRate(offers,c.offerId,c)*100)/100,0)*100)/100;
  const commActive2=calls.reduce((s:number,c:any)=>s+commissionActive(c,getRate(offers,c.offerId,c)),0);
  return {
    bookes:calls.length, effectues, pitched, noShows:calls.filter((c:any)=>c.status==="no_show").length, sales:sales.length,
    cashCollecte, cashContracte, commTotale, commContractee, commActive:commActive2,
    showUpRate:   calls.length>0?Math.round(effectues/calls.length*1000)/10:0,
    pitchRate:    effectues>0?Math.round(pitched/effectues*1000)/10:0,
    closingRate:  effectues>0?Math.round(sales.length/effectues*1000)/10:0,
    revenuePerCall: effectues>0?Math.round(cashCollecte/effectues):0,
  };
}

const PERIODS=[{v:"7d",l:"7J"},{v:"30d",l:"30J"},{v:"month",l:"Mois"},{v:"year",l:"Année"},{v:"all",l:"Tout"},{v:"custom",l:"Custom"}];

function filterByPeriod(calls:any[],period:string,s?:string,e?:string) {
  if(period==="all") return calls;
  const now=new Date(); let from=new Date(now); const to=new Date(now); to.setHours(23,59,59,999);
  if(period==="custom"&&s&&e){ from=new Date(s); from.setHours(0,0,0,0); const te=new Date(e); te.setHours(23,59,59,999); return calls.filter((c:any)=>{const d=new Date(c.date);return d>=from&&d<=te;}); }
  if(period==="7d") from.setDate(now.getDate()-7);
  if(period==="30d") from.setDate(now.getDate()-30);
  if(period==="month"){from.setDate(1);from.setHours(0,0,0,0);}
  if(period==="year"){from.setMonth(0,1);from.setHours(0,0,0,0);}
  return calls.filter((c:any)=>{const d=new Date(c.date);return d>=from&&d<=to;});
}

function buildChart(calls:any[]) {
  const map=new Map();
  [...calls].sort((a,b)=>a.date.localeCompare(b.date)).forEach((c:any)=>{
    const d=new Date(c.date); const k=`${String(d.getDate()).padStart(2,"0")}/${d.getMonth()+1}`;
    if(!map.has(k)) map.set(k,{date:k,cash:0,comm:0,ventes:0,appels:0,effectues:0,closing:0});
    const e=map.get(k); e.appels++;
    if(["call_done","offer_pitched","sale"].includes(c.status)) e.effectues++;
    if(c.status==="sale"){e.ventes++;e.cash+=Number(c.cashCollecte||0);e.comm+=commissionDeal(c);}
  });
  const arr=Array.from(map.values());
  arr.forEach(e=>{e.closing=e.effectues>0?Math.round(e.ventes/e.effectues*100):0;});
  return arr.slice(-14);
}

const uid=()=>Math.random().toString(36).slice(2,10);
const fmt=(v:number)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(v||0);
const fmtD=(d:string)=>d?new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}):"—";
const today=()=>new Date().toISOString().split("T")[0];

function Badge({status}:{status:string}){
  const s=STATUTS[status]||STATUTS.booked;
  return <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:5,background:s.bg,color:s.color,fontSize:11,fontWeight:500,fontFamily:SANS,border:`1px solid ${s.color}20`,whiteSpace:"nowrap",letterSpacing:.2}}><span style={{width:4,height:4,borderRadius:"50%",background:s.color,display:"inline-block",flexShrink:0}}/>{s.label}</span>;
}

function KpiCard({label,value,sub,accent=false,small=false,delay=0,trend}:any){
  const [show,setShow]=useState(false);
  const [hov,setHov]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setShow(true),delay);return()=>clearTimeout(t);},[delay]);
  return(
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        background:accent?`linear-gradient(145deg,rgba(230,53,53,.07),rgba(230,53,53,.02))`:hov?C.card2:C.card,
        border:`1px solid ${accent?`rgba(230,53,53,.2)`:hov?C.border2:C.border}`,
        borderRadius:12,padding:"22px 24px",
        opacity:show?1:0,transform:show?"translateY(0)":"translateY(6px)",
        transition:"all .3s ease",position:"relative",overflow:"hidden",
        boxShadow:hov?(accent?C.shadowRed:C.shadow):"none",cursor:"default"
      }}>
      {accent&&<div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,${C.red}80,transparent)`}}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <span style={{fontSize:11,fontWeight:400,color:C.muted,fontFamily:SANS,letterSpacing:.3}}>{label}</span>
        {trend!==undefined&&<span style={{fontSize:11,fontWeight:500,color:trend>=0?C.green:C.red,fontFamily:SANS,background:trend>=0?"rgba(34,197,94,.08)":"rgba(230,53,53,.08)",padding:"2px 7px",borderRadius:99}}>{trend>=0?"+":""}{trend}%</span>}
      </div>
      <div style={{fontSize:small?24:30,fontWeight:600,color:accent?C.redText:C.white,fontFamily:SANS,lineHeight:1,letterSpacing:-1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.muted,marginTop:8,fontFamily:SANS}}>{sub}</div>}
    </div>
  );
}

function RateCard({label,value,sub,ok,warn,delay=0}:any){
  const [show,setShow]=useState(false);
  const [hov,setHov]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setShow(true),delay);return()=>clearTimeout(t);},[delay]);
  const color=ok?C.green:warn?C.amber:C.red;
  const colorBg=ok?"rgba(34,197,94,.06)":warn?"rgba(245,158,11,.06)":"rgba(230,53,53,.06)";
  return(
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{background:hov?C.card2:C.card,border:`1px solid ${hov?C.border2:C.border}`,borderRadius:12,padding:"22px 24px",opacity:show?1:0,transform:show?"translateY(0)":"translateY(6px)",transition:"all .3s ease",boxShadow:hov?C.shadow:"none"}}>
      <div style={{fontSize:11,fontWeight:400,color:C.muted,fontFamily:SANS,marginBottom:14,letterSpacing:.3}}>{label}</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:14}}>
        <div style={{fontSize:32,fontWeight:600,color,fontFamily:SANS,lineHeight:1,letterSpacing:-1}}>{value}<span style={{fontSize:17,fontWeight:400,opacity:.6}}>%</span></div>
      </div>
      <div style={{height:3,background:C.border2,borderRadius:99,overflow:"hidden",marginBottom:10,position:"relative"}}>
        <div style={{height:"100%",width:`${Math.min(value,100)}%`,background:`linear-gradient(90deg,${color}cc,${color})`,borderRadius:99,transition:"width 1.2s cubic-bezier(.4,0,.2,1)",boxShadow:`0 0 8px ${color}44`}}/>
      </div>
      {sub&&<div style={{fontSize:11,color:C.muted,fontFamily:SANS}}>{sub}</div>}
    </div>
  );
}

function Modal({open,onClose,title,children}:any){
  if(!open) return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(12px)"}} onClick={onClose}/>
      <div style={{position:"relative",background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",margin:"0 16px",boxShadow:"0 24px 64px rgba(0,0,0,.8)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:C.surface,zIndex:1}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:600,color:C.white,fontFamily:SANS}}>{title}</h3>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,cursor:"pointer",color:C.muted,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,transition:"all .15s"}} onMouseEnter={(e:any)=>{e.currentTarget.style.background=C.border2;e.currentTarget.style.color=C.white;}} onMouseLeave={(e:any)=>{e.currentTarget.style.background=C.card;e.currentTarget.style.color=C.muted;}}>✕</button>
        </div>
        <div style={{padding:"24px"}}>{children}</div>
      </div>
    </div>
  );
}

const inp:any={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.white,outline:"none",boxSizing:"border-box",fontFamily:SANS,transition:"border-color .15s"};
const autoInp:any={...inp,background:C.card2,color:C.redText,fontWeight:600,cursor:"default",display:"flex",alignItems:"center",border:`1px solid ${C.border}`};
const selInp:any={...inp,backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23555' d='M5 7L1 3h8z'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",appearance:"none",paddingRight:"32px"};

function FLabel({label,children,half,third,hint}:any){
  return(
    <div style={{flex:third?"1 1 calc(33% - 8px)":half?"1 1 calc(50% - 6px)":"1 1 100%"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
        <span style={{fontSize:11,fontWeight:500,color:C.muted,fontFamily:SANS}}>{label}</span>
        {hint&&<span style={{fontSize:11,color:C.muted2,fontFamily:SANS}}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Sep({label}:{label:string}){
  return(
    <div style={{width:"100%",display:"flex",alignItems:"center",gap:12,margin:"6px 0"}}>
      <div style={{flex:1,height:1,background:C.border}}/>
      <span style={{fontSize:10,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:SANS}}>{label}</span>
      <div style={{flex:1,height:1,background:C.border}}/>
    </div>
  );
}

function ChartTip({active,payload,label,money=false}:any){
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:C.surface,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 14px",fontSize:12,fontFamily:SANS,boxShadow:"0 8px 24px rgba(0,0,0,.6)",zIndex:9999,position:"relative"}}>
      <div style={{color:C.muted,marginBottom:6,fontWeight:700}}>{label}</div>
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{color:p.color||C.white,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:p.color||C.white,display:"inline-block",flexShrink:0}}/>
          {p.name} : {money?fmt(p.value):p.value}{!money&&(p.dataKey==="closing"||p.dataKey==="showUpRate"||p.dataKey==="closingRate"||p.dataKey==="pitchRate")?"%":""}
        </div>
      ))}
    </div>
  );
}

const TOOLTIP_WRAPPER_STYLE = {
  zIndex: 9999,
  outline: "none",
};

const PIE_TOOLTIP_STYLE = {
  zIndex: 9999,
  outline: "none",
  position: "fixed" as const,
};

function PieTip({active,payload}:any){
  if(!active||!payload?.length) return null;
  const p=payload[0];
  return(
    <div style={{background:C.surface,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 14px",fontSize:12,fontFamily:SANS,boxShadow:"0 8px 24px rgba(0,0,0,.8)",zIndex:9999,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:p.payload?.fill||p.color||C.red,display:"inline-block",flexShrink:0}}/>
        <span style={{color:C.white,fontWeight:700}}>{p.name}</span>
      </div>
      <div style={{color:p.color||C.white,fontWeight:800,fontSize:14,marginTop:4}}>{fmt(p.value)}</div>
    </div>
  );
}


function DashboardPage({calls,offers}:any){
  const [period,setPeriod]=useState("month");
  const [start,setStart]=useState(""); const [end,setEnd]=useState("");
  const [offerF,setOfferF]=useState("all");
  const filtered=useMemo(()=>{let c=filterByPeriod(calls,period,start,end);if(offerF!=="all")c=c.filter((x:any)=>x.offerId===offerF);return c;},[calls,period,start,end,offerF]);
  const kpi=useMemo(()=>computeKpi(filtered,offers),[filtered,offers]);
  const commActive=useMemo(()=>getCommActiveGlobale(calls,offers),[calls,offers]);
  const chart=useMemo(()=>buildChart(filtered),[filtered]);
  const dealsActifs=useMemo(()=>calls.filter((c:any)=>c.status==="sale"&&c.paymentType==="monthly"&&c.mensualitesRestantes>0),[calls]);
  const byOffer=useMemo(()=>{const map=new Map();filtered.filter((c:any)=>c.status==="sale").forEach((c:any)=>{const o=offers.find((x:any)=>x.id===c.offerId);const n=o?.name?.split(" ").slice(0,2).join(" ")||"Autre";map.set(n,(map.get(n)||0)+Number(c.cashCollecte||0));});return Array.from(map.entries()).map(([name,value])=>({name,value}));},[filtered,offers]);
  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h2 style={{margin:0,fontSize:20,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.4}}>Dashboard</h2><p style={{margin:"4px 0 0",fontSize:12,color:C.muted,fontFamily:SANS}}>Performance commerciale en temps réel</p></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",background:C.card,borderRadius:6,padding:2,gap:1,border:`1px solid ${C.border}`}}>
            {PERIODS.map(p=><button key={p.v} onClick={()=>setPeriod(p.v)} style={{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:500,background:period===p.v?C.red:"transparent",color:period===p.v?C.white:C.muted,fontFamily:SANS,transition:"all .15s"}}>{p.l}</button>)}
          </div>
          {period==="custom"&&<div style={{display:"flex",gap:6,alignItems:"center"}}><input type="date" value={start} onChange={(e:any)=>setStart(e.target.value)} style={{...inp,width:130,padding:"5px 8px",fontSize:11}}/><span style={{color:C.muted2}}>→</span><input type="date" value={end} onChange={(e:any)=>setEnd(e.target.value)} style={{...inp,width:130,padding:"5px 8px",fontSize:11}}/></div>}
          <select value={offerF} onChange={(e:any)=>setOfferF(e.target.value)} style={{...selInp,width:"auto",padding:"6px 26px 6px 10px",fontSize:11}}>
            <option value="all">Toutes les offres</option>
            {offers.map((o:any)=><option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{background:`linear-gradient(135deg,rgba(230,53,53,.06),rgba(230,53,53,.02))`,border:`1px solid rgba(230,53,53,.15)`,borderRadius:14,padding:"24px 28px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20,position:"relative",overflow:"hidden",boxShadow:C.shadowRed}}>
        <div style={{position:"absolute",top:-80,right:-80,width:240,height:240,borderRadius:"50%",background:`radial-gradient(circle,rgba(230,53,53,.06),transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,left:-20,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,rgba(230,53,53,.04),transparent 70%)`,pointerEvents:"none"}}/>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><div style={{width:6,height:6,borderRadius:"50%",background:C.red,boxShadow:`0 0 6px ${C.red}`}}/><span style={{fontSize:11,fontWeight:500,color:C.red,letterSpacing:.8,fontFamily:SANS,textTransform:"uppercase"}}>Commission Mensuelle Active</span></div>
          <div style={{fontSize:38,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-1.5,lineHeight:1}}>{fmt(commActive)}<span style={{fontSize:16,fontWeight:400,color:C.muted,marginLeft:6}}>/mois</span></div>
          <div style={{fontSize:11,color:C.muted,marginTop:3,fontFamily:SANS}}>{dealsActifs.length} deal{dealsActifs.length!==1?"s":""} actif{dealsActifs.length!==1?"s":""}</div>
        </div>
        <div style={{display:"flex",gap:24}}>
          {[{l:"Show-up",v:`${kpi.showUpRate}%`,ok:kpi.showUpRate>=70},{l:"Closing",v:`${kpi.closingRate}%`,ok:kpi.closingRate>=20},{l:"Rev/Call",v:fmt(kpi.revenuePerCall),ok:kpi.revenuePerCall>500}].map((s,i)=>(
            <div key={i} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:s.ok?C.green:C.redText,fontFamily:SANS}}>{s.v}</div><div style={{fontSize:10,color:C.muted,fontFamily:SANS,textTransform:"uppercase",letterSpacing:.8}}>{s.l}</div></div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:10}}>
        <RateCard delay={0}   label="Show-up Rate"    value={kpi.showUpRate}    ok={kpi.showUpRate>=70}    warn={kpi.showUpRate>=50}   sub={`${kpi.effectues}/${kpi.bookes} bookés`}/>
        <RateCard delay={60}  label="Pitch Rate"      value={kpi.pitchRate}     ok={kpi.pitchRate>=60}     warn={kpi.pitchRate>=40}    sub={`${kpi.pitched}/${kpi.effectues} effectués`}/>
        <RateCard delay={120} label="Closing Rate"    value={kpi.closingRate}   ok={kpi.closingRate>=20}   warn={kpi.closingRate>=12}  sub={`${kpi.sales}/${kpi.effectues} effectués`}/>
        <KpiCard delay={180} label="Revenue/Call" value={fmt(kpi.revenuePerCall)} sub={`${fmt(kpi.cashCollecte)} / ${kpi.effectues} appels`} accent={kpi.revenuePerCall>=800}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:10}}>
        <KpiCard delay={240} label="Cash Collecté"      value={fmt(kpi.cashCollecte)}  accent/>
        <KpiCard delay={280} label="Cash Contracté"     value={fmt(kpi.cashContracte)} sub={`${kpi.sales} vente${kpi.sales!==1?"s":""}`}/>
        <KpiCard delay={320} label="Commission Générée" value={fmt(kpi.commTotale)}    sub={`10% de ${fmt(kpi.cashContracte)}`}/>
        <KpiCard delay={360} label="Comm. Active"       value={fmt(commActive)}        accent sub="/mois"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <KpiCard delay={400} label="Appels Bookés"    value={kpi.bookes}    small/>
        <KpiCard delay={430} label="Appels Effectués" value={kpi.effectues} small sub={`${kpi.noShows} no show${kpi.noShows!==1?"s":""}`}/>
        <KpiCard delay={460} label="Offres Pitchées"  value={kpi.pitched}   small/>
        <KpiCard delay={490} label="Ventes"           value={kpi.sales}     small accent/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <div style={{fontSize:11,fontWeight:500,color:C.muted,fontFamily:SANS,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Cash Collecté</div>
              <div style={{fontSize:24,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.8}}>{fmt(kpi.cashCollecte)}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart} margin={{top:5,right:5,left:-10,bottom:0}}>
              <defs>
                <linearGradient id="gCashBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.red} stopOpacity={.9}/>
                  <stop offset="100%" stopColor={C.red} stopOpacity={.4}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>v>=1000?v/1000+"k":String(v)}/>
              <Tooltip content={<ChartTip money/>} wrapperStyle={TOOLTIP_WRAPPER_STYLE} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
              <Bar dataKey="cash" name="Cash" fill="url(#gCashBar)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <div style={{fontSize:11,fontWeight:500,color:C.muted,fontFamily:SANS,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Closing Rate</div>
              <div style={{fontSize:24,fontWeight:600,color:kpi.closingRate>=20?C.green:kpi.closingRate>=12?C.amber:C.red,fontFamily:SANS,letterSpacing:-.8}}>{kpi.closingRate}%</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart} margin={{top:5,right:5,left:-10,bottom:0}}>
              <defs>
                <linearGradient id="gCloseBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={.9}/>
                  <stop offset="100%" stopColor={C.green} stopOpacity={.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={(v:number)=>v+"%"}/>
              <Tooltip content={<ChartTip/>} wrapperStyle={TOOLTIP_WRAPPER_STYLE} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
              <Bar dataKey="closing" name="Closing %" fill="url(#gCloseBar)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <div style={{fontSize:11,fontWeight:500,color:C.muted,fontFamily:SANS,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Commission Générée</div>
          <div style={{fontSize:24,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.8,marginBottom:20}}>{fmt(kpi.commTotale)}</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chart} margin={{top:5,right:5,left:-10,bottom:0}}>
              <defs>
                <linearGradient id="gCommBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.amber} stopOpacity={.9}/>
                  <stop offset="100%" stopColor={C.amber} stopOpacity={.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>v>=1000?v/1000+"k":String(v)}/>
              <Tooltip content={<ChartTip money/>} wrapperStyle={TOOLTIP_WRAPPER_STYLE} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
              <Bar dataKey="comm" name="Commission" fill="url(#gCommBar)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <div style={{fontSize:11,fontWeight:500,color:C.muted,fontFamily:SANS,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Ventes par Offre</div>
          <div style={{fontSize:24,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.8,marginBottom:16}}>{kpi.sales} vente{kpi.sales!==1?"s":""}</div>
          {byOffer.length>0?(
            <ResponsiveContainer width="100%" height={180}>
              <PieChart style={{overflow:"visible"}}>
                <Pie data={byOffer} cx="50%" cy="44%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {byOffer.map((_:any,i:number)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip content={<PieTip/>} wrapperStyle={PIE_TOOLTIP_STYLE}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:11,fontFamily:SANS,color:C.muted,paddingTop:8}}/>
              </PieChart>
            </ResponsiveContainer>
          ):<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:180,color:C.muted,fontSize:12,fontFamily:SANS,gap:10}}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".25"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>Aucune vente</div>}
        </div>
      </div>
            {dealsActifs.length>0&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",boxShadow:C.shadow}}>
          <div style={{padding:"16px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:SANS}}>Deals Actifs — Commission Mensuelle</div>
            <div style={{fontSize:13,fontWeight:800,color:C.redText,fontFamily:SANS}}>{fmt(commActive)}/mois</div>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#0d0d0d"}}>{["Prospect","Offre","Mensualité","Mens. restantes","Comm./mois"].map(h=><th key={h} style={{padding:"8px 16px",textAlign:h==="Prospect"||h==="Offre"?"left":"right" as any,fontSize:10,fontWeight:700,color:C.muted2,textTransform:"uppercase",letterSpacing:.8,fontFamily:SANS}}>{h}</th>)}</tr></thead>
            <tbody>
              {dealsActifs.map((c:any)=>{
                const o=offers.find((x:any)=>x.id===c.offerId); const cm=c.paymentType==="one_shot"?commissionDeal(c,getRate(offers,c.offerId,c)):commissionActive(c,getRate(offers,c.offerId,c));
                return(<tr key={c.id} style={{borderTop:`1px solid ${C.border}`}}>
                  <td style={{padding:"11px 16px",fontWeight:600,color:C.white,fontFamily:SANS}}>{c.prospect}</td>
                  <td style={{padding:"11px 16px",color:C.muted,fontFamily:SANS}}>{o?.name||"—"}</td>
                  <td style={{padding:"11px 16px",textAlign:"right",color:C.white,fontFamily:SANS}}>{fmt(c.mensualite)}</td>
                  <td style={{padding:"11px 16px",textAlign:"right"}}><span style={{background:"rgba(59,130,246,.12)",color:C.blue,padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:500,fontFamily:SANS}}>{c.mensualitesRestantes}x</span></td>
                  <td style={{padding:"11px 16px",textAlign:"right"}}><span style={{background:`${C.red}18`,color:C.redText,padding:"2px 10px",borderRadius:4,fontSize:12,fontWeight:800,fontFamily:SANS}}>{fmt(cm)}/mois</span></td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CallsPage({calls,offers,onAdd,onUpdate,onDelete}:any){
  const [search,setSearch]=useState(""); const [statusF,setStatusF]=useState("all"); const [offerF,setOfferF]=useState("all");
  const [show,setShow]=useState(false); const [edit,setEdit]=useState<any>(null);
  const empty:any={date:today(),prospect:"",email:"",offerId:"",status:"booked",notes:"",objection:"",prixAccompagnement:0,paymentType:"one_shot",nombreMensualites:1,mensualite:0,mensualitesPayees:0,mensualitesRestantes:0,cashCollecte:0,datePaiement:today()};
  const [form,setForm]=useState(empty);
  const setF=(k:string,v:any)=>setForm((f:any)=>{
    const u={...f,[k]:v};
    const type=k==="paymentType"?v:u.paymentType; const prix=Number(k==="prixAccompagnement"?v:u.prixAccompagnement); const nbM=Number(k==="nombreMensualites"?v:u.nombreMensualites);
    if(type==="monthly"&&prix>0&&nbM>0){
      const restant=Math.max(0,prix-Number(u.cashCollecte||0));
      u.mensualite=Math.round(restant/nbM*100)/100;
      u.mensualitesPayees=0;
      u.mensualitesRestantes=nbM;
    } else if(type==="one_shot"){u.mensualite=prix;u.nombreMensualites=1;u.mensualitesRestantes=0;u.mensualitesPayees=0;}
    return u;
  });
  const filtered=useMemo(()=>calls.filter((c:any)=>c.prospect.toLowerCase().includes(search.toLowerCase())&&(statusF==="all"||c.status===statusF)&&(offerF==="all"||c.offerId===offerF)),[calls,search,statusF,offerF]);
  const openAdd=()=>{setForm(empty);setEdit(null);setShow(true);};
  const openEdit=(c:any)=>{setForm({...c});setEdit(c);setShow(true);};
  const submit=()=>{if(!form.prospect)return;edit?onUpdate(edit.id,form):onAdd(form);setShow(false);};
  const isPitched=["offer_pitched","sale"].includes(form.status); const isSale=form.status==="sale";
  const offreSelectionnee=offers.find((o:any)=>o.id===form.offerId);const isPIFForm=form.paymentType==="one_shot"&&Number(form.cashCollecte||0)>=Number(form.prixAccompagnement||0)&&Number(form.prixAccompagnement||0)>0;const tauxForm=isPIFForm&&offreSelectionnee?.commissionBonus>0?offreSelectionnee.commissionBonus/100:offreSelectionnee?.commission>0?offreSelectionnee.commission/100:RATE;const commMois=form.paymentType==="monthly"&&form.mensualite>0?Math.round(form.mensualite*tauxForm*100)/100:0;
  const commTotal=form.paymentType==="one_shot"&&form.prixAccompagnement>0?Math.round(form.prixAccompagnement*tauxForm*100)/100:0;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div><h2 style={{margin:0,fontSize:20,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.3}}>Appels & Deals</h2><p style={{margin:"2px 0 0",fontSize:12,color:C.muted,fontFamily:SANS}}>{calls.length} appels</p></div>
        <button onClick={openAdd} style={{background:C.red,color:C.white,border:"none",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:SANS,letterSpacing:.1}}>+ Nouvel Appel</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={(e:any)=>setSearch(e.target.value)} placeholder="Rechercher..." style={{...inp,width:180,padding:"7px 11px",fontSize:12}}/>
        <div style={{display:"flex",background:C.card,borderRadius:6,padding:2,gap:1,border:`1px solid ${C.border}`}}>
          {["all",...Object.keys(STATUTS)].map(s=><button key={s} onClick={()=>setStatusF(s)} style={{padding:"4px 9px",borderRadius:4,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,background:statusF===s?C.red:"transparent",color:statusF===s?C.white:C.muted,fontFamily:SANS,whiteSpace:"nowrap",transition:"all .12s"}}>{s==="all"?"Tous":STATUTS[s].label}</button>)}
        </div>
        <select value={offerF} onChange={(e:any)=>setOfferF(e.target.value)} style={{...selInp,width:"auto",padding:"6px 24px 6px 10px",fontSize:11}}>
          <option value="all">Toutes offres</option>
          {offers.map((o:any)=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:880}}>
          <thead><tr style={{background:C.surface,borderBottom:`1px solid ${C.border}`}}>{["Prospect","Date","Offre","Statut","Prix","Mensualité","Mens.","Comm./m",""].map((h,i)=><th key={i} style={{padding:"11px 16px",textAlign:i>=4&&i<=7?"right":i===8?"right":"left" as any,fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:.6,fontFamily:SANS,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={9} style={{padding:"40px 0",textAlign:"center",color:C.muted2,fontSize:12,fontFamily:SANS}}>Aucun appel</td></tr>}
            {filtered.map((c:any)=>{
              const o=offers.find((x:any)=>x.id===c.offerId); const cm=c.paymentType==="one_shot"?commissionDeal(c,getRate(offers,c.offerId,c)):commissionActive(c,getRate(offers,c.offerId,c));
              return(<tr key={c.id} style={{borderTop:`1px solid ${C.border}`}} onMouseEnter={(e:any)=>e.currentTarget.style.background=C.card2} onMouseLeave={(e:any)=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"11px 14px"}}><div style={{fontWeight:600,color:C.white,fontFamily:SANS}}>{c.prospect}</div>{c.email&&<div style={{fontSize:10,color:C.muted2}}>{c.email}</div>}</td>
                <td style={{padding:"11px 14px",color:C.muted,fontFamily:SANS,whiteSpace:"nowrap"}}>{fmtD(c.date)}</td>
                <td style={{padding:"11px 14px"}}>{o?<span style={{fontSize:10,background:"#1e1e1e",color:C.muted,padding:"2px 7px",borderRadius:4,fontWeight:600,fontFamily:SANS,border:`1px solid ${C.border2}`}}>{o.name}</span>:<span style={{color:C.muted2}}>—</span>}</td>
                <td style={{padding:"11px 14px"}}><Badge status={c.status}/></td>
                <td style={{padding:"11px 14px",textAlign:"right",color:c.prixAccompagnement>0?C.white:C.muted2,fontFamily:SANS}}>{c.prixAccompagnement>0?fmt(c.prixAccompagnement):"—"}</td>
                <td style={{padding:"11px 14px",textAlign:"right",color:c.mensualite>0&&c.paymentType==="monthly"?C.blue:C.muted2,fontFamily:SANS}}>{c.mensualite>0&&c.paymentType==="monthly"?fmt(c.mensualite):"—"}</td>
                <td style={{padding:"11px 14px",textAlign:"right"}}>{c.paymentType==="monthly"&&c.mensualitesRestantes>0?<span style={{background:"rgba(59,130,246,.12)",color:C.blue,padding:"2px 7px",borderRadius:4,fontSize:11,fontWeight:700,fontFamily:SANS}}>{c.mensualitesRestantes}x</span>:<span style={{color:C.muted2}}>—</span>}</td>
                <td style={{padding:"11px 14px",textAlign:"right"}}>{cm>0?<span style={{background:`${C.red}18`,color:C.redText,padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:800,fontFamily:SANS}}>{fmt(cm)}/m</span>:<span style={{color:C.muted2}}>—</span>}</td>
                <td style={{padding:"11px 14px",textAlign:"right"}}><div style={{display:"flex",gap:5,justifyContent:"flex-end"}}>
                  <button onClick={()=>openEdit(c)} style={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:SANS,transition:"all .15s"}}>Éditer</button>
                  <button onClick={()=>{if(window.confirm("Supprimer ?"))onDelete(c.id);}} style={{background:`rgba(230,53,53,.06)`,border:`1px solid rgba(230,53,53,.2)`,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:500,color:C.redText,cursor:"pointer",fontFamily:SANS,transition:"all .15s"}}>✕</button>
                </div></td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
      <Modal open={show} onClose={()=>setShow(false)} title={edit?"Modifier l'appel":"Nouvel appel"}>
        <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
          <FLabel label="Prospect *"><input style={inp} value={form.prospect} onChange={(e:any)=>setF("prospect",e.target.value)} placeholder="Jean Dupont"/></FLabel>
          <FLabel label="Date *" half><input type="date" style={inp} value={form.date} onChange={(e:any)=>setF("date",e.target.value)}/></FLabel>
          <FLabel label="Email" half><input style={inp} value={form.email} onChange={(e:any)=>setF("email",e.target.value)} placeholder="jean@email.com"/></FLabel>
          <FLabel label="Offre" half><select style={selInp} value={form.offerId} onChange={(e:any)=>setF("offerId",e.target.value)}><option value="">— Sans offre —</option>{offers.map((o:any)=><option key={o.id} value={o.id}>{o.name}</option>)}</select></FLabel>
          <FLabel label="Statut *" half><select style={selInp} value={form.status} onChange={(e:any)=>setF("status",e.target.value)}>{Object.entries(STATUTS).map(([k,s])=><option key={k} value={k}>{s.label}</option>)}</select></FLabel>
          {isPitched&&<>
            <Sep label="Deal"/>
            <FLabel label="Prix accompagnement (€) *" hint="Prix réel vendu"><input type="number" style={inp} value={form.prixAccompagnement} onChange={(e:any)=>setF("prixAccompagnement",+e.target.value)} placeholder="3000"/></FLabel>
            <FLabel label="Type de paiement">
              <div style={{display:"flex",gap:8}}>
                {[{v:"one_shot",l:"⚡ One Shot"},{v:"monthly",l:"🔁 Mensuel"}].map(t=><button key={t.v} onClick={()=>setF("paymentType",t.v)} style={{flex:1,padding:"10px 0",borderRadius:8,border:`1px solid ${form.paymentType===t.v?`rgba(230,53,53,.4)`:C.border}`,background:form.paymentType===t.v?`rgba(230,53,53,.08)`:C.card,color:form.paymentType===t.v?C.redText:C.muted,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:SANS,transition:"all .15s"}}>{t.l}</button>)}
              </div>
            </FLabel>
            {form.paymentType==="monthly"?<>
              <FLabel label="Nb mensualités" half hint="ex: 6"><input type="number" style={inp} value={form.nombreMensualites} onChange={(e:any)=>setF("nombreMensualites",+e.target.value)} placeholder="6" min="1"/></FLabel>
              <FLabel label="Mensualité (auto)" half hint="Prix ÷ Nb"><div style={autoInp}>{fmt(form.mensualite)}</div></FLabel>
              <FLabel label="Mensualités restantes" half><input type="number" style={inp} value={form.mensualitesRestantes} onChange={(e:any)=>setF("mensualitesRestantes",+e.target.value)} placeholder="4" min="0"/></FLabel>
              <FLabel label="Date 1er paiement" half><input type="date" style={inp} value={form.datePaiement} onChange={(e:any)=>setF("datePaiement",e.target.value)}/></FLabel>
              {commMois>0&&<div style={{width:"100%",background:`rgba(230,53,53,.05)`,border:`1px solid rgba(230,53,53,.15)`,borderRadius:10,padding:"16px 20px"}}>
                <div style={{fontSize:10,fontWeight:500,color:C.red,textTransform:"uppercase",letterSpacing:.8,marginBottom:8,fontFamily:SANS}}>⬤ Commission mensuelle active</div>
                <div style={{fontSize:26,fontWeight:600,color:C.redText,fontFamily:SANS,letterSpacing:-.5}}>{fmt(commMois)}<span style={{fontSize:13,fontWeight:400,color:C.muted}}>/mois</span></div>
                <div style={{fontSize:11,color:C.muted,marginTop:3,fontFamily:SANS}}>{fmt(form.mensualite)} × 10% × {form.mensualitesRestantes} mens. restante{form.mensualitesRestantes!==1?"s":""}</div>
              </div>}
            </>:<>
              <FLabel label="Date paiement" half><input type="date" style={inp} value={form.datePaiement} onChange={(e:any)=>setF("datePaiement",e.target.value)}/></FLabel>
              {commTotal>0&&<FLabel label="Commission one shot (auto)" half><div style={autoInp}>{fmt(commTotal)}</div></FLabel>}
            </>}
            {isSale&&<><Sep label="Encaissement"/><FLabel label="Cash collecté (€)" hint="Déjà encaissé"><input type="number" style={inp} value={form.cashCollecte} onChange={(e:any)=>setF("cashCollecte",+e.target.value)} placeholder="500"/></FLabel></>}
          </>}
          <FLabel label="Objection principale"><select style={selInp} value={form.objection||""} onChange={(e:any)=>setF("objection",e.target.value)}><option value="">— Aucune —</option>{OBJECTIONS.map((o:any)=><option key={o.v} value={o.v}>{o.l}</option>)}</select></FLabel><FLabel label="Notes"><textarea style={{...inp,resize:"vertical",minHeight:64}} value={form.notes} onChange={(e:any)=>setF("notes",e.target.value)} placeholder="Next steps..."/></FLabel>
          <div style={{display:"flex",gap:8,width:"100%",marginTop:4}}>
            <button onClick={submit} style={{flex:1,background:C.red,color:C.white,border:"none",borderRadius:8,padding:"11px 0",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:SANS,letterSpacing:.1,transition:"all .15s",boxShadow:`0 2px 8px rgba(230,53,53,.25)`}}>{edit?"Mettre à jour":"Enregistrer"}</button>
            <button onClick={()=>setShow(false)} style={{padding:"11px 18px",border:`1px solid ${C.border}`,borderRadius:8,background:"transparent",color:C.muted,fontSize:12,fontWeight:400,cursor:"pointer",fontFamily:SANS,transition:"all .15s"}}>Annuler</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function OffersPage({offers,onAdd,onUpdate,onDelete}:any){
  const [show,setShow]=useState(false); const [edit,setEdit]=useState<any>(null);
  const empty={name:"",description:"",price:0,type:"one_shot",commission:10,commissionBonus:10};
  const [form,setForm]=useState(empty);
  const sf=(k:string,v:any)=>setForm((f:any)=>({...f,[k]:v}));
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div><h2 style={{margin:0,fontSize:20,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.3}}>Offres</h2><p style={{margin:"2px 0 0",fontSize:12,color:C.muted,fontFamily:SANS}}>{offers.length} offre{offers.length!==1?"s":""}</p></div>
        <button onClick={()=>{setForm(empty);setEdit(null);setShow(true);}} style={{background:C.red,color:C.white,border:"none",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:SANS,letterSpacing:.1}}>+ Nouvelle Offre</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {offers.map((o:any)=>(
          <div key={o.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,position:"relative",overflow:"hidden",transition:"all .2s ease",boxShadow:"none"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:o.type==="monthly"?`linear-gradient(90deg,${C.purple},transparent)`:`linear-gradient(90deg,${C.red},transparent)`}}/>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
              <div style={{width:38,height:38,borderRadius:8,background:o.type==="monthly"?`${C.purple}22`:`${C.red}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{o.type==="monthly"?"🔁":"⚡"}</div>
              <div style={{display:"flex",gap:5}}>
                <button onClick={()=>{setForm({name:o.name,description:o.description||"",price:o.price,type:o.type,commission:o.commission||10,commissionBonus:o.commissionBonus||o.commission||10});setEdit(o);setShow(true);}} style={{background:"#1e1e1e",border:`1px solid ${C.border2}`,borderRadius:5,padding:"3px 9px",fontSize:10,color:C.muted,cursor:"pointer",fontFamily:SANS}}>Éditer</button>
                <button onClick={()=>{if(window.confirm("Supprimer ?"))onDelete(o.id);}} style={{background:`${C.red}12`,border:`1px solid ${C.red}33`,borderRadius:5,padding:"3px 9px",fontSize:10,color:C.redText,cursor:"pointer",fontFamily:SANS}}>✕</button>
              </div>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:C.white,marginBottom:4,fontFamily:SANS}}>{o.name}</div>
            {o.description&&<div style={{fontSize:11,color:C.muted,marginBottom:14,lineHeight:1.5,fontFamily:SANS}}>{o.description}</div>}
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",paddingTop:14,borderTop:`1px solid ${C.border}`}}>
              <div><div style={{fontSize:24,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.5}}>{fmt(o.price)}</div><div style={{fontSize:10,color:C.muted2,fontFamily:SANS}}>{o.type==="monthly"?"par mois":"one shot"}</div></div>
              <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:4,background:o.type==="monthly"?`${C.purple}22`:`${C.red}18`,color:o.type==="monthly"?C.purple:C.redText,fontFamily:SANS,border:`1px solid ${o.type==="monthly"?C.purple+"44":C.red+"33"}`}}>{o.type==="monthly"?"Mensuel":"One Shot"}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal open={show} onClose={()=>setShow(false)} title={edit?"Modifier":"Nouvelle offre"}>
        <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
          <FLabel label="Nom *"><input style={inp} value={form.name} onChange={(e:any)=>sf("name",e.target.value)} placeholder="Formation Closing Elite"/></FLabel>
          <FLabel label="Description"><textarea style={{...inp,resize:"vertical",minHeight:56}} value={form.description} onChange={(e:any)=>sf("description",e.target.value)}/></FLabel>
          <FLabel label="Prix (€)" half><input type="number" style={inp} value={form.price} onChange={(e:any)=>sf("price",+e.target.value)}/></FLabel><FLabel label="Commission (%)" half><input type="number" style={inp} value={form.commission||10} onChange={(e:any)=>sf("commission",+e.target.value)} min="0" max="100"/></FLabel><FLabel label="Bonus PIF (%)" half><input type="number" style={inp} value={form.commissionBonus||form.commission||10} onChange={(e:any)=>sf("commissionBonus",+e.target.value)} min="0" max="100"/></FLabel>
          <FLabel label="Type" half><select style={selInp} value={form.type} onChange={(e:any)=>sf("type",e.target.value)}><option value="one_shot">One Shot</option><option value="monthly">Mensuel</option></select></FLabel>
          <div style={{display:"flex",gap:8,width:"100%",marginTop:4}}>
            <button onClick={()=>{if(!form.name)return;edit?onUpdate(edit.id,form):onAdd(form);setShow(false);}} style={{flex:1,background:C.red,color:C.white,border:"none",borderRadius:8,padding:"11px 0",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:SANS,letterSpacing:.1,transition:"all .15s",boxShadow:`0 2px 8px rgba(230,53,53,.25)`}}>{edit?"Mettre à jour":"Créer"}</button>
            <button onClick={()=>setShow(false)} style={{padding:"11px 18px",border:`1px solid ${C.border}`,borderRadius:8,background:"transparent",color:C.muted,fontSize:12,fontWeight:400,cursor:"pointer",fontFamily:SANS,transition:"all .15s"}}>Annuler</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AnalyticsPage({calls,offers}:any){
  const [period,setPeriod]=useState("month");
  const kpiAll=useMemo(()=>computeKpi(calls,offers),[calls,offers]);
  const kpiMonth=useMemo(()=>computeKpi(filterByPeriod(calls,"month"),offers),[calls,offers]);
  const kpiWeek=useMemo(()=>computeKpi(filterByPeriod(calls,"7d"),offers),[calls,offers]);
  const chart=useMemo(()=>buildChart(filterByPeriod(calls,period)),[calls,period]);
  const commActive=useMemo(()=>getCommActiveGlobale(calls,offers),[calls,offers]);
  const funnel=[{label:"Bookés",value:kpiAll.bookes,color:C.purple},{label:"Effectués",value:kpiAll.effectues,color:C.blue},{label:"Pitchés",value:kpiAll.pitched,color:C.amber},{label:"Ventes",value:kpiAll.sales,color:C.green}];
  const Cmp=({label,month,week,color=C.white}:any)=>(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"14px 16px"}}>
      <div style={{fontSize:10,fontWeight:700,color:C.muted2,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontFamily:SANS}}>{label}</div>
      <div style={{display:"flex"}}>
        <div style={{flex:1,borderRight:`1px solid ${C.border}`,paddingRight:10}}><div style={{fontSize:16,fontWeight:800,color,fontFamily:SANS}}>{month}</div><div style={{fontSize:9,color:C.muted2,marginTop:2,fontFamily:SANS}}>Ce mois</div></div>
        <div style={{flex:1,paddingLeft:10}}><div style={{fontSize:16,fontWeight:800,color,fontFamily:SANS}}>{week}</div><div style={{fontSize:9,color:C.muted2,marginTop:2,fontFamily:SANS}}>7 jours</div></div>
      </div>
    </div>
  );
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div><h2 style={{margin:0,fontSize:20,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.3}}>Analytics</h2><p style={{margin:"2px 0 0",fontSize:12,color:C.muted,fontFamily:SANS}}>Analyse approfondie</p></div>
        <div style={{display:"flex",background:C.card,borderRadius:6,padding:2,gap:1,border:`1px solid ${C.border}`}}>
          {[{v:"7d",l:"7J"},{v:"30d",l:"30J"},{v:"month",l:"Mois"},{v:"year",l:"Année"}].map(p=><button key={p.v} onClick={()=>setPeriod(p.v)} style={{padding:"5px 11px",borderRadius:4,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:period===p.v?C.red:"transparent",color:period===p.v?C.white:C.muted,fontFamily:SANS,transition:"all .12s"}}>{p.l}</button>)}
        </div>
      </div>
      <div style={{background:`linear-gradient(135deg,rgba(230,53,53,.06),rgba(230,53,53,.02))`,border:`1px solid rgba(230,53,53,.15)`,borderRadius:14,padding:"22px 28px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,boxShadow:C.shadowRed}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:2,fontFamily:SANS,marginBottom:4}}>⬤ Commission Mensuelle Active</div>
          <div style={{fontSize:34,fontWeight:900,color:C.white,fontFamily:SANS,letterSpacing:-1}}>{fmt(commActive)}<span style={{fontSize:14,fontWeight:400,color:C.muted,marginLeft:4}}>/mois</span></div>
        </div>
        <div style={{display:"flex",gap:20}}>
          {[{l:"Show-up",v:`${kpiAll.showUpRate}%`},{l:"Pitch",v:`${kpiAll.pitchRate}%`},{l:"Closing",v:`${kpiAll.closingRate}%`},{l:"Rev/Call",v:fmt(kpiAll.revenuePerCall)}].map((s,i)=>(
            <div key={i} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.white,fontFamily:SANS}}>{s.v}</div><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.8,fontFamily:SANS}}>{s.l}</div></div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        <Cmp label="Commission" month={fmt(kpiMonth.commTotale)}   week={fmt(kpiWeek.commTotale)}   color={C.redText}/>
        <Cmp label="Cash"       month={fmt(kpiMonth.cashCollecte)} week={fmt(kpiWeek.cashCollecte)} color={C.green}/>
        <Cmp label="Show-up"    month={`${kpiMonth.showUpRate}%`}  week={`${kpiWeek.showUpRate}%`}  color={C.blue}/>
        <Cmp label="Closing"    month={`${kpiMonth.closingRate}%`} week={`${kpiWeek.closingRate}%`} color={C.green}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <div style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:.4,marginBottom:6,fontFamily:SANS}}>Funnel de Conversion</div>
              <div style={{fontSize:22,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.8}}>{kpiAll.bookes} bookés</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnel} style={{overflow:"visible"}} margin={{top:5,right:5,left:-10,bottom:0}}>
              <defs>
                {funnel.map((s:any,i:number)=>(
                  <linearGradient key={i} id={`gFunnel${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={.9}/>
                    <stop offset="100%" stopColor={s.color} stopOpacity={.3}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false}/>
              <XAxis dataKey="label" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip content={<ChartTip/>} wrapperStyle={TOOLTIP_WRAPPER_STYLE} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
              <Bar dataKey="value" name="Total" radius={[4,4,0,0]}>
                {funnel.map((_:any,i:number)=><Cell key={i} fill={`url(#gFunnel${i})`}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <div style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:.4,marginBottom:6,fontFamily:SANS}}>Commission & Ventes / Jour</div>
              <div style={{fontSize:22,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.8}}>{fmt(kpiAll.commTotale)}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart} margin={{top:5,right:5,left:-10,bottom:0}}>
              <defs>
                <linearGradient id="gAComm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.red} stopOpacity={.9}/>
                  <stop offset="100%" stopColor={C.red} stopOpacity={.3}/>
                </linearGradient>
                <linearGradient id="gAVentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={.9}/>
                  <stop offset="100%" stopColor={C.green} stopOpacity={.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>v>=1000?v/1000+"k":String(v)}/>
              <Tooltip content={<ChartTip money/>} wrapperStyle={TOOLTIP_WRAPPER_STYLE} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
              <Bar dataKey="comm" name="Commission" fill="url(#gAComm)" radius={[4,4,0,0]}/>
              <Bar dataKey="ventes" name="Ventes" fill="url(#gAVentes)" radius={[4,4,0,0]}/>
              <Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:11,fontFamily:SANS,color:C.muted,paddingTop:8}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


function ObjectionsPage({calls,offers}:any){
  const [period,setPeriod]=useState("month");
  const [offerF,setOfferF]=useState("all");
  const filtered=useMemo(()=>{
    let c=filterByPeriod(calls,period);
    if(offerF!=="all") c=c.filter((x:any)=>x.offerId===offerF);
    return c.filter((x:any)=>x.objection&&x.objection!=="");
  },[calls,period,offerF]);
  const stats=useMemo(()=>{
    const map=new Map();
    OBJECTIONS.forEach(o=>map.set(o.v,{v:o.v,l:o.l,color:o.color,total:0,ventes:0,perdues:0}));
    filtered.forEach((c:any)=>{
      if(!c.objection) return;
      if(!map.has(c.objection)) map.set(c.objection,{v:c.objection,l:c.objection,color:"#888",total:0,ventes:0,perdues:0});
      const s=map.get(c.objection); s.total++;
      if(c.status==="sale") s.ventes++; else s.perdues++;
    });
    return Array.from(map.values()).filter((s:any)=>s.total>0).sort((a:any,b:any)=>b.total-a.total);
  },[filtered]);
  const total=stats.reduce((s:number,x:any)=>s+x.total,0);
  const pieData=stats.map((s:any)=>({name:s.l,value:s.total,color:s.color}));
  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h2 style={{margin:0,fontSize:20,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.3}}>Objections</h2><p style={{margin:"2px 0 0",fontSize:12,color:C.muted,fontFamily:SANS}}>{total} objection{total!==1?"s":""}</p></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",background:C.card,borderRadius:6,padding:2,gap:1,border:`1px solid ${C.border}`}}>
            {PERIODS.map(p=><button key={p.v} onClick={()=>setPeriod(p.v)} style={{padding:"5px 10px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:period===p.v?C.red:"transparent",color:period===p.v?C.white:C.muted,fontFamily:SANS}}>{p.l}</button>)}
          </div>
          <select value={offerF} onChange={(e:any)=>setOfferF(e.target.value)} style={{...selInp,width:"auto",padding:"6px 26px 6px 10px",fontSize:11}}>
            <option value="all">Toutes les offres</option>
            {offers.map((o:any)=><option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>
      {total===0?(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"60px 0",textAlign:"center",color:C.muted,fontSize:13,fontFamily:SANS}}>Aucune objection sur cette période.</div>
      ):(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            {stats.slice(0,4).map((s:any,i:number)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 22px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color},transparent)`}}/>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontFamily:SANS}}>{s.l}</div>
                <div style={{fontSize:26,fontWeight:900,color:s.color,fontFamily:SANS}}>{s.total}</div>
                <div style={{fontSize:10,color:C.muted2,marginTop:4,fontFamily:SANS}}>{total>0?Math.round(s.total/total*100):0}% des objections</div>
                <div style={{display:"flex",gap:8,marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                  <div><div style={{fontSize:12,fontWeight:700,color:C.green,fontFamily:SANS}}>{s.ventes}</div><div style={{fontSize:9,color:C.muted2,fontFamily:SANS}}>ventes</div></div>
                  <div><div style={{fontSize:12,fontWeight:700,color:C.red,fontFamily:SANS}}>{s.perdues}</div><div style={{fontSize:9,color:C.muted2,fontFamily:SANS}}>perdues</div></div>
                  <div><div style={{fontSize:12,fontWeight:700,color:C.amber,fontFamily:SANS}}>{s.total>0?Math.round(s.ventes/s.total*100):0}%</div><div style={{fontSize:9,color:C.muted2,fontFamily:SANS}}>closing</div></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:.4,marginBottom:6,fontFamily:SANS}}>Fréquence des Objections</div>
                  <div style={{fontSize:24,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.8}}>{total} objection{total!==1?"s":""}</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats} style={{overflow:"visible"}} margin={{top:5,right:5,left:-10,bottom:30}}>
                  <defs>
                    {stats.map((s:any,i:number)=>(
                      <linearGradient key={i} id={`gObj${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={s.color} stopOpacity={.9}/>
                        <stop offset="100%" stopColor={s.color} stopOpacity={.3}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="l" tick={{fontSize:9,fill:C.muted}} axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0}/>
                  <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip content={<ChartTip/>} wrapperStyle={TOOLTIP_WRAPPER_STYLE} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
                  <Bar dataKey="total" name="Occurrences" radius={[4,4,0,0]}>
                    {stats.map((s:any,i:number)=><Cell key={i} fill={`url(#gObj${i})`}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8,fontFamily:SANS}}>Répartition</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart style={{overflow:"visible"}}>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((p:any,i:number)=><Cell key={i} fill={p.color}/>)}
                  </Pie>
                  <Tooltip content={<PieTip/>} wrapperStyle={PIE_TOOLTIP_STYLE}/>
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{fontSize:10,fontFamily:SANS,color:C.muted}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",boxShadow:C.shadow}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:SANS}}>Objection vs Résultat</div></div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:"#0d0d0d"}}>{["Objection","Occurrences","% du total","Ventes","Perdues","Taux closing"].map(h=><th key={h} style={{padding:"8px 16px",textAlign:h==="Objection"?"left":"right" as any,fontSize:10,fontWeight:700,color:C.muted2,textTransform:"uppercase",letterSpacing:.8,fontFamily:SANS}}>{h}</th>)}</tr></thead>
              <tbody>
                {stats.map((s:any,i:number)=>(
                  <tr key={i} style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:s.color}}/><span style={{fontWeight:600,color:C.white,fontFamily:SANS}}>{s.l}</span></div></td>
                    <td style={{padding:"12px 16px",textAlign:"right",fontWeight:700,color:C.white,fontFamily:SANS}}>{s.total}</td>
                    <td style={{padding:"12px 16px",textAlign:"right"}}><span style={{background:`${s.color}22`,color:s.color,padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:500,fontFamily:SANS}}>{total>0?Math.round(s.total/total*100):0}%</span></td>
                    <td style={{padding:"12px 16px",textAlign:"right",color:C.green,fontWeight:700,fontFamily:SANS}}>{s.ventes}</td>
                    <td style={{padding:"12px 16px",textAlign:"right",color:C.red,fontWeight:700,fontFamily:SANS}}>{s.perdues}</td>
                    <td style={{padding:"12px 16px",textAlign:"right"}}><span style={{background:s.total>0&&s.ventes/s.total>=0.3?"rgba(34,197,94,.15)":s.total>0&&s.ventes/s.total>=0.15?"rgba(245,158,11,.15)":"rgba(230,53,53,.15)",color:s.total>0&&s.ventes/s.total>=0.3?C.green:s.total>0&&s.ventes/s.total>=0.15?C.amber:C.red,padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:500,fontFamily:SANS}}>{s.total>0?Math.round(s.ventes/s.total*100):0}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PaiementsPage({calls,offers,onUpdate}:any){
  const [offerF,setOfferF]=useState("all");
  const MOIS=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const dealsActifs=useMemo(()=>calls.filter((c:any)=>c.status==="sale"&&c.paymentType==="monthly"&&c.nombreMensualites>0),[calls]);
  const filtered=useMemo(()=>offerF==="all"?dealsActifs:dealsActifs.filter((c:any)=>c.offerId===offerF),[dealsActifs,offerF]);
  const commActive=useMemo(()=>filtered.reduce((s:number,c:any)=>s+(c.mensualitesRestantes>0?commissionActive(c,getRate(offers,c.offerId,c)):0),0),[filtered,offers]);
  const now=new Date();
  const commRecueMois=useMemo(()=>{
    const m=now.getMonth(); const y=now.getFullYear();
    return calls.filter((c:any)=>c.status==="sale"&&c.paymentType==="monthly").reduce((s:number,c:any)=>{
      const d=new Date(c.datePaiement||c.date);
      if(d.getMonth()===m&&d.getFullYear()===y) return s+commissionMensuelle(c,getRate(offers,c.offerId,c));
      return s;
    },0);
  },[calls,offers]);
  const paiementsAttendus=useMemo(()=>{
    const m=now.getMonth(); const y=now.getFullYear();
    return filtered.filter((c:any)=>{const d=new Date(c.datePaiement||c.date);return d.getMonth()===m&&d.getFullYear()===y&&c.mensualitesRestantes>0;}).reduce((s:number,c:any)=>s+Number(c.mensualite||0),0);
  },[filtered]);
  const enRetard=useMemo(()=>filtered.filter((c:any)=>{if(c.mensualitesRestantes<=0)return false;const d=new Date(c.datePaiement||c.date);return d<now&&c.mensualitesRestantes>0;}).length,[filtered]);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [editRestantes,setEditRestantes]=useState(0);

  const getPct=(c:any)=>c.nombreMensualites>0?Math.round((c.nombreMensualites-c.mensualitesRestantes)/c.nombreMensualites*100):0;
  const getStatut=(c:any)=>{
    if(c.mensualitesRestantes<=0) return {l:"Terminé",color:C.muted2,bg:"rgba(136,136,136,.1)"};
    const d=new Date(c.datePaiement||c.date);
    if(d<now) return {l:"En retard",color:C.red,bg:`${C.red}18`};
    if(d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()) return {l:"Ce mois",color:C.amber,bg:"rgba(245,158,11,.1)"};
    return {l:"À venir",color:C.blue,bg:"rgba(59,130,246,.1)"};
  };
  const previsions=useMemo(()=>{
    return Array.from({length:6},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()+i,1);
      const comm=filtered.filter((c:any)=>c.mensualitesRestantes>0).reduce((s:number,c:any)=>{
        const start=new Date(c.datePaiement||c.date);
        const moisEcoules=Math.floor((d.getTime()-start.getTime())/(1000*60*60*24*30));
        if(moisEcoules>=0&&moisEcoules<c.nombreMensualites) return s+commissionMensuelle(c,getRate(offers,c.offerId,c));
        return s;
      },0);
      return {mois:MOIS[d.getMonth()].slice(0,3),comm:Math.round(comm)};
    });
  },[filtered,offers]);
  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h2 style={{margin:0,fontSize:20,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.3}}>Paiements</h2><p style={{margin:"2px 0 0",fontSize:12,color:C.muted,fontFamily:SANS}}>{dealsActifs.length} deal{dealsActifs.length!==1?"s":""} mensuel{dealsActifs.length!==1?"s":""} actif{dealsActifs.length!==1?"s":""}</p></div>
        <select value={offerF} onChange={(e:any)=>setOfferF(e.target.value)} style={{...selInp,width:"auto",padding:"6px 26px 6px 10px",fontSize:11}}>
          <option value="all">Toutes les offres</option>
          {offers.map((o:any)=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[
          {label:"Comm. Actives",       value:fmt(commActive),        sub:"/mois",      accent:true},
          {label:"Comm. Reçues Mois",   value:fmt(commRecueMois),     sub:"encaissées", accent:false},
          {label:"Paiements Attendus",  value:fmt(paiementsAttendus), sub:"ce mois",    accent:false},
          {label:"En Retard",           value:String(enRetard),       sub:"deals",      accent:enRetard>0},
        ].map((k,i)=>(
          <div key={i} style={{background:k.accent?`linear-gradient(145deg,rgba(230,53,53,.07),rgba(230,53,53,.02))`:C.card,border:`1px solid ${k.accent?"rgba(230,53,53,.2)":C.border}`,borderRadius:12,padding:"20px 24px",position:"relative",overflow:"hidden",boxShadow:k.accent?C.shadowRed:C.shadow}}>
            {k.accent&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.red},transparent)`}}/>}
            <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:SANS,marginBottom:8}}>{k.label}</div>
            <div style={{fontSize:24,fontWeight:800,color:k.accent?C.redText:C.white,fontFamily:SANS}}>{k.value}</div>
            {k.sub&&<div style={{fontSize:10,color:C.muted2,marginTop:5,fontFamily:SANS}}>{k.sub}</div>}
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <div style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:18,fontFamily:SANS}}>Commissions Prévues — 6 Mois</div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={previsions} margin={{top:5,right:5,left:-15,bottom:0}}>
              <defs><linearGradient id="gPrev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.red} stopOpacity={.8}/><stop offset="95%" stopColor={C.red} stopOpacity={.3}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="mois" tick={{fontSize:9,fill:C.muted2}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:C.muted2}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>v>=1000?v/1000+"k":String(v)}/>
              <Tooltip formatter={(v:number)=>[fmt(v),"Commission"]} contentStyle={{background:C.surface,border:`1px solid ${C.border2}`,borderRadius:8,fontSize:11,fontFamily:SANS,boxShadow:"0 8px 24px rgba(0,0,0,.6)"}} wrapperStyle={TOOLTIP_WRAPPER_STYLE} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
              <Bar dataKey="comm" fill="url(#gPrev)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <div style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:18,fontFamily:SANS}}>Progression des Deals</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.slice(0,5).map((c:any,i:number)=>{
              const pct=getPct(c);
              return(
                <div key={i}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4,fontFamily:SANS}}>
                    <span style={{color:C.white,fontWeight:600}}>{c.prospect}</span>
                    <span style={{color:C.muted2}}>{c.nombreMensualites-c.mensualitesRestantes}/{c.nombreMensualites}</span>
                  </div>
                  <div style={{height:4,background:C.border2,borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:pct>=100?C.green:pct>=50?C.amber:C.red,borderRadius:99}}/>
                  </div>
                </div>
              );
            })}
            {filtered.length>5&&<div style={{fontSize:10,color:C.muted2,fontFamily:SANS,textAlign:"center"}}>+{filtered.length-5} autres</div>}
          </div>
        </div>
      </div>
      {filtered.length===0?(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"60px 0",textAlign:"center",color:C.muted,fontSize:13,fontFamily:SANS}}>Aucun deal mensuel actif.</div>
      ):(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"auto"}}>
          <div style={{padding:"16px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:SANS}}>Détail des Paiements</div>
            <div style={{fontSize:13,fontWeight:800,color:C.redText,fontFamily:SANS}}>{fmt(commActive)}/mois</div>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:900}}>
            <thead><tr style={{background:"#0d0d0d"}}>{["Client","Offre","Mensualité","Comm./mois","Payées","Restantes","Progression","Prochaine date","Statut","Màj"].map(h=><th key={h} style={{padding:"11px 16px",textAlign:h==="Client"||h==="Offre"?"left":"center" as any,fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:.6,fontFamily:SANS,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((c:any)=>{
                const o=offers.find((x:any)=>x.id===c.offerId);
                const cm=commissionActive(c,getRate(offers,c.offerId,c));
                const pct=getPct(c); const statut=getStatut(c);
                const payees=c.nombreMensualites-c.mensualitesRestantes;
                return(
                  <tr key={c.id} style={{borderTop:`1px solid ${C.border}`}} onMouseEnter={(e:any)=>e.currentTarget.style.background=C.card2} onMouseLeave={(e:any)=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"12px 14px"}}><div style={{fontWeight:600,color:C.white,fontFamily:SANS}}>{c.prospect}</div><div style={{fontSize:10,color:C.muted2}}>{fmt(c.prixAccompagnement)} total</div></td>
                    <td style={{padding:"12px 14px"}}>{o?<span style={{fontSize:10,background:"#1e1e1e",color:C.muted,padding:"2px 7px",borderRadius:4,fontFamily:SANS,border:`1px solid ${C.border2}`}}>{o.name}</span>:<span style={{color:C.muted2}}>—</span>}</td>
                    <td style={{padding:"12px 14px",textAlign:"center",color:C.white,fontWeight:700,fontFamily:SANS}}>{fmt(c.mensualite)}</td>
                    <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{background:`${C.red}18`,color:C.redText,padding:"3px 10px",borderRadius:4,fontSize:12,fontWeight:800,fontFamily:SANS}}>{fmt(cm)}</span></td>
                    <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{background:"rgba(34,197,94,.12)",color:C.green,padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:500,fontFamily:SANS}}>{payees}x</span></td>
                    <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{background:"rgba(59,130,246,.12)",color:C.blue,padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:500,fontFamily:SANS}}>{c.mensualitesRestantes}x</span></td>
                    <td style={{padding:"12px 14px",textAlign:"center",minWidth:120}}>
                      <div style={{height:4,background:C.border2,borderRadius:99,overflow:"hidden",marginBottom:3}}><div style={{height:"100%",width:`${pct}%`,background:pct>=100?C.green:pct>=50?C.amber:C.red,borderRadius:99}}/></div>
                      <div style={{fontSize:9,color:C.muted2,fontFamily:SANS}}>{pct}%</div>
                    </td>
                    <td style={{padding:"12px 14px",textAlign:"center",color:C.muted,fontFamily:SANS,whiteSpace:"nowrap"}}>{fmtD(c.datePaiement||c.date)}</td>
                    <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{background:statut.bg,color:statut.color,padding:"3px 10px",borderRadius:4,fontSize:11,fontWeight:700,fontFamily:SANS,border:`1px solid ${statut.color}33`}}>{statut.l}</span></td>
                  <td style={{padding:"12px 14px",textAlign:"center"}}>
                    {editingId===c.id?(
                      <div style={{display:"flex",gap:4,alignItems:"center",justifyContent:"center"}}>
                        <input type="number" value={editRestantes} onChange={(e:any)=>setEditRestantes(+e.target.value)} min="0" max={c.nombreMensualites} style={{...inp,width:52,padding:"4px 8px",fontSize:12,textAlign:"center"}} placeholder="0"/>
                        <button onClick={async()=>{
                          const payees=c.nombreMensualites-editRestantes;
                          await onUpdate(c.id,{...c,mensualitesRestantes:editRestantes,mensualitesPayees:payees});
                          setEditingId(null);
                        }} style={{background:C.green,border:"none",borderRadius:6,padding:"4px 8px",fontSize:11,color:C.white,cursor:"pointer",fontFamily:SANS,fontWeight:500}}>✓</button>
                        <button onClick={()=>setEditingId(null)} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",fontSize:11,color:C.muted,cursor:"pointer",fontFamily:SANS}}>✕</button>
                      </div>
                    ):(
                      <button onClick={()=>{setEditingId(c.id);setEditRestantes(c.mensualitesRestantes);}} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",fontSize:11,color:C.muted,cursor:"pointer",fontFamily:SANS,transition:"all .15s"}} onMouseEnter={(e:any)=>{e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor=C.border2;}} onMouseLeave={(e:any)=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border;}}>Màj</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
  );
}

function PerformancesOffresPage({calls,offers}:any){
  const [period,setPeriod]=useState("month");
  const [start,setStart]=useState("");
  const [end,setEnd]=useState("");
  const filtered=useMemo(()=>filterByPeriod(calls,period,start,end),[calls,period,start,end]);
  const COLORS=["#e63535","#3b82f6","#a855f7","#f59e0b","#10b981","#ec4899"];
  const statsParOffre=useMemo(()=>offers.map((o:any)=>{
    const callsOffre=filtered.filter((c:any)=>c.offerId===o.id);
    const bookes=callsOffre.length;
    const effectues=callsOffre.filter((c:any)=>["call_done","offer_pitched","sale"].includes(c.status)).length;
    const ventes=callsOffre.filter((c:any)=>c.status==="sale");
    const cashCollecte=ventes.reduce((s:number,c:any)=>s+Number(c.cashCollecte||0),0);
    const commTotale=ventes.reduce((s:number,c:any)=>s+commissionDeal(c,getRate(offers,c.offerId,c)),0);
    return {id:o.id,name:o.name,type:o.type,commission:o.commission||10,commissionBonus:o.commissionBonus||o.commission||10,bookes,effectues,ventes:ventes.length,cashCollecte,commTotale:Math.round(commTotale*100)/100,showUpRate:bookes>0?Math.round(effectues/bookes*1000)/10:0,closingRate:effectues>0?Math.round(ventes.length/effectues*1000)/10:0,revenuePerCall:effectues>0?Math.round(cashCollecte/effectues):0};
  }),[filtered,offers]);
  const best=useMemo(()=>({
    cash:[...statsParOffre].sort((a,b)=>b.cashCollecte-a.cashCollecte)[0],
    closing:[...statsParOffre].sort((a,b)=>b.closingRate-a.closingRate)[0],
    comm:[...statsParOffre].sort((a,b)=>b.commTotale-a.commTotale)[0],
  }),[statsParOffre]);
  const ChartCard=({title,dataKey,data,money=false,pct=false}:any)=>{
    const topVal=data.reduce((m:number,d:any)=>Math.max(m,d[dataKey]||0),0);
    const displayVal=money?fmt(topVal):pct?topVal+"%":topVal;
    return(
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:.4,marginBottom:6,fontFamily:SANS}}>{title}</div>
            <div style={{fontSize:22,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.8}}>{displayVal}</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} style={{overflow:"visible"}} margin={{top:5,right:5,left:-10,bottom:40}}>
            <defs>
              {data.map((_:any,i:number)=>(
                <linearGradient key={i} id={`gPerf${dataKey}${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i%COLORS.length]} stopOpacity={.9}/>
                  <stop offset="100%" stopColor={COLORS[i%COLORS.length]} stopOpacity={.3}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:C.muted}} axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} tickFormatter={(v:string)=>v.split(" ").slice(0,2).join(" ")}/>
            <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>money?(v>=1000?v/1000+"k":String(v)):pct?v+"%":String(v)}/>
            <Tooltip formatter={(v:number)=>[money?fmt(v):pct?v+"%":v,title]} contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11,fontFamily:SANS,boxShadow:"0 8px 24px rgba(0,0,0,.6)"}} wrapperStyle={TOOLTIP_WRAPPER_STYLE} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
            <Bar dataKey={dataKey} radius={[4,4,0,0]}>
              {data.map((_:any,i:number)=><Cell key={i} fill={`url(#gPerf${dataKey}${i})`}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h2 style={{margin:0,fontSize:20,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.3}}>Performances par Offre</h2><p style={{margin:"2px 0 0",fontSize:12,color:C.muted,fontFamily:SANS}}>{offers.length} offre{offers.length!==1?"s":""}</p></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",background:C.card,borderRadius:6,padding:2,gap:1,border:`1px solid ${C.border}`}}>
            {PERIODS.map(p=><button key={p.v} onClick={()=>setPeriod(p.v)} style={{padding:"5px 10px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:period===p.v?C.red:"transparent",color:period===p.v?C.white:C.muted,fontFamily:SANS}}>{p.l}</button>)}
          </div>
          {period==="custom"&&<div style={{display:"flex",gap:6,alignItems:"center"}}><input type="date" value={start} onChange={(e:any)=>setStart(e.target.value)} style={{...inp,width:130,padding:"5px 8px",fontSize:11}}/><span style={{color:C.muted2}}>→</span><input type="date" value={end} onChange={(e:any)=>setEnd(e.target.value)} style={{...inp,width:130,padding:"5px 8px",fontSize:11}}/></div>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[{label:"Meilleur Cash",v:fmt(best.cash?.cashCollecte||0),sub:best.cash?.name||"—",color:C.green},{label:"Meilleur Closing",v:`${best.closing?.closingRate||0}%`,sub:best.closing?.name||"—",color:C.blue},{label:"Meilleure Comm.",v:fmt(best.comm?.commTotale||0),sub:best.comm?.name||"—",color:C.red}].map((b,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",position:"relative",overflow:"hidden",transition:"all .2s"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${b.color},transparent)`}}/>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:SANS,marginBottom:6}}>{b.label}</div>
            <div style={{fontSize:24,fontWeight:900,color:b.color,fontFamily:SANS}}>{b.v}</div>
            <div style={{fontSize:11,color:C.muted2,marginTop:4,fontFamily:SANS}}>{b.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <ChartCard title="Cash Collecté" dataKey="cashCollecte" data={statsParOffre} money/>
        <ChartCard title="Commission" dataKey="commTotale" data={statsParOffre} money/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <ChartCard title="Taux de Closing" dataKey="closingRate" data={statsParOffre} pct/>
        <ChartCard title="Show-up Rate" dataKey="showUpRate" data={statsParOffre} pct/>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"auto"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}><div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:SANS}}>Détail par Offre</div></div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:800}}>
          <thead><tr style={{background:"#0d0d0d"}}>{["Offre","Type","Comm.","Bookés","Effectués","Ventes","Show-up","Closing","Cash","Rev/Call","Commission"].map(h=><th key={h} style={{padding:"11px 16px",textAlign:h==="Offre"?"left":"center" as any,fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:.6,fontFamily:SANS,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>
            {statsParOffre.map((s:any,i:number)=>(
              <tr key={s.id} style={{borderTop:`1px solid ${C.border}`}} onMouseEnter={(e:any)=>e.currentTarget.style.background=C.card2} onMouseLeave={(e:any)=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:COLORS[i%COLORS.length]}}/><span style={{fontWeight:600,color:C.white,fontFamily:SANS}}>{s.name}</span></div></td>
                <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{background:s.type==="monthly"?"rgba(168,85,247,.15)":"rgba(230,53,53,.15)",color:s.type==="monthly"?C.purple:C.redText,padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,fontFamily:SANS}}>{s.type==="monthly"?"Mensuel":"One Shot"}</span></td>
                <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{background:"rgba(230,53,53,.1)",color:C.redText,padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,fontFamily:SANS}}>{s.commission}%{s.commissionBonus!==s.commission?` / ${s.commissionBonus}% PIF`:""}</span></td>
                <td style={{padding:"12px 14px",textAlign:"center",color:C.white,fontFamily:SANS,fontWeight:600}}>{s.bookes}</td>
                <td style={{padding:"12px 14px",textAlign:"center",color:C.white,fontFamily:SANS,fontWeight:600}}>{s.effectues}</td>
                <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{background:"rgba(34,197,94,.12)",color:C.green,padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:500,fontFamily:SANS}}>{s.ventes}</span></td>
                <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{color:s.showUpRate>=70?C.green:s.showUpRate>=50?C.amber:C.red,fontWeight:700,fontFamily:SANS}}>{s.showUpRate}%</span></td>
                <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{color:s.closingRate>=20?C.green:s.closingRate>=12?C.amber:C.red,fontWeight:700,fontFamily:SANS}}>{s.closingRate}%</span></td>
                <td style={{padding:"12px 14px",textAlign:"center",color:C.white,fontWeight:700,fontFamily:SANS}}>{fmt(s.cashCollecte)}</td>
                <td style={{padding:"12px 14px",textAlign:"center",color:C.blue,fontWeight:700,fontFamily:SANS}}>{fmt(s.revenuePerCall)}</td>
                <td style={{padding:"12px 14px",textAlign:"center"}}><span style={{background:"rgba(230,53,53,.12)",color:C.redText,padding:"2px 10px",borderRadius:4,fontSize:12,fontWeight:800,fontFamily:SANS}}>{fmt(s.commTotale)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const RDV_STATUTS:any={
  confirme:  {l:"Confirmé",  color:"#22c55e", bg:"rgba(34,197,94,.1)"},
  annule:    {l:"Annulé",    color:"#888888", bg:"rgba(136,136,136,.1)"},
  reporte:   {l:"Reporté",   color:"#f59e0b", bg:"rgba(245,158,11,.1)"},
  en_attente:{l:"En attente",color:"#3b82f6", bg:"rgba(59,130,246,.1)"},
};

function AgendaPage({offers,googleEvents,gcalSession}:any){
  const [rdvs,setRdvs]=useState<any[]>([]);
  const [rdvsLoaded,setRdvsLoaded]=useState(false);
  const [show,setShow]=useState(false);
  const [edit,setEdit]=useState<any>(null);
  const [onglet,setOnglet]=useState<"avenir"|"historique"|"calendrier">("avenir");
  const [weekOffset,setWeekOffset]=useState(0);
  const [reminderSet,setReminderSet]=useState<Set<string>>(new Set());
  const emptyRdv=()=>({id:uid(),date:today(),heure:"09:00",prospect:"",offerId:"",lien:"",statut:"en_attente",notes:"",rappelMinutes:15});
  const [form,setForm]=useState<any>(emptyRdv());
  const sf=(k:string,v:any)=>setForm((f:any)=>({...f,[k]:v}));
  useEffect(()=>{
    async function loadRdvs(){
      const {data}=await supabase.from("rdvs").select("*").order("date",{ascending:true});
      if(data) setRdvs(data.map((r:any)=>({
        id:r.id, date:r.date, heure:r.heure, prospect:r.prospect,
        offerId:r.offer_id||"", lien:r.lien||"", statut:r.statut||"en_attente",
        notes:r.notes||"", rappelMinutes:r.rappel_minutes||15
      })));
      setRdvsLoaded(true);
    }
    loadRdvs();
  },[]);
  useEffect(()=>{
    if(!("Notification" in window)) return;
    if(Notification.permission==="default") Notification.requestPermission();
    const interval=setInterval(()=>{
      const now=new Date();
      rdvs.filter((r:any)=>r.statut==="confirme"||r.statut==="en_attente").forEach((r:any)=>{
        const rdvDate=new Date(`${r.date}T${r.heure}`);
        const diffMin=Math.round((rdvDate.getTime()-now.getTime())/60000);
        const key=`${r.id}-${r.rappelMinutes}`;
        if(diffMin===r.rappelMinutes&&!reminderSet.has(key)){
          setReminderSet(prev=>{ const s=new Set(Array.from(prev)); s.add(key); return s; });
          if(Notification.permission==="granted") new Notification(`Call dans ${r.rappelMinutes} min`,{body:`${r.prospect}`});
        }
      });
    },30000);
    return ()=>clearInterval(interval);
  },[rdvs,reminderSet]);
  const now=new Date();
  const aVenir=rdvs.filter((r:any)=>{const d=new Date(`${r.date}T${r.heure}`);return d>=now&&r.statut!=="annule";}).sort((a:any,b:any)=>new Date(`${a.date}T${a.heure}`).getTime()-new Date(`${b.date}T${b.heure}`).getTime());
  const historique=rdvs.filter((r:any)=>{const d=new Date(`${r.date}T${r.heure}`);return d<now||r.statut==="annule";}).sort((a:any,b:any)=>new Date(`${b.date}T${b.heure}`).getTime()-new Date(`${a.date}T${a.heure}`).getTime());
  const imminents=aVenir.filter((r:any)=>{const d=new Date(`${r.date}T${r.heure}`);const diff=(d.getTime()-now.getTime())/60000;return diff<=60&&diff>0;});
  const addRdv=async(f:any)=>{
    const {data}=await supabase.from("rdvs").insert([{
      date:f.date, heure:f.heure, prospect:f.prospect,
      offer_id:f.offerId||null, lien:f.lien||"", statut:f.statut||"en_attente",
      notes:f.notes||"", rappel_minutes:f.rappelMinutes||15
    }]).select().single();
    if(data) setRdvs((rs:any[])=>[...rs,{...f,id:data.id}]);
  };
  const updateRdv=async(id:string,f:any)=>{
    await supabase.from("rdvs").update({
      date:f.date, heure:f.heure, prospect:f.prospect,
      offer_id:f.offerId||null, lien:f.lien||"", statut:f.statut||"en_attente",
      notes:f.notes||"", rappel_minutes:f.rappelMinutes||15
    }).eq("id",id);
    setRdvs((rs:any[])=>rs.map((r:any)=>r.id===id?{...r,...f}:r));
  };
  const deleteRdv=async(id:string)=>{
    await supabase.from("rdvs").delete().eq("id",id);
    setRdvs((rs:any[])=>rs.filter((r:any)=>r.id!==id));
  };
  const submit=()=>{if(!form.prospect)return;edit?updateRdv(edit.id,form):addRdv(form);setShow(false);};
  const diffLabel=(r:any)=>{const d=new Date(`${r.date}T${r.heure}`);const diff=Math.round((d.getTime()-now.getTime())/60000);if(diff<=0)return "Passé";if(diff<60)return `Dans ${diff} min`;if(diff<1440)return `Dans ${Math.round(diff/60)}h`;return `Dans ${Math.round(diff/1440)}j`;};
  const RdvCard=({r}:any)=>{
    const o=offers.find((x:any)=>x.id===r.offerId);
    const s=RDV_STATUTS[r.statut]||RDV_STATUTS.en_attente;
    const d=new Date(`${r.date}T${r.heure}`);
    const isImminent=(d.getTime()-now.getTime())/60000<=60&&(d.getTime()-now.getTime())/60000>0;
    return(
      <div style={{background:C.card,border:`1px solid ${isImminent?"rgba(230,53,53,.35)":C.border}`,borderRadius:14,padding:"20px 24px",position:"relative",overflow:"hidden",transition:"border-color .2s",boxShadow:isImminent?C.shadowRed:"none"}}>
        {isImminent&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.red},transparent)`}}/>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.white,fontFamily:SANS}}>{r.prospect}</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:SANS,marginTop:3}}>{fmtD(r.date)} à {r.heure}</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {isImminent&&<span style={{background:`rgba(230,53,53,.1)`,color:C.redText,padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:500,fontFamily:SANS,border:`1px solid rgba(230,53,53,.2)`}}>{diffLabel(r)}</span>}
            {!isImminent&&d>=now&&<span style={{background:"rgba(59,130,246,.12)",color:C.blue,padding:"3px 10px",borderRadius:4,fontSize:11,fontWeight:700,fontFamily:SANS}}>{diffLabel(r)}</span>}
            <span style={{background:s.bg,color:s.color,padding:"3px 10px",borderRadius:4,fontSize:11,fontWeight:700,fontFamily:SANS,border:`1px solid ${s.color}33`}}>{s.l}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
          {o&&<span style={{fontSize:11,background:"#1a1a1a",color:C.muted,padding:"3px 10px",borderRadius:4,fontFamily:SANS,border:`1px solid ${C.border2}`}}>{o.name}</span>}
          {r.lien&&<a href={r.lien} target="_blank" rel="noopener noreferrer" style={{fontSize:11,background:"rgba(59,130,246,.1)",color:C.blue,padding:"3px 10px",borderRadius:4,fontFamily:SANS,textDecoration:"none",border:"1px solid rgba(59,130,246,.25)"}}>📅 Google Calendar</a>}
          <span style={{fontSize:11,color:C.muted2,fontFamily:SANS,padding:"3px 0"}}>⏰ Rappel {r.rappelMinutes} min avant</span>
        </div>
        {r.notes&&<div style={{fontSize:12,color:C.muted,fontFamily:SANS,fontStyle:"italic",marginBottom:12,padding:"8px 12px",background:"#1a1a1a",borderRadius:6}}>{r.notes}</div>}
        <div style={{display:"flex",gap:6,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>{setForm({...r});setEdit(r);setShow(true);}} style={{background:"#1e1e1e",border:`1px solid ${C.border2}`,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,color:C.muted,cursor:"pointer",fontFamily:SANS}}>Éditer</button>
          {r.statut!=="confirme"&&<button onClick={()=>updateRdv(r.id,{...r,statut:"confirme"})} style={{background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.25)",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,color:C.green,cursor:"pointer",fontFamily:SANS}}>✓ Confirmer</button>}
          {r.statut!=="annule"&&<button onClick={()=>updateRdv(r.id,{...r,statut:"annule"})} style={{background:"#1a1a1a",border:`1px solid ${C.border2}`,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,color:C.muted,cursor:"pointer",fontFamily:SANS}}>Annuler</button>}
          <button onClick={()=>{if(window.confirm("Supprimer ?"))deleteRdv(r.id);}} style={{background:`${C.red}10`,border:`1px solid ${C.red}33`,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,color:C.redText,cursor:"pointer",fontFamily:SANS,marginLeft:"auto"}}>Supprimer</button>
        </div>
      </div>
    );
  };
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h2 style={{margin:0,fontSize:20,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.3}}>Agenda</h2><p style={{margin:"2px 0 0",fontSize:12,color:C.muted,fontFamily:SANS}}>{aVenir.length} RDV à venir · {historique.length} passés</p></div>
        <button onClick={()=>{setForm(emptyRdv());setEdit(null);setShow(true);}} style={{background:C.red,color:C.white,border:"none",borderRadius:6,padding:"9px 18px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:SANS}}>+ Nouveau RDV</button>
      </div>
      {imminents.length>0&&(
        <div style={{background:`rgba(230,53,53,.06)`,border:`1px solid rgba(230,53,53,.2)`,borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:14,boxShadow:C.shadowRed}}>
          <span style={{fontSize:20}}>🔴</span>
          <div><div style={{fontSize:13,fontWeight:700,color:C.redText,fontFamily:SANS}}>Call imminent !</div><div style={{fontSize:11,color:C.muted,fontFamily:SANS}}>{imminents.map((r:any)=>`${r.prospect} — ${diffLabel(r)}`).join(" · ")}</div></div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[
          {l:"À venir",      v:aVenir.length,                                                                                                     color:C.white},
          {l:"Aujourd'hui",  v:aVenir.filter((r:any)=>r.date===today()).length,                                                                   color:C.amber},
          {l:"Cette semaine",v:aVenir.filter((r:any)=>{const d=new Date(r.date);const diff=(d.getTime()-now.getTime())/86400000;return diff<=7&&diff>=0;}).length,color:C.blue},
          {l:"Confirmés",    v:aVenir.filter((r:any)=>r.statut==="confirme").length,                                                              color:C.green},
        ].map((k,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 22px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:SANS,marginBottom:6}}>{k.l}</div>
            <div style={{fontSize:26,fontWeight:800,color:k.color,fontFamily:SANS}}>{k.v}</div>
          </div>
        ))}
      </div>
      {/* Tabs */}
      <div style={{display:"flex",background:C.card,borderRadius:8,padding:2,gap:1,border:`1px solid ${C.border}`,marginBottom:16,width:"fit-content"}}>
        {([["avenir","À venir"],["calendrier","Semaine"],["historique","Historique"]] as [string,string][]).map(([v,l])=>(
          <button key={v} onClick={()=>setOnglet(v as any)} style={{padding:"6px 16px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:500,background:onglet===v?C.red:"transparent",color:onglet===v?C.white:C.muted,fontFamily:SANS,transition:"all .15s"}}>{l}</button>
        ))}
      </div>

      {/* Calendrier semaine */}
      {onglet==="calendrier"&&<CalendrierSemaine rdvs={rdvs} offers={offers} googleEvents={googleEvents} gcalSession={gcalSession} weekOffset={weekOffset} setWeekOffset={setWeekOffset} onEdit={(r:any)=>{setForm({...r});setEdit(r);setShow(true);}} onNew={(date:string,heure:string)=>{setForm({...emptyRdv(),date,heure});setEdit(null);setShow(true);}}/>}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {onglet==="avenir"&&(aVenir.length===0?<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"60px 0",textAlign:"center",color:C.muted,fontSize:13,fontFamily:SANS}}>Aucun RDV à venir</div>:aVenir.map((r:any)=><RdvCard key={r.id} r={r}/>))}
        {onglet==="historique"&&(historique.length===0?<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"60px 0",textAlign:"center",color:C.muted,fontSize:13,fontFamily:SANS}}>Aucun historique</div>:historique.map((r:any)=><RdvCard key={r.id} r={r}/>))}
      </div>
      <Modal open={show} onClose={()=>setShow(false)} title={edit?"Modifier le RDV":"Nouveau RDV"}>
        <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
          <FLabel label="Prospect *"><input style={inp} value={form.prospect} onChange={(e:any)=>sf("prospect",e.target.value)} placeholder="Jean Dupont"/></FLabel>
          <FLabel label="Date *" half><input type="date" style={inp} value={form.date} onChange={(e:any)=>sf("date",e.target.value)}/></FLabel>
          <FLabel label="Heure *" half><input type="time" style={inp} value={form.heure} onChange={(e:any)=>sf("heure",e.target.value)}/></FLabel>
          <FLabel label="Offre" half><select style={selInp} value={form.offerId} onChange={(e:any)=>sf("offerId",e.target.value)}><option value="">— Sans offre —</option>{offers.map((o:any)=><option key={o.id} value={o.id}>{o.name}</option>)}</select></FLabel>
          <FLabel label="Statut" half><select style={selInp} value={form.statut} onChange={(e:any)=>sf("statut",e.target.value)}>{Object.entries(RDV_STATUTS).map(([k,s]:any)=><option key={k} value={k}>{s.l}</option>)}</select></FLabel>
          <FLabel label="Lien Google Calendar / Zoom / Meet"><input style={inp} value={form.lien} onChange={(e:any)=>sf("lien",e.target.value)} placeholder="https://calendar.google.com/..."/></FLabel>
          <FLabel label="Rappel" half><select style={selInp} value={form.rappelMinutes} onChange={(e:any)=>sf("rappelMinutes",+e.target.value)}>{[5,10,15,20,30,45,60].map(m=><option key={m} value={m}>{m} min avant</option>)}</select></FLabel>
          <FLabel label="Notes"><textarea style={{...inp,resize:"vertical",minHeight:64}} value={form.notes} onChange={(e:any)=>sf("notes",e.target.value)} placeholder="Contexte, préparation..."/></FLabel>
          <div style={{display:"flex",gap:8,width:"100%",marginTop:4}}>
            <button onClick={submit} style={{flex:1,background:C.red,color:C.white,border:"none",borderRadius:8,padding:"11px 0",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:SANS,letterSpacing:.1,transition:"all .15s",boxShadow:`0 2px 8px rgba(230,53,53,.25)`}}>{edit?"Mettre à jour":"Enregistrer"}</button>
            <button onClick={()=>setShow(false)} style={{padding:"11px 18px",border:`1px solid ${C.border}`,borderRadius:8,background:"transparent",color:C.muted,fontSize:12,fontWeight:400,cursor:"pointer",fontFamily:SANS,transition:"all .15s"}}>Annuler</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BookingPage({calendlyUrl,onSaveCalendly}:any){
  const [editing,setEditing]=useState(false);
  const [tmpUrl,setTmpUrl]=useState(calendlyUrl||"");
  const embedUrl=calendlyUrl?`${calendlyUrl}?embed_domain=kloze.vercel.app&embed_type=Inline&hide_landing_page_details=1&hide_gdpr_banner=1&background_color=0f0f0f&text_color=f0f0f0&primary_color=e63535`:"";
  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:600,color:C.white,fontFamily:SANS,letterSpacing:-.3}}>Booking</h2>
          <p style={{margin:"4px 0 0",fontSize:12,color:C.muted,fontFamily:SANS}}>Ton calendrier de prise de rendez-vous</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          {calendlyUrl&&<a href={calendlyUrl} target="_blank" rel="noopener noreferrer" style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:SANS,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6}} onMouseEnter={(e:any)=>{e.currentTarget.style.color=C.white;}} onMouseLeave={(e:any)=>{e.currentTarget.style.color=C.muted;}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Ouvrir
          </a>}
          <button onClick={()=>{setTmpUrl(calendlyUrl||"");setEditing(true);}} style={{background:C.red,border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:500,color:C.white,cursor:"pointer",fontFamily:SANS}}>
            {calendlyUrl?"Changer le lien":"+ Ajouter mon lien Calendly"}
          </button>
        </div>
      </div>
      {editing&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:500,color:C.muted,textTransform:"uppercase",letterSpacing:.4,marginBottom:8,fontFamily:SANS}}>Lien Calendly</div>
          <div style={{display:"flex",gap:8}}>
            <input style={{...inp,flex:1}} value={tmpUrl} onChange={(e:any)=>setTmpUrl(e.target.value)} placeholder="https://calendly.com/ton-nom/ton-event"/>
            <button onClick={()=>{onSaveCalendly(tmpUrl);setEditing(false);}} style={{background:C.red,border:"none",borderRadius:8,padding:"10px 18px",fontSize:13,fontWeight:500,color:C.white,cursor:"pointer",fontFamily:SANS}}>Sauvegarder</button>
            <button onClick={()=>setEditing(false)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.muted,cursor:"pointer",fontFamily:SANS}}>Annuler</button>
          </div>
        </div>
      )}
      {calendlyUrl?(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",height:"calc(100vh - 200px)",minHeight:600}}>
          <iframe src={embedUrl} width="100%" height="100%" frameBorder="0" style={{display:"block",minHeight:600}}/>
        </div>
      ):(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"80px 0",textAlign:"center"}}>
          <div style={{fontSize:14,color:C.muted,fontFamily:SANS,marginBottom:8}}>Aucun lien Calendly configuré</div>
          <div style={{fontSize:12,color:C.muted2,fontFamily:SANS}}>Clique sur "+ Ajouter mon lien Calendly" pour commencer</div>
        </div>
      )}
    </div>
  );
}

function CalendrierSemaine({rdvs,offers,googleEvents,gcalSession,weekOffset,setWeekOffset,onEdit,onNew}:any){
  const JOURS=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  const HEURES=Array.from({length:13},(_,i)=>i+8);
  const now=new Date();
  const startOfWeek=(d:Date)=>{ const day=d.getDay(); const diff=d.getDate()-(day===0?6:day-1); return new Date(d.getFullYear(),d.getMonth(),diff); };
  const weekStart=new Date(startOfWeek(now)); weekStart.setDate(weekStart.getDate()+weekOffset*7);
  const days=Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; });
  const fmtWeek=()=>{ const e=new Date(weekStart); e.setDate(e.getDate()+6); return `${weekStart.getDate()} ${weekStart.toLocaleDateString("fr-FR",{month:"short"})} — ${e.getDate()} ${e.toLocaleDateString("fr-FR",{month:"short",year:"numeric"})}`; };
  const getRdvs=(day:Date,hour:number)=>rdvs.filter((r:any)=>{ const d=new Date(`${r.date}T${r.heure}`); return d.getDate()===day.getDate()&&d.getMonth()===day.getMonth()&&d.getFullYear()===day.getFullYear()&&d.getHours()===hour; });
  const getGoogleEvents=(day:Date,hour:number)=>(googleEvents||[]).filter((e:any)=>{
    if(!e.start) return false;
    const d=new Date(e.start);
    return d.getDate()===day.getDate()&&d.getMonth()===day.getMonth()&&d.getFullYear()===day.getFullYear()&&d.getHours()===hour;
  });
  const isToday=(d:Date)=>d.toDateString()===now.toDateString();
  const nowMin=now.getHours()*60+now.getMinutes();
  const topPct=(nowMin-8*60)/(13*60)*100;
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setWeekOffset((w:number)=>w-1)} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:6,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,cursor:"pointer",fontSize:16,fontFamily:SANS,transition:"all .15s"}} onMouseEnter={(e:any)=>e.currentTarget.style.color=C.white} onMouseLeave={(e:any)=>e.currentTarget.style.color=C.muted}>‹</button>
          <button onClick={()=>setWeekOffset((w:number)=>w+1)} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:6,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,cursor:"pointer",fontSize:16,fontFamily:SANS,transition:"all .15s"}} onMouseEnter={(e:any)=>e.currentTarget.style.color=C.white} onMouseLeave={(e:any)=>e.currentTarget.style.color=C.muted}>›</button>
          <span style={{fontSize:14,fontWeight:500,color:C.white,fontFamily:SANS,marginLeft:4}}>{fmtWeek()}</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          {weekOffset!==0&&<button onClick={()=>setWeekOffset(0)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 12px",color:C.muted,cursor:"pointer",fontSize:12,fontFamily:SANS}}>Aujourd'hui</button>}
              {!gcalSession?(
                <button onClick={async()=>{ await supabase.auth.signInWithOAuth({provider:"google",options:{scopes:"https://www.googleapis.com/auth/calendar.readonly",redirectTo:window.location.origin}}); }} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 12px",color:C.muted,cursor:"pointer",fontSize:12,fontFamily:SANS,display:"flex",alignItems:"center",gap:6,transition:"all .15s"}} onMouseEnter={(e:any)=>{e.currentTarget.style.color=C.white;}} onMouseLeave={(e:any)=>{e.currentTarget.style.color=C.muted;}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Connecter Google Calendar
                </button>
              ):(
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:C.green,fontFamily:SANS}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:C.green}}/>
                  Google Calendar connecté
                </div>
              )}
        </div>
      </div>
      <div style={{overflowY:"auto",maxHeight:"calc(100vh - 320px)"}}>
        <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",minWidth:600,position:"relative"}}>
          <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,padding:"10px 0"}}/>
          {days.map((d,i)=>(
            <div key={i} style={{background:isToday(d)?`rgba(230,53,53,.04)`:C.surface,borderBottom:`1px solid ${C.border}`,borderRight:i<6?`1px solid ${C.border}`:"none",padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:400,color:C.muted,fontFamily:SANS,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>{JOURS[i]}</div>
              <div style={{width:30,height:30,borderRadius:"50%",background:isToday(d)?C.red:"transparent",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}>
                <span style={{fontSize:14,fontWeight:isToday(d)?600:400,color:C.white,fontFamily:SANS}}>{d.getDate()}</span>
              </div>
            </div>
          ))}
          {HEURES.map(h=>(
            <> 
              <div key={`h${h}`} style={{height:56,borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,padding:"4px 8px",display:"flex",alignItems:"flex-start"}}>
                <span style={{fontSize:10,color:C.muted,fontFamily:SANS,letterSpacing:.2}}>{String(h).padStart(2,"0")}:00</span>
              </div>
              {days.map((d,di)=>{
                const slots=getRdvs(d,h);
                return(
                  <div key={`${h}-${di}`} style={{height:56,borderBottom:`1px solid ${C.border}`,borderRight:di<6?`1px solid ${C.border}`:"none",padding:2,background:isToday(d)?`rgba(230,53,53,.015)`:"transparent",position:"relative",cursor:"pointer"}} onClick={()=>{if(!slots.length){const dateStr=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;onNew(dateStr,`${String(h).padStart(2,"0")}:00`);}}}>
                    {slots.map((r:any,ri:number)=>{
                      const st=RDV_STATUTS[r.statut]||RDV_STATUTS.en_attente;
                      return(
                        <div key={ri} onClick={(e)=>{e.stopPropagation();onEdit(r);}} style={{background:st.bg,border:`1px solid ${st.color}40`,borderLeft:`2px solid ${st.color}`,borderRadius:4,padding:"3px 6px",cursor:"pointer",marginBottom:1,transition:"all .15s"}} onMouseEnter={(e:any)=>e.currentTarget.style.opacity=".8"} onMouseLeave={(e:any)=>e.currentTarget.style.opacity="1"}>
                          <div style={{fontSize:10,fontWeight:500,color:st.color,fontFamily:SANS,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.prospect}</div>
                          <div style={{fontSize:9,color:C.muted,fontFamily:SANS}}>{r.heure}</div>
                        </div>
                      );
                    })}
                    {getGoogleEvents(d,h).map((e:any,ei:number)=>(
                      <div key={`g${ei}`} onClick={(ev)=>{ev.stopPropagation();if(e.link)window.open(e.link,"_blank");}} style={{background:"rgba(59,130,246,.1)",border:"1px solid rgba(59,130,246,.3)",borderLeft:"2px solid #3b82f6",borderRadius:4,padding:"3px 6px",cursor:"pointer",marginBottom:1,transition:"all .15s"}} onMouseEnter={(ev:any)=>ev.currentTarget.style.opacity=".8"} onMouseLeave={(ev:any)=>ev.currentTarget.style.opacity="1"}>
                        <div style={{fontSize:10,fontWeight:500,color:"#3b82f6",fontFamily:SANS,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
                        <div style={{fontSize:9,color:C.muted,fontFamily:SANS}}>{new Date(e.start).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
          {weekOffset===0&&topPct>0&&topPct<100&&(
            <div style={{position:"absolute",left:52,right:0,top:`calc(40px + ${topPct / 100} * ${HEURES.length * 56}px)`,zIndex:10,pointerEvents:"none",display:"flex",alignItems:"center"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:C.red,flexShrink:0,marginLeft:-4}}/>
              <div style={{flex:1,height:1,background:C.red,opacity:.6}}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ─── Helpers accès ───────────────────────────────────────────────────────────
function getTrialDaysLeft(trialStartedAt:string|null):number{
  if(!trialStartedAt) return 10;
  const diff=Date.now()-new Date(trialStartedAt).getTime();
  const daysPassed=diff/(1000*60*60*24);
  return Math.max(0,Math.ceil(10-daysPassed));
}
function hasAccess(profile:any):boolean{
  if(!profile) return false;
  if(profile.role==="owner") return true;
  if(profile.plan_active) return true;
  return getTrialDaysLeft(profile.trial_started_at)>0;
}

// ─── Écran trial expiré ───────────────────────────────────────────────────────
function TrialExpiredScreen({user,onLogout}:any){
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:SANS}}>
      <div style={{textAlign:"center",maxWidth:480,padding:"0 24px"}}>
        <div style={{width:64,height:64,borderRadius:16,background:`linear-gradient(135deg,${C.red},${C.redDim})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:`0 0 32px rgba(230,53,53,.3)`}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <h1 style={{fontSize:28,fontWeight:700,color:C.white,margin:"0 0 12px",letterSpacing:-.5}}>Votre essai gratuit est terminé</h1>
        <p style={{fontSize:14,color:C.muted,margin:"0 0 32px",lineHeight:1.6}}>Vous avez profité de 10 jours gratuits sur le Kloze. Pour continuer à suivre vos performances, activez votre abonnement.</p>
        <div style={{background:C.card,border:`1px solid rgba(230,53,53,.2)`,borderRadius:16,padding:"28px 32px",marginBottom:20,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.red},transparent)`}}/>
          <div style={{fontSize:11,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Kloze Pro</div>
          <div style={{fontSize:42,fontWeight:800,color:C.white,letterSpacing:-1.5,lineHeight:1}}><span style={{fontSize:20,fontWeight:400,color:C.muted,verticalAlign:"top",marginTop:10,display:"inline-block"}}>€</span>29<span style={{fontSize:16,fontWeight:400,color:C.muted}}>/mois</span></div>
          <div style={{fontSize:12,color:C.muted,margin:"8px 0 20px"}}>Accès illimité à toutes les fonctionnalités</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24,textAlign:"left"}}>
            {["Dashboard & KPIs en temps réel","Suivi des appels et deals","Analytics avancées","Objections & Paiements","Agenda & Booking Calendly"].map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.off}}>
                <span style={{color:C.green,fontSize:16}}>✓</span>{f}
              </div>
            ))}
          </div>
          <button
            onClick={()=>window.open("mailto:contact@closer-crm.com?subject=Abonnement Kloze Pro","_blank")}
            style={{width:"100%",background:C.red,color:C.white,border:"none",borderRadius:10,padding:"14px 0",fontSize:14,fontWeight:600,cursor:"pointer",letterSpacing:.2,boxShadow:`0 4px 16px rgba(230,53,53,.3)`,transition:"all .2s"}}
            onMouseEnter={(e:any)=>e.currentTarget.style.opacity=".9"}
            onMouseLeave={(e:any)=>e.currentTarget.style.opacity="1"}
          >
            Activer mon abonnement →
          </button>
        </div>
        <button onClick={onLogout} style={{background:"transparent",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:SANS}}>Se déconnecter</button>
      </div>
    </div>
  );
}

export default function Home(){
  const [page,setPage]=useState("dashboard");
  const [user,setUser]=useState<any>(null);
  const [profile,setProfile]=useState<any>(null);
  const [calendlyUrl,setCalendlyUrl]=useState("");
  const [authLoading,setAuthLoading]=useState(true);
  const [gcalSession,setGcalSession]=useState<any>(null);
  const [googleEvents,setGoogleEvents]=useState<any[]>([]);
  const [calls,setCalls]=useState<any[]>([]);
  const [offers,setOffers]=useState<any[]>([]);
  const [dataLoading,setDataLoading]=useState(true);

  // Charge les données depuis Supabase
  useEffect(()=>{
    if(!user) return;
    async function loadData(){
      setDataLoading(true);
      const [offersRes,callsRes]=await Promise.all([
        supabase.from("offers").select("*").eq("user_id",user.id).order("created_at",{ascending:true}),
        supabase.from("calls").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
      ]);
      if(offersRes.data) setOffers(offersRes.data.map((o:any)=>({
        id:o.id, name:o.name, description:o.description||"", price:Number(o.price||0),
        type:o.type, commission:Number(o.commission||10), commissionBonus:Number(o.commission_bonus||10)
      })));
      if(callsRes.data) setCalls(callsRes.data.map((c:any)=>({
        id:c.id, date:c.date, prospect:c.prospect, email:c.email||"",
        offerId:c.offer_id||"", status:c.status, notes:c.notes||"", objection:c.objection||"",
        prixAccompagnement:Number(c.prix_accompagnement||0), paymentType:c.payment_type||"one_shot",
        nombreMensualites:Number(c.nombre_mensualites||1), mensualite:Number(c.mensualite||0),
        mensualitesPayees:Number(c.mensualites_payees||0), mensualitesRestantes:Number(c.mensualites_restantes||0),
        cashCollecte:Number(c.cash_collecte||0), datePaiement:c.date_paiement||c.date
      })));
      setDataLoading(false);
    }
    loadData();
  },[user]);

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      setUser(session?.user??null);
      setAuthLoading(false);
      if(!session){ window.location.href='/auth'; return; }
      // Charge le profil utilisateur
      const {data:profileData}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
      if(profileData){
        setProfile(profileData);
        if(profileData.calendly_url) setCalendlyUrl(profileData.calendly_url);
        if(!profileData.trial_started_at){
          await supabase.from("profiles").update({trial_started_at:new Date().toISOString()}).eq("id",session.user.id);
        }
      }
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{
      setUser(session?.user??null);
      if(!session){ window.location.href='/auth'; return; }
      // Capture le provider_token Google après OAuth redirect
      if(event==="SIGNED_IN"&&session.provider_token){
        await supabase.from("profiles").upsert({
          id:session.user.id,
          google_access_token:session.provider_token
        },{onConflict:"id"});
        // Charge les events Google
        fetch('/api/calendar?token='+session.provider_token)
          .then(r=>r.json())
          .then(d=>{ if(d.events) setGoogleEvents(d.events); })
          .catch(()=>{});
        setGcalSession(true);
      }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  async function handleLogout(){
    await supabase.auth.signOut();
    window.location.href='/auth';
  }

  // authLoading check moved after hooks

  // Charge les événements Google Calendar depuis le token stocké en DB
  useEffect(()=>{
    if(!user) return;
    supabase.from("profiles").select("google_access_token").eq("id",user.id).single()
      .then(({data})=>{
        if(data?.google_access_token){
          setGcalSession(true);
          fetch('/api/calendar?token='+data.google_access_token)
            .then(r=>r.json())
            .then(d=>{ if(d.events) setGoogleEvents(d.events); })
            .catch(()=>{});
        }
      });
  },[user]);
  const addCall=useCallback(async(f:any)=>{
    if(!user) return;
    const {data}=await supabase.from("calls").insert([{
      user_id:user.id, date:f.date, prospect:f.prospect, email:f.email||"",
      offer_id:f.offerId||null, status:f.status, notes:f.notes||"", objection:f.objection||"",
      prix_accompagnement:f.prixAccompagnement||0, payment_type:f.paymentType||"one_shot",
      nombre_mensualites:f.nombreMensualites||1, mensualite:f.mensualite||0,
      mensualites_payees:f.mensualitesPayees||0, mensualites_restantes:f.mensualitesRestantes||0,
      cash_collecte:f.cashCollecte||0, date_paiement:f.datePaiement||f.date
    }]).select().single();
    if(data) setCalls((cs:any[])=>[{...f,id:data.id},...cs]);
  },[user]);

  const updateCall=useCallback(async(id:string,f:any)=>{
    if(!user) return;
    await supabase.from("calls").update({
      date:f.date, prospect:f.prospect, email:f.email||"",
      offer_id:f.offerId||null, status:f.status, notes:f.notes||"", objection:f.objection||"",
      prix_accompagnement:f.prixAccompagnement||0, payment_type:f.paymentType||"one_shot",
      nombre_mensualites:f.nombreMensualites||1, mensualite:f.mensualite||0,
      mensualites_payees:f.mensualitesPayees||0, mensualites_restantes:f.mensualitesRestantes||0,
      cash_collecte:f.cashCollecte||0, date_paiement:f.datePaiement||f.date
    }).eq("id",id).eq("user_id",user.id);
    setCalls((cs:any[])=>cs.map((c:any)=>c.id===id?{...c,...f}:c));
  },[user]);

  const deleteCall=useCallback(async(id:string)=>{
    if(!user) return;
    await supabase.from("calls").delete().eq("id",id).eq("user_id",user.id);
    setCalls((cs:any[])=>cs.filter((c:any)=>c.id!==id));
  },[user]);

  const addOffer=useCallback(async(f:any)=>{
    if(!user) return;
    const {data}=await supabase.from("offers").insert([{
      user_id:user.id, name:f.name, description:f.description||"",
      price:f.price||0, type:f.type||"one_shot",
      commission:f.commission||10, commission_bonus:f.commissionBonus||10
    }]).select().single();
    if(data) setOffers((os:any[])=>[...os,{...f,id:data.id}]);
  },[user]);

  const updateOffer=useCallback(async(id:string,f:any)=>{
    if(!user) return;
    await supabase.from("offers").update({
      name:f.name, description:f.description||"",
      price:f.price||0, type:f.type||"one_shot",
      commission:f.commission||10, commission_bonus:f.commissionBonus||10
    }).eq("id",id).eq("user_id",user.id);
    setOffers((os:any[])=>os.map((o:any)=>o.id===id?{...o,...f}:o));
  },[user]);

  const deleteOffer=useCallback(async(id:string)=>{
    if(!user) return;
    await supabase.from("offers").delete().eq("id",id).eq("user_id",user.id);
    setOffers((os:any[])=>os.filter((o:any)=>o.id!==id));
  },[user]);
  const commActive=useMemo(()=>getCommActiveGlobale(calls,offers),[calls,offers]);
  const kpi7=useMemo(()=>computeKpi(filterByPeriod(calls,"7d"),offers),[calls,offers]);
  const NAV=[
    {id:"dashboard", label:"Dashboard",      icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'},
    {id:"calls",     label:"Appels & Deals", icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.07 2.18 2 2 0 012.03 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>'},
    {id:"offers",    label:"Offres",         icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>'},
    {id:"analytics", label:"Analytics",      icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
    {id:"objections",label:"Objections",     icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'},
    {id:"paiements", label:"Paiements",      icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>'},
    {id:"perfoffres",label:"Par Offre",      icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>'},
    {id:"agenda",    label:"Agenda",         icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'},
    {id:"booking",   label:"Booking",        icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>'},
  ];
  // Vérification accès trial/owner/pro
  if(!authLoading && user && profile && !hasAccess(profile)){
    return <TrialExpiredScreen user={user} onLogout={handleLogout}/>;
  }

  // Bandeau trial restant (si pas owner et trial actif)
  const trialDaysLeft = profile && profile.role !== 'owner' && !profile.plan_active ? getTrialDaysLeft(profile.trial_started_at) : null;

  if(authLoading) return(
    <div style={{minHeight:"100vh",background:"#080808",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:32,height:32,border:"2px solid #1a1a1a",borderTop:"2px solid #e63535",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/>
        <div style={{fontSize:12,color:"#666",fontFamily:"Inter,sans-serif"}}>Chargement...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:SANS,background:C.bg,overflow:"hidden",color:C.white}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;}body{margin:0;background:${C.bg};font-family:${SANS};}button,input,select,textarea{font-family:${SANS};}input[type=number]{-moz-appearance:textfield;}input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}input:focus,select:focus,textarea:focus{border-color:${C.red}!important;box-shadow:0 0 0 3px rgba(230,53,53,.1)!important;outline:none;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:${C.border2};border-radius:99px;}::-webkit-scrollbar-thumb:hover{background:${C.border3};}input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.4);}::selection{background:rgba(230,53,53,.2);}button{transition:all .15s ease;}a{transition:opacity .15s;}`}</style>
      <aside style={{width:232,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,position:"relative"}}>
        <div style={{padding:"20px 18px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:6,background:`linear-gradient(135deg,${C.red},${C.redDim})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
            <div><div style={{fontSize:13,fontWeight:700,color:C.white,fontFamily:SANS,letterSpacing:-.3}}>Kloze</div><div style={{fontSize:10,color:C.muted,fontFamily:SANS}}>Sales Dashboard</div></div>
          </div>
        </div>
        <div style={{padding:"14px",margin:"10px 10px 4px",background:C.card,borderRadius:10,border:`1px solid ${C.border}`,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,${C.red}60,transparent)`}}/>
          <div style={{fontSize:9,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:1.5,fontFamily:SANS,marginBottom:4}}>⬤ Comm. Active</div>
          <div style={{fontSize:18,fontWeight:900,color:C.white,fontFamily:SANS,letterSpacing:-.5}}>{fmt(commActive)}<span style={{fontSize:10,color:C.muted,fontWeight:400}}>/mo</span></div>

        </div>
        <nav style={{flex:1,padding:"8px 10px",overflowY:"auto"}}>
          {NAV.map(n=>{ const active=page===n.id; return <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:active?500:400,textAlign:"left",transition:"all .15s ease",background:active?`rgba(230,53,53,.1)`:"transparent",color:active?C.white:C.muted,fontFamily:SANS,marginBottom:2,letterSpacing:.1}} onMouseEnter={(e:any)=>{if(!active){e.currentTarget.style.background=C.card2;e.currentTarget.style.color=C.off;}}} onMouseLeave={(e:any)=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.muted;}}}><span style={{opacity:active?1:.5,display:"flex",alignItems:"center",flexShrink:0,transition:"opacity .15s"}} dangerouslySetInnerHTML={{__html:n.icon}}/><span style={{flex:1}}>{n.label}</span>{active&&<div style={{width:3,height:3,borderRadius:"50%",background:C.red,flexShrink:0}}/>}</button>;})}
        </nav>
        {trialDaysLeft!==null&&trialDaysLeft<=7&&(
          <div style={{margin:"0 10px 8px",background:`rgba(230,53,53,.06)`,border:`1px solid rgba(230,53,53,.15)`,borderRadius:8,padding:"10px 14px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Essai gratuit</div>
            <div style={{fontSize:13,fontWeight:700,color:C.white}}>{trialDaysLeft === 0 ? "Dernier jour !" : `J-${trialDaysLeft}`}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>avant expiration</div>
          </div>
        )}
        <div style={{padding:"14px 18px",borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.red}30,${C.red}10)`,border:`1px solid ${C.red}30`,display:"flex",alignItems:"center",justifyContent:"center",color:C.redText,fontSize:12,fontWeight:700,fontFamily:SANS,flexShrink:0}}>{user?.email?.[0]?.toUpperCase()||"C"}</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:C.white,fontFamily:SANS,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.user_metadata?.name||user?.email||"Mon espace"}</div><div style={{fontSize:10,color:C.muted,fontFamily:SANS}}>Closer</div></div>
            <button onClick={handleLogout} title="Déconnexion" style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.muted,flexShrink:0,transition:"all .15s"}} onMouseEnter={(e:any)=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.color=C.redText;}} onMouseLeave={(e:any)=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>
          </div>
        </div>
      </aside>
      <main style={{flex:1,overflowY:"auto",padding:"28px 32px",background:C.bg}}>
        {page==="dashboard"&&<DashboardPage calls={calls} offers={offers}/>}
        {page==="calls"&&<CallsPage calls={calls} offers={offers} onAdd={addCall} onUpdate={updateCall} onDelete={deleteCall}/>}
        {page==="offers"&&<OffersPage offers={offers} onAdd={addOffer} onUpdate={updateOffer} onDelete={deleteOffer}/>}
        {page==="analytics"&&<AnalyticsPage calls={calls} offers={offers}/>}
        {page==="objections"&&<ObjectionsPage calls={calls} offers={offers}/>}
        {page==="paiements"&&<PaiementsPage calls={calls} offers={offers} onUpdate={updateCall}/>}
        {page==="perfoffres"&&<PerformancesOffresPage calls={calls} offers={offers}/>}
        {page==="agenda"&&<AgendaPage offers={offers} googleEvents={googleEvents} gcalSession={gcalSession}/>}
        {page==="booking"&&<BookingPage calendlyUrl={calendlyUrl} onSaveCalendly={async(url:string)=>{
  setCalendlyUrl(url);
  await supabase.from("profiles").upsert({id:user?.id,calendly_url:url},{onConflict:"id"});
}}/>}
      </main>
    </div>
  );
}

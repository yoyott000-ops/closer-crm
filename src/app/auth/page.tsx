'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const C = {
  bg:"#080808", card:"#111111", border:"#1a1a1a", border2:"#222222",
  red:"#e63535", redText:"#ff6b6b", white:"#f0f0f0", muted:"#666666",
}
const SANS = `'Inter',-apple-system,sans-serif`
const inp:any = {width:"100%",background:"#0f0f0f",border:`1px solid ${C.border2}`,borderRadius:8,padding:"11px 14px",fontSize:14,color:C.white,outline:"none",boxSizing:"border-box",fontFamily:SANS}

export default function AuthPage() {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    if (!email || !password) { setError('Email et mot de passe requis'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
        if (error) throw error
        setSuccess('Compte créé ! Vérifie ton email pour confirmer.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/'
      }
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:SANS}}>
      <div style={{width:"100%",maxWidth:400,margin:"0 16px"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32,justifyContent:"center"}}>
          <div style={{width:34,height:34,borderRadius:8,background:`linear-gradient(135deg,${C.red},#c02020)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:600,color:C.white,letterSpacing:-.3}}>Closer CRM</div>
            <div style={{fontSize:11,color:C.muted}}>Sales Dashboard</div>
          </div>
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:32,boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}>
          <h1 style={{margin:"0 0 6px",fontSize:20,fontWeight:600,color:C.white,letterSpacing:-.4}}>{mode==='login'?'Connexion':'Créer un compte'}</h1>
          <p style={{margin:"0 0 28px",fontSize:13,color:C.muted}}>{mode==='login'?'Accède à ton dashboard':'Commence à tracker tes performances'}</p>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {mode==='register'&&(
              <div>
                <div style={{fontSize:11,fontWeight:500,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Prénom</div>
                <input style={inp} value={name} onChange={(e:any)=>setName(e.target.value)} placeholder="Eliott"/>
              </div>
            )}
            <div>
              <div style={{fontSize:11,fontWeight:500,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Email</div>
              <input style={inp} type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="eliott@email.com"/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:500,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Mot de passe</div>
              <input style={inp} type="password" value={password} onChange={(e:any)=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e:any)=>e.key==='Enter'&&handleSubmit()}/>
            </div>

            {error&&<div style={{background:"rgba(230,53,53,.08)",border:"1px solid rgba(230,53,53,.2)",borderRadius:8,padding:"10px 14px",fontSize:12,color:C.redText}}>{error}</div>}
            {success&&<div style={{background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#22c55e"}}>{success}</div>}

            <button onClick={handleSubmit} disabled={loading} style={{background:loading?"#333":C.red,color:C.white,border:"none",borderRadius:8,padding:"12px 0",fontSize:14,fontWeight:500,cursor:loading?"not-allowed":"pointer",fontFamily:SANS,marginTop:4,transition:"all .15s",boxShadow:`0 2px 8px rgba(230,53,53,.25)`}}>
              {loading?'Chargement...':(mode==='login'?'Se connecter':'Créer mon compte')}
            </button>
          </div>

          <div style={{textAlign:"center",marginTop:20,fontSize:13,color:C.muted}}>
            {mode==='login'?'Pas encore de compte ?':'Déjà un compte ?'}{' '}
            <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setSuccess('');}} style={{background:"none",border:"none",color:C.redText,cursor:"pointer",fontSize:13,fontFamily:SANS,fontWeight:500}}>
              {mode==='login'?'Créer un compte':'Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    
    // Sauvegarde le provider_token dans profiles
    if (data.session?.provider_token && data.session?.user?.id) {
      await supabase.from('profiles').upsert({
        id: data.session.user.id,
        google_access_token: data.session.provider_token,
      }, { onConflict: 'id' })
    }
  }

  return NextResponse.redirect(new URL('/?gcal=connected', req.url))
}

import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 401 })

  try {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: token })

    const calendar = google.calendar({ version: 'v3', auth })
    const now = new Date()
    const start = new Date(now); start.setDate(now.getDate() - 7)
    const end = new Date(now); end.setDate(now.getDate() + 30)

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    })

    const events = (res.data.items || []).map(e => ({
      id: e.id,
      title: e.summary || 'Sans titre',
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      link: e.hangoutLink || e.htmlLink,
      source: 'google'
    }))

    return NextResponse.json({ events })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur Google Calendar' }, { status: 500 })
  }
}

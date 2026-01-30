import { NextResponse } from 'next/server'

// Fernhill Dance Community Google Calendar ID
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'fernhilldance@gmail.com'
const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY

interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  htmlLink: string
}

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  start: string
  end: string
  allDay: boolean
  googleLink: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeMin = searchParams.get('timeMin') || new Date().toISOString()
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days ahead

    // If no API key, return mock data for development
    if (!API_KEY) {
      console.warn('GOOGLE_CALENDAR_API_KEY not set, returning mock data')
      return NextResponse.json({
        events: getMockEvents(),
        source: 'mock'
      })
    }

    // Build Google Calendar API URL
    const calendarUrl = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`
    )
    calendarUrl.searchParams.set('key', API_KEY)
    calendarUrl.searchParams.set('timeMin', timeMin)
    calendarUrl.searchParams.set('timeMax', timeMax)
    calendarUrl.searchParams.set('singleEvents', 'true')
    calendarUrl.searchParams.set('orderBy', 'startTime')
    calendarUrl.searchParams.set('maxResults', '50')

    const response = await fetch(calendarUrl.toString(), {
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Google Calendar API error:', error)
      throw new Error(`Google Calendar API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform Google Calendar events to our format
    const events: CalendarEvent[] = (data.items || []).map((event: GoogleCalendarEvent) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || null,
      location: event.location || null,
      start: event.start.dateTime || event.start.date || '',
      end: event.end.dateTime || event.end.date || '',
      allDay: !event.start.dateTime,
      googleLink: event.htmlLink
    }))

    return NextResponse.json({
      events,
      source: 'google',
      calendarId: CALENDAR_ID
    })

  } catch (error: any) {
    console.error('Calendar fetch error:', error)
    
    // Return mock data as fallback
    return NextResponse.json({
      events: getMockEvents(),
      source: 'fallback',
      error: error.message
    })
  }
}

// Mock events for development/fallback
function getMockEvents(): CalendarEvent[] {
  // If no API key, we still want to show something useful
  // These are based on the regular Sunday schedule
  const today = new Date()
  const nextSunday = new Date(today)
  nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7)
  if (nextSunday <= today) {
    nextSunday.setDate(nextSunday.getDate() + 7)
  }
  nextSunday.setHours(11, 30, 0, 0) // 11:30 AM start

  const events: CalendarEvent[] = []

  // Generate 4 weeks of Sunday dances based on actual Fernhill schedule
  for (let i = 0; i < 4; i++) {
    const eventDate = new Date(nextSunday)
    eventDate.setDate(nextSunday.getDate() + (i * 7))
    
    const endDate = new Date(eventDate)
    endDate.setHours(14, 30, 0, 0) // 2:30 PM end

    events.push({
      id: `fernhill-sunday-${i}`,
      title: 'Sunday Ecstatic Dance',
      description: `Weekly ecstatic dance at Bridgespace!\n\nDoors: 11:30 AM\nDance Wave: 12:00 PM - 2:30 PM\n\nSliding Scale: $15 - Infinity\n\n🎵 Live DJ\n🕺 Barefoot dancing\n🤫 No phones on dance floor\n\nFor the latest DJ info, check our Instagram @fernhill_dance_community`,
      location: 'Bridgespace, 133 SE Madison St, Portland, OR 97214',
      start: eventDate.toISOString(),
      end: endDate.toISOString(),
      allDay: false,
      googleLink: 'https://calendar.google.com/calendar/embed?src=fernhilldance%40gmail.com&ctz=America%2FLos_Angeles'
    })
  }

  return events
}

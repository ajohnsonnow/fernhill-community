import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY
    
    // Return mock data in development if no API key
    if (!apiKey) {
      return NextResponse.json({
        main: { temp: 52, humidity: 65 },
        weather: [{ main: 'Clouds', description: 'partly cloudy', icon: '02d' }],
        name: 'Portland'
      })
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Portland,US&appid=${apiKey}&units=imperial`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    )

    if (!response.ok) {
      throw new Error('Failed to fetch weather data')
    }

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Weather API error:', error)
    // Return mock data on error
    return NextResponse.json({
      main: { temp: 52, humidity: 65 },
      weather: [{ main: 'Clouds', description: 'partly cloudy', icon: '02d' }],
      name: 'Portland'
    })
  }
}

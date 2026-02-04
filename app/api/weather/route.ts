import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY
    
    // Return mock data in development if no API key
    if (!apiKey) {
      const now = Date.now() / 1000
      return NextResponse.json({
        current: {
          main: { temp: 52, humidity: 65, feels_like: 49 },
          weather: [{ main: 'Clouds', description: 'partly cloudy', icon: '02d' }],
          wind: { speed: 8 },
          name: 'Portland'
        },
        hourly: [
          { dt: now + 3600, main: { temp: 53 }, weather: [{ main: 'Clouds', icon: '02d' }] },
          { dt: now + 7200, main: { temp: 54 }, weather: [{ main: 'Clouds', icon: '02d' }] },
          { dt: now + 10800, main: { temp: 55 }, weather: [{ main: 'Clear', icon: '01d' }] },
          { dt: now + 14400, main: { temp: 54 }, weather: [{ main: 'Clear', icon: '01d' }] },
          { dt: now + 18000, main: { temp: 52 }, weather: [{ main: 'Clouds', icon: '02n' }] },
          { dt: now + 21600, main: { temp: 50 }, weather: [{ main: 'Clouds', icon: '02n' }] },
        ],
        forecast: [
          { dt: now + 86400, main: { temp_max: 55, temp_min: 42 }, weather: [{ main: 'Clouds', icon: '02d' }] },
          { dt: now + 172800, main: { temp_max: 58, temp_min: 44 }, weather: [{ main: 'Rain', icon: '10d' }] },
          { dt: now + 259200, main: { temp_max: 52, temp_min: 40 }, weather: [{ main: 'Rain', icon: '10d' }] },
          { dt: now + 345600, main: { temp_max: 54, temp_min: 41 }, weather: [{ main: 'Clouds', icon: '03d' }] },
          { dt: now + 432000, main: { temp_max: 56, temp_min: 43 }, weather: [{ main: 'Clear', icon: '01d' }] },
        ]
      })
    }

    // Fetch current weather and forecast in parallel
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Portland,OR,US&appid=${apiKey}&units=imperial`,
        { next: { revalidate: 1800 } } // Cache for 30 minutes
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=Portland,OR,US&appid=${apiKey}&units=imperial&cnt=40`,
        { next: { revalidate: 1800 } }
      )
    ])

    if (!currentRes.ok) {
      throw new Error('Failed to fetch current weather')
    }

    const currentData = await currentRes.json()
    
    // Process forecast - get hourly and daily data
    let hourlyData: any[] = []
    let forecastData: any[] = []
    
    if (forecastRes.ok) {
      const forecastJson = await forecastRes.json()
      
      // Get next 6 hours for hourly forecast
      hourlyData = (forecastJson.list || []).slice(0, 6)
      
      // Process daily forecast - get one entry per day (noon readings)
      const dailyMap = new Map()
      
      forecastJson.list?.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toDateString()
        const hour = new Date(item.dt * 1000).getHours()
        
        // Prefer noon readings, but take any if we don't have that day yet
        if (!dailyMap.has(date) || (hour >= 11 && hour <= 14)) {
          dailyMap.set(date, item)
        }
      })
      
      // Get next 5 days (skip today)
      const today = new Date().toDateString()
      forecastData = Array.from(dailyMap.values())
        .filter(item => new Date(item.dt * 1000).toDateString() !== today)
        .slice(0, 5)
    }
    
    return NextResponse.json({
      current: currentData,
      hourly: hourlyData,
      forecast: forecastData
    })
  } catch (error) {
    console.error('Weather API error:', error)
    // Return mock data on error
    const now = Date.now() / 1000
    return NextResponse.json({
      current: {
        main: { temp: 52, humidity: 65, feels_like: 49 },
        weather: [{ main: 'Clouds', description: 'partly cloudy', icon: '02d' }],
        wind: { speed: 8 },
        name: 'Portland'
      },
      hourly: [
        { dt: now + 3600, main: { temp: 53 }, weather: [{ main: 'Clouds', icon: '02d' }] },
        { dt: now + 7200, main: { temp: 54 }, weather: [{ main: 'Clouds', icon: '02d' }] },
        { dt: now + 10800, main: { temp: 55 }, weather: [{ main: 'Clear', icon: '01d' }] },
      ],
      forecast: []
    })
  }
}

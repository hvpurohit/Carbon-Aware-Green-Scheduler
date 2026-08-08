import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const ELECTRICITY_MAPS_API = 'https://api.electricityMaps.com/v3/carbon-intensity/latest'

async function fetchCarbonIntensity(): Promise<number | null> {
  try {
    // For demo purposes, we'll use a mock API response
    // In production, replace with your actual ElectricityMaps API key
    const apiKey = process.env.ELECTRICITY_MAPS_API_KEY
    
    if (!apiKey) {
      console.warn('[v0] ELECTRICITY_MAPS_API_KEY not set, using mock data')
      // Return a mock value for demo
      return Math.floor(Math.random() * 400) + 50 // 50-450 gCO2eq/kWh
    }
    
    const response = await axios.get(ELECTRICITY_MAPS_API, {
      headers: {
        auth_token: apiKey,
      },
      params: {
        zone: 'US-CA', // California - customize as needed
      },
    })
    
    return response.data.carbonIntensity || null
  } catch (error) {
    console.error('[v0] Error fetching carbon intensity:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const carbonIntensity = await fetchCarbonIntensity()
    
    if (carbonIntensity === null) {
      return NextResponse.json(
        { error: 'Unable to fetch carbon intensity data' },
        { status: 503 }
      )
    }
    
    // Store in grid_history for tracking
    const supabase = createClient()
    await supabase
      .from('grid_history')
      .insert({
        carbon_intensity: carbonIntensity,
        timestamp: new Date().toISOString(),
      })
      .select()
    
    return NextResponse.json({
      carbonIntensity,
      timestamp: new Date().toISOString(),
      unit: 'gCO2eq/kWh',
    })
  } catch (error) {
    console.error('[v0] Error in GET /api/grid-status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

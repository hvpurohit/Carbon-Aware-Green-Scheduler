import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Priority inference from Python imports
const PRIORITY_MAP: { [key: string]: { priority: string; max_carbon_intensity: number } } = {
  // High priority - Real-time frameworks
  fastapi: { priority: 'high', max_carbon_intensity: 250 },
  flask: { priority: 'high', max_carbon_intensity: 250 },
  django: { priority: 'high', max_carbon_intensity: 250 },
  aiohttp: { priority: 'high', max_carbon_intensity: 250 },
  starlette: { priority: 'high', max_carbon_intensity: 250 },
  
  // Medium priority - Data processing/ML frameworks
  pandas: { priority: 'medium', max_carbon_intensity: 150 },
  numpy: { priority: 'medium', max_carbon_intensity: 150 },
  tensorflow: { priority: 'medium', max_carbon_intensity: 150 },
  torch: { priority: 'medium', max_carbon_intensity: 150 },
  sklearn: { priority: 'medium', max_carbon_intensity: 150 },
  scipy: { priority: 'medium', max_carbon_intensity: 150 },
  polars: { priority: 'medium', max_carbon_intensity: 150 },
  
  // Low priority - Default
  requests: { priority: 'low', max_carbon_intensity: 50 },
  urllib: { priority: 'low', max_carbon_intensity: 50 },
  json: { priority: 'low', max_carbon_intensity: 50 },
}

function inferPriority(code: string): { priority: string; max_carbon_intensity: number; imports: string[] } {
  const importRegex = /^(?:from|import)\s+([\w\.]+)/gm
  const imports: string[] = []
  let match
  
  while ((match = importRegex.exec(code)) !== null) {
    const moduleName = match[1].split('.')[0].toLowerCase()
    imports.push(moduleName)
  }
  
  // Find highest priority among inferred imports
  let priority = 'low'
  let max_carbon_intensity = 50
  
  for (const imp of imports) {
    const config = PRIORITY_MAP[imp]
    if (config) {
      // High > Medium > Low
      if (config.priority === 'high') {
        priority = 'high'
        max_carbon_intensity = 250
      } else if (config.priority === 'medium' && priority !== 'high') {
        priority = 'medium'
        max_carbon_intensity = 150
      }
    }
  }
  
  return { priority, max_carbon_intensity, imports }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid code: must be a non-empty string' },
        { status: 400 }
      )
    }
    
    // Infer priority and carbon intensity threshold
    const { priority, max_carbon_intensity, imports } = inferPriority(code)
    
    const supabase = createClient()
    
    // Insert job into database
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        code,
        priority,
        max_carbon_intensity,
        inferred_imports: imports,
        status: 'queued',
      })
      .select()
    
    if (error) {
      console.error('[v0] Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Error in POST /api/jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('[v0] Supabase select error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[v0] Error in GET /api/jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

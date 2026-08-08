import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

// Fetch current carbon intensity
async function getCarbonIntensity(): Promise<number> {
  try {
    const apiKey = process.env.ELECTRICITY_MAPS_API_KEY
    
    if (!apiKey) {
      // Mock data for demo
      return Math.floor(Math.random() * 400) + 50
    }
    
    const response = await axios.get('https://api.electricityMaps.com/v3/carbon-intensity/latest', {
      headers: { auth_token: apiKey },
      params: { zone: 'US-CA' },
    })
    
    return response.data.carbonIntensity || 100
  } catch (error) {
    console.error('[v0] Error fetching carbon intensity:', error)
    return 100 // Default fallback
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createClient()
    
    // Fetch the job
    const { data: jobData, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !jobData) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
    
    // Check if job can be executed
    if (jobData.status !== 'queued') {
      return NextResponse.json(
        { error: `Job cannot be executed - status is ${jobData.status}` },
        { status: 400 }
      )
    }
    
    // Get current carbon intensity
    const carbonIntensity = await getCarbonIntensity()
    
    // Check if grid is clean enough
    if (carbonIntensity > jobData.max_carbon_intensity) {
      // Mark as delayed
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status: 'delayed',
          grid_intensity_at_execution: carbonIntensity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      
      if (!updateError) {
        return NextResponse.json({
          id,
          status: 'delayed',
          message: `Grid too dirty (${carbonIntensity} > ${jobData.max_carbon_intensity})`,
          carbonIntensity,
        })
      }
    }
    
    // Mark as executing
    await supabase
      .from('jobs')
      .update({
        status: 'executing',
        grid_intensity_at_execution: carbonIntensity,
        execution_start_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    
    // Write code to temp file and execute
    const tempFile = join('/tmp', `python_${uuidv4()}.py`)
    let stdout = ''
    let stderr = ''
    let executionError = false
    
    try {
      writeFileSync(tempFile, jobData.code)
      
      try {
        stdout = execSync(`python3 ${tempFile}`, {
          encoding: 'utf-8',
          timeout: 30000, // 30 second timeout
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        })
      } catch (execError: any) {
        stderr = execError.stderr?.toString() || execError.message
        executionError = true
      }
    } finally {
      // Clean up temp file
      try {
        unlinkSync(tempFile)
      } catch (e) {
        console.error('[v0] Failed to delete temp file:', e)
      }
    }
    
    const executionEndTime = new Date()
    const executionStartTime = new Date(jobData.execution_start_time || new Date())
    const executionDuration = executionEndTime.getTime() - executionStartTime.getTime()
    
    // Update job with results
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        status: executionError ? 'failed' : 'completed',
        stdout,
        stderr,
        execution_end_time: executionEndTime.toISOString(),
        updated_at: executionEndTime.toISOString(),
      })
      .eq('id', id)
      .select()
    
    if (updateError) {
      console.error('[v0] Failed to update job:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      ...updatedJob?.[0],
      executionDuration,
    })
  } catch (error) {
    console.error('[v0] Error in job execution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

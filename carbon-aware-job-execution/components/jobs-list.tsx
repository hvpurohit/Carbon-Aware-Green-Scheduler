'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Download, Play, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: string
  status: string
  priority: string
  code: string
  inferred_imports: string[]
  stdout: string | null
  stderr: string | null
  grid_intensity_at_execution: number | null
  execution_start_time: string | null
  execution_end_time: string | null
  created_at: string
  updated_at: string
}

export function JobsList({ refreshTrigger }: { refreshTrigger: number }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
  const [executingJobId, setExecutingJobId] = useState<string | null>(null)

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('[v0] Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [refreshTrigger])

  // Poll for job updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchJobs, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'executing':
        return 'bg-blue-100 text-blue-800'
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800'
      case 'queued':
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-orange-100 text-orange-800'
      case 'low':
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getExecutionDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return null
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime()
    return Math.round(duration / 1000) // seconds
  }

  const handleExecuteJob = async (jobId: string) => {
    setExecutingJobId(jobId)
    try {
      const response = await fetch(`/api/jobs/${jobId}/execute`, {
        method: 'POST',
      })
      if (response.ok) {
        await fetchJobs()
      }
    } catch (error) {
      console.error('[v0] Error executing job:', error)
    } finally {
      setExecutingJobId(null)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">Loading jobs...</div>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">No jobs submitted yet. Submit Python code above to get started!</div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Jobs ({jobs.length})</h2>
      {jobs.map((job) => (
        <Card key={job.id} className="overflow-hidden">
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <code className="text-sm font-mono text-gray-600 truncate">{job.id.slice(0, 8)}...</code>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                  <Badge className={getPriorityColor(job.priority)}>
                    {job.priority}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(job.created_at).toLocaleString()}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {job.status === 'queued' && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExecuteJob(job.id)
                    }}
                    disabled={executingJobId === job.id}
                  >
                    {executingJobId === job.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Execute
                      </>
                    )}
                  </Button>
                )}
                
                {(job.status === 'completed' || job.status === 'failed') && (
                  <Link href={`/jobs/${job.id}/certificate`}>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1" />
                      Certificate
                    </Button>
                  </Link>
                )}
                
                <button
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedJobId(expandedJobId === job.id ? null : job.id)
                  }}
                >
                  {expandedJobId === job.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedJobId === job.id && (
            <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Code Submitted</h4>
                <pre className="bg-white p-3 rounded border border-gray-300 text-xs overflow-x-auto max-h-40 overflow-y-auto">
                  {job.code}
                </pre>
              </div>

              {job.inferred_imports.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Detected Frameworks</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.inferred_imports.map((imp) => (
                      <Badge key={imp} variant="outline">
                        {imp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.grid_intensity_at_execution !== null && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Execution Metrics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Grid Intensity</p>
                      <p className="font-semibold">{Math.round(job.grid_intensity_at_execution)} gCO2eq/kWh</p>
                    </div>
                    {job.execution_start_time && job.execution_end_time && (
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-semibold">{getExecutionDuration(job.execution_start_time, job.execution_end_time)}s</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {job.stdout && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Output</h4>
                  <pre className="bg-white p-3 rounded border border-gray-300 text-xs overflow-x-auto max-h-40 overflow-y-auto text-green-700">
                    {job.stdout}
                  </pre>
                </div>
              )}

              {job.stderr && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Errors</h4>
                  <pre className="bg-white p-3 rounded border border-gray-300 text-xs overflow-x-auto max-h-40 overflow-y-auto text-red-700">
                    {job.stderr}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

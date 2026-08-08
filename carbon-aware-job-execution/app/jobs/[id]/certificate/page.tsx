'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, ArrowLeft, Loader2 } from 'lucide-react'

interface Job {
  id: string
  status: string
  priority: string
  grid_intensity_at_execution: number | null
  execution_start_time: string | null
  execution_end_time: string | null
  created_at: string
  updated_at: string
  stdout: string | null
  inferred_imports: string[]
}

export default function CertificatePage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs`)
        if (response.ok) {
          const jobs = await response.json()
          const foundJob = jobs.find((j: Job) => j.id === jobId)
          if (foundJob) {
            setJob(foundJob)
          } else {
            setError('Job not found')
          }
        }
      } catch (err) {
        setError('Failed to fetch job')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId])

  const handleDownloadCertificate = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}/certificate`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `green-certificate-${jobId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      setError('Failed to download certificate')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-4">Loading certificate...</p>
        </div>
      </main>
    )
  }

  if (error || !job) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="p-6 bg-red-50 border border-red-200">
            <p className="text-red-800">{error || 'Job not found'}</p>
          </Card>
        </div>
      </main>
    )
  }

  const getExecutionDuration = () => {
    if (!job.execution_start_time || !job.execution_end_time) return null
    const duration = new Date(job.execution_end_time).getTime() - new Date(job.execution_start_time).getTime()
    return Math.round(duration / 1000)
  }

  const duration = getExecutionDuration()

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8 border-2 border-green-200 bg-white shadow-lg">
          {/* Certificate Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-green-100">
            <div className="text-5xl mb-3">✅</div>
            <h1 className="text-3xl font-bold text-green-700 mb-2">Green Certificate</h1>
            <p className="text-gray-600">Carbon-Aware Code Execution Report</p>
          </div>

          {/* Certificate Content */}
          <div className="space-y-6">
            {/* Job ID */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Job ID</p>
              <p className="font-mono text-sm text-gray-900">{job.id}</p>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</p>
                <Badge className={`${
                  job.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : job.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {job.status}
                </Badge>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Priority</p>
                <Badge className={`${
                  job.priority === 'high'
                    ? 'bg-red-100 text-red-800'
                    : job.priority === 'medium'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {job.priority}
                </Badge>
              </div>
            </div>

            {/* Grid Carbon Intensity */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Grid Carbon Intensity at Execution</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-700">
                  {job.grid_intensity_at_execution !== null ? Math.round(job.grid_intensity_at_execution) : 'N/A'}
                </span>
                <span className="text-gray-600">gCO2eq/kWh</span>
              </div>
            </div>

            {/* Timing Information */}
            <div className="grid grid-cols-2 gap-4">
              {job.execution_start_time && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Start Time</p>
                  <p className="text-sm text-gray-900">
                    {new Date(job.execution_start_time).toLocaleString()}
                  </p>
                </div>
              )}
              {duration !== null && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-sm font-semibold text-gray-900">{duration}s</p>
                </div>
              )}
            </div>

            {/* Detected Frameworks */}
            {job.inferred_imports.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Detected Frameworks</p>
                <div className="flex flex-wrap gap-2">
                  {job.inferred_imports.map((imp) => (
                    <Badge key={imp} variant="outline">
                      {imp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Output Preview */}
            {job.stdout && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Execution Output</p>
                <pre className="bg-white p-3 rounded border border-gray-300 text-xs overflow-x-auto max-h-48 overflow-y-auto text-green-700">
                  {job.stdout.slice(0, 500)}
                  {job.stdout.length > 500 && '... (truncated)'}
                </pre>
              </div>
            )}

            {/* Download Button */}
            <div className="pt-6">
              <Button
                onClick={handleDownloadCertificate}
                disabled={downloading}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Green Certificate PDF
                  </>
                )}
              </Button>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
              <p>This certificate proves your commitment to carbon-aware code execution.</p>
              <p className="mt-1">Share it with your team and help build a greener internet! 🌍</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

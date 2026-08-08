'use client'

import { FormEvent, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, Upload } from 'lucide-react'

interface SubmissionResponse {
  id: string
  status: string
  priority: string
}

export function JobSubmissionForm({ onJobCreated }: { onJobCreated: () => void }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setCode(event.target.result as string)
      }
    }
    reader.readAsText(file)
    
    // Clear the input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit job')
      }

      const data: SubmissionResponse = await response.json()
      setSuccess(true)
      setCode('')
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
      onJobCreated()

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Python Code</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Python Code
            </label>
            <div>
              <input
                type="file"
                accept=".py,.txt"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Python code here..."
            className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-2">
            Code will be analyzed for framework imports to determine execution priority
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">✓ Job submitted successfully! Check the jobs list below.</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={!code.trim() || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Job'
          )}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Priority Inference</h4>
        <p className="text-xs text-blue-800 mb-3">
          Your code is automatically scanned for imports to set the right priority level:
        </p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li><strong>High (250):</strong> fastapi, flask, django, aiohttp, starlette</li>
          <li><strong>Medium (150):</strong> pandas, numpy, tensorflow, torch, sklearn, scipy</li>
          <li><strong>Low (50):</strong> Default for scripts without detected frameworks</li>
        </ul>
      </div>
    </Card>
  )
}

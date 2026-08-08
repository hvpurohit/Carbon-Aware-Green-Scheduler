'use client'

import { useState } from 'react'
import { GridStatusWidget } from '@/components/grid-status-widget'
import { JobSubmissionForm } from '@/components/job-submission-form'
import { JobsList } from '@/components/jobs-list'

export function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          ⚡ Carbon-Aware Execution Platform
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Automatically defer Python code execution until the power grid is cleanest. Get a Green Certificate to prove your environmental commitment.
        </p>
      </div>

      {/* Grid Status */}
      <div className="mb-8">
        <GridStatusWidget />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Submission Form */}
        <div className="lg:col-span-1">
          <JobSubmissionForm onJobCreated={() => setRefreshTrigger(prev => prev + 1)} />
        </div>

        {/* Jobs List */}
        <div className="lg:col-span-2">
          <JobsList refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-2xl mb-2">🌱</div>
          <h3 className="font-semibold text-gray-900 mb-2">Carbon-Aware</h3>
          <p className="text-sm text-gray-600">
            Automatically checks grid carbon intensity before execution to minimize environmental impact.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="font-semibold text-gray-900 mb-2">Smart Priority</h3>
          <p className="text-sm text-gray-600">
            Analyzes your code imports to intelligently set execution thresholds based on workload type.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-2xl mb-2">📜</div>
          <h3 className="font-semibold text-gray-900 mb-2">Green Certificates</h3>
          <p className="text-sm text-gray-600">
            Download PDF certificates documenting your code execution and carbon footprint.
          </p>
        </div>
      </div>
    </div>
  )
}

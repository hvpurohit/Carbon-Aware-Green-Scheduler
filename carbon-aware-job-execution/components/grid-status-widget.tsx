'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Zap } from 'lucide-react'

interface GridStatus {
  carbonIntensity: number
  timestamp: string
  unit: string
}

export function GridStatusWidget() {
  const [gridStatus, setGridStatus] = useState<GridStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGridStatus = async () => {
      try {
        const response = await fetch('/api/grid-status')
        if (response.ok) {
          const data = await response.json()
          setGridStatus(data)
        }
      } catch (error) {
        console.error('[v0] Error fetching grid status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGridStatus()
    // Poll every 15 seconds
    const interval = setInterval(fetchGridStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  const getIntensityColor = (intensity: number | undefined) => {
    if (!intensity) return 'bg-gray-100'
    if (intensity < 100) return 'bg-green-50'
    if (intensity < 200) return 'bg-yellow-50'
    if (intensity < 300) return 'bg-orange-50'
    return 'bg-red-50'
  }

  const getIntensityTextColor = (intensity: number | undefined) => {
    if (!intensity) return 'text-gray-600'
    if (intensity < 100) return 'text-green-700'
    if (intensity < 200) return 'text-yellow-700'
    if (intensity < 300) return 'text-orange-700'
    return 'text-red-700'
  }

  const getCleanlinessLabel = (intensity: number | undefined) => {
    if (!intensity) return 'Unknown'
    if (intensity < 100) return 'Very Clean'
    if (intensity < 200) return 'Clean'
    if (intensity < 300) return 'Moderate'
    return 'Dirty'
  }

  return (
    <Card className={`p-6 ${getIntensityColor(gridStatus?.carbonIntensity)}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`w-5 h-5 ${getIntensityTextColor(gridStatus?.carbonIntensity)}`} />
            <h3 className="text-lg font-semibold text-gray-900">Grid Carbon Intensity</h3>
          </div>
          
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : gridStatus ? (
            <>
              <div className={`text-4xl font-bold ${getIntensityTextColor(gridStatus.carbonIntensity)}`}>
                {Math.round(gridStatus.carbonIntensity)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {gridStatus.unit}
              </div>
              <div className={`text-sm font-medium mt-3 ${getIntensityTextColor(gridStatus.carbonIntensity)}`}>
                {getCleanlinessLabel(gridStatus.carbonIntensity)}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Updated: {new Date(gridStatus.timestamp).toLocaleTimeString()}
              </div>
            </>
          ) : (
            <div className="text-sm text-red-500">Unable to fetch grid data</div>
          )}
        </div>
      </div>
      
      {/* Visual intensity indicator */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              !gridStatus
                ? 'w-0'
                : gridStatus.carbonIntensity < 100
                ? 'w-1/4 bg-green-500'
                : gridStatus.carbonIntensity < 200
                ? 'w-2/4 bg-yellow-500'
                : gridStatus.carbonIntensity < 300
                ? 'w-3/4 bg-orange-500'
                : 'w-full bg-red-500'
            }`}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0</span>
          <span>500</span>
        </div>
      </div>
    </Card>
  )
}

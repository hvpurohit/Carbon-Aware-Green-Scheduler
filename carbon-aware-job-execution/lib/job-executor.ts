/**
 * Background job executor
 * Polls for queued jobs and automatically executes them when conditions are met
 */

interface JobConfig {
  pollIntervalMs?: number
  maxConcurrentJobs?: number
}

class JobExecutor {
  private isRunning = false
  private pollIntervalMs: number
  private maxConcurrentJobs: number
  private activeJobs = new Set<string>()

  constructor(config: JobConfig = {}) {
    this.pollIntervalMs = config.pollIntervalMs || 30000 // 30 seconds
    this.maxConcurrentJobs = config.maxConcurrentJobs || 2
  }

  /**
   * Start the background job executor
   */
  start() {
    if (this.isRunning) {
      console.warn('[v0] Job executor already running')
      return
    }

    this.isRunning = true
    console.log('[v0] Job executor started')
    this.poll()
  }

  /**
   * Stop the background job executor
   */
  stop() {
    this.isRunning = false
    console.log('[v0] Job executor stopped')
  }

  /**
   * Poll for queued jobs and execute them
   */
  private async poll() {
    if (!this.isRunning) return

    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const jobs = await response.json()
        
        // Find queued jobs
        const queuedJobs = jobs.filter((job: any) => job.status === 'queued')
        
        // Execute jobs respecting max concurrent limit
        for (const job of queuedJobs) {
          if (this.activeJobs.size >= this.maxConcurrentJobs) {
            break
          }

          if (!this.activeJobs.has(job.id)) {
            this.activeJobs.add(job.id)
            this.executeJob(job.id).finally(() => {
              this.activeJobs.delete(job.id)
            })
          }
        }
      }
    } catch (error) {
      console.error('[v0] Error polling jobs:', error)
    } finally {
      // Schedule next poll
      if (this.isRunning) {
        setTimeout(() => this.poll(), this.pollIntervalMs)
      }
    }
  }

  /**
   * Execute a specific job
   */
  private async executeJob(jobId: string) {
    try {
      console.log(`[v0] Executing job: ${jobId}`)
      const response = await fetch(`/api/jobs/${jobId}/execute`, {
        method: 'POST',
      })

      if (!response.ok) {
        console.error(`[v0] Job execution failed for ${jobId}:`, await response.text())
      } else {
        const result = await response.json()
        console.log(`[v0] Job execution completed for ${jobId}:`, result)
      }
    } catch (error) {
      console.error(`[v0] Error executing job ${jobId}:`, error)
    }
  }
}

// Export singleton instance
export const jobExecutor = new JobExecutor()

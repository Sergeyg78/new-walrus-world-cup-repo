// src/hooks/useScores.js
// Fetches live WC2026 scores from our /api/scores endpoint
import { useState, useEffect, useCallback } from 'react'

export function useScores() {
  const [finished, setFinished] = useState([])
  const [live,     setLive]     = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [lastFetch, setLastFetch] = useState(null)

  const fetchScores = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/scores')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFinished(data.finished || [])
      setLive(data.live || [])
      setLastFetch(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    fetchScores()
  }, [fetchScores])

  // Auto-match a prediction text to a finished result
  function findResult(predictionText) {
    const pred = predictionText.toLowerCase()
    return finished.find(m => {
      const home = m.home?.toLowerCase() || ''
      const away = m.away?.toLowerCase() || ''
      return pred.includes(home) || pred.includes(away)
    }) || null
  }

  return { finished, live, loading, error, lastFetch, fetchScores, findResult }
}
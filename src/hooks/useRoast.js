// Custom hook for Claude AI roast/praise/debate/grudge calls
// All calls go through /api/roast (Vercel serverless function)
// so the Anthropic API key stays secret on the server

import { useState, useCallback } from 'react'

export function useRoast() {
  const [response, setResponse] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [lastType, setLastType] = useState('')

  // ── Core fetch helper ─────────────────────────────────────────────────────
  const callApi = useCallback(async (payload) => {
    setLoading(true)
    setLastType(payload.type)
    setResponse('')
    try {
      const res = await fetch('/api/roast', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || `API error ${res.status}`)
      }
      setResponse(data.response)
      return data.response
    } catch (err) {
      const msg = `(AI unavailable: ${err.message.slice(0, 80)})`
      setResponse(msg)
      return msg
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Roast — called when prediction is marked wrong ────────────────────────
  const roast = useCallback((username, prediction, actual, grudgeLog, stats) =>
    callApi({
      type: 'roast',
      username,
      prediction,
      actual,
      grudgeLog,
      stats,
    }),
  [callApi])

  // ── Praise — called when prediction is marked correct ─────────────────────
  const praise = useCallback((username, prediction, stats, grudgeLog) =>
    callApi({
      type: 'praise',
      username,
      prediction,
      stats,
      grudgeLog,
    }),
  [callApi])

  // ── Debate — called when hot take is submitted ────────────────────────────
  const debate = useCallback((username, hotTake, pastTakes) =>
    callApi({
      type: 'debate',
      username,
      hotTake,
      pastTakes,
    }),
  [callApi])

  // ── Grudge report — full summary of all failures ──────────────────────────
  const grudgeReport = useCallback((username, grudgeLog, stats) =>
    callApi({
      type: 'grudge_report',
      username,
      grudgeLog,
      stats,
    }),
  [callApi])

  return {
    response,
    loading,
    lastType,
    roast,
    praise,
    debate,
    grudgeReport,
    clearResponse: () => setResponse(''),
  }
}
// src/pages/Dashboard.jsx
import { useState } from 'react'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { useWalrus }  from '../hooks/useWalrus'
import { useRoast }   from '../hooks/useRoast'
import {
  addPrediction, resolvePrediction, addHotTake,
  getPending, NOTABLE_MATCHES,
} from '../lib/state'
import { getExplorerUrl, saveLocalBlobId } from '../lib/walrus'
import toast from 'react-hot-toast'
import { useScores } from '../hooks/useScores'

const TABS = [
  '📝 Predict',
  '✅ Resolve',
  '💬 Hot Takes',
  '😤 Grudge Report',
  '🔴 Live Scores',
  '📖 History',
]

export function Dashboard({ appState, setAppState, blobChain, setBlobChain }) {
  const account                = useCurrentAccount()
  const { save, saving }       = useWalrus()
  const { response, loading: roastLoading, lastType, roast, praise, debate, grudgeReport } = useRoast()
  const { finished, live, loading: scoresLoading, error: scoresError, lastFetch, fetchScores, findResult } = useScores()
  const [tab, setTab]          = useState(0)
  const [lastBlobId, setLastBlobId] = useState(appState.blobChain?.slice(-1)[0] || '')

  const addr  = account?.address || appState.address || ''
  const short = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

  // ── Auto-save helper ────────────────────────────────────────────────────────
  async function autoSave(newState) {
    if (!account) { toast.error('Wallet not connected — save failed'); return newState }
    const toastId = toast.loading('Saving to Walrus Mainnet... (wallet will prompt twice)')
    try {
      const blobId  = await save(newState)
      const chain   = [...(blobChain || []), blobId].slice(-20)
      const updated = { ...newState, blobChain: chain, lastUpdated: new Date().toISOString() }
      setBlobChain(chain)
      setLastBlobId(blobId)
      if (account?.address) saveLocalBlobId(account.address, blobId)
      setAppState(updated)
      toast.success(`✅ Saved to Walrus Mainnet!\nBlob: ${blobId.slice(0, 12)}...`, { id: toastId, duration: 6000 })
      return updated
    } catch (err) {
      toast.error(`Save failed: ${err.message}`, { id: toastId })
      return newState
    }
  }

  // ── Stats row ───────────────────────────────────────────────────────────────
  const s = appState.stats || {}

  return (
    <div className="dashboard">
      {/* Hero */}
      <div className="hero">
        <div className="hero-stripe" />
        <div className="hero-inner">
          <span className="hero-ball">⚽</span>
          <h1>WC2026 GRUDGE AGENT</h1>
          <p className="subtitle">
            Welcome back, <strong style={{ color: '#ffd700' }}>{short}</strong> — I remember everything you've ever gotten wrong 😤
          </p>
          <div className="hero-badges">
            <span className="badge-pill walrus">🌊 Walrus Mainnet</span>
            <span className="badge-pill usa">🇺🇸 Jun 11 – Jul 19, 2026</span>
            {lastBlobId && <span className="badge-pill wc">🔗 Memory Active</span>}
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          ⚽ WC2026 kicks off June 11, 2026 &nbsp;·&nbsp;
          🏟️ MetLife Stadium Final &nbsp;·&nbsp;
          🔥 Every wrong prediction logged &nbsp;·&nbsp;
          😤 Grudges held forever on Walrus Mainnet &nbsp;·&nbsp;
          ⚡ {short} — make your predictions count &nbsp;·&nbsp;
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {[
          ['✅', s.correct || 0,            'Correct',  'green'],
          ['❌', s.wrong || 0,              'Wrong',    'red'],
          ['⏳', s.pending || 0,            'Pending',  'yellow'],
          ['📊', s.winRate || '0%',         'Win Rate', 'blue'],
          ['😤', appState.grudgeLog?.length || 0, 'Grudges',  'purple'],
          ['🔥', appState.hotTakes?.length  || 0, 'Hot Takes','orange'],
        ].map(([icon, val, label, cls]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-val ${cls}`}>{icon} {val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Agent response */}
      {response && (
        <div className={`agent-bubble ${
          lastType === 'roast' || lastType === 'grudge_report' ? 'roast' :
          lastType === 'praise' ? 'praise' : 'debate'
        }`}>
          <div className="bubble-tag">🤖 Agent</div>
          {roastLoading ? '...' : response}
        </div>
      )}

      {/* Blob status */}
      {lastBlobId && (
        <div className="blob-status">
          <span className="dot green pulse" />
          <span>Saved to Walrus Mainnet · </span>
          <a href={getExplorerUrl(lastBlobId)} target="_blank" rel="noreferrer">
            View blob ↗
          </a>
          <span className="blob-id-short"> · {lastBlobId.slice(0, 14)}...</span>
        </div>
      )}

      {/* Sidebar wallet info */}
      <div className="topbar">
        <div className="wallet-info">
          <span className="dot green" />
          <span>{short}</span>
        </div>
        <ConnectButton />
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button key={t} className={`tab-btn ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tab === 0 && <PredictTab appState={appState} autoSave={autoSave} />}
        {tab === 1 && <ResolveTab appState={appState} autoSave={autoSave} roast={roast} praise={praise} saving={saving} />}
        {tab === 2 && <HotTakesTab appState={appState} autoSave={autoSave} debate={debate} saving={saving} />}
        {tab === 3 && <GrudgeTab appState={appState} grudgeReport={grudgeReport} loading={roastLoading} />}
        {tab === 4 && (
          <LiveScoresTab
            finished={finished}
            live={live}
            loading={scoresLoading}
            error={scoresError}
            lastFetch={lastFetch}
            fetchScores={fetchScores}
          />
        )}
        {tab === 5 && (
          <HistoryTab
            appState={appState}
            blobChain={blobChain}
          />
        )}
      </div>
    </div>
  )
}

// ── Tab: Predict ─────────────────────────────────────────────────────────────
function PredictTab({ appState, autoSave }) {
  const [match, setMatch]       = useState('')
  const [custom, setCustom]     = useState('')
  const [prediction, setPred]   = useState('')
  const [submitting, setSub]    = useState(false)

  async function submit() {
    const m = match === 'Custom...' ? custom : match
    if (!m || !prediction.trim()) return toast.error('Fill in match and prediction')
    setSub(true)
    const newState = addPrediction(appState, m, prediction.trim())
    await autoSave(newState)
    setMatch(''); setCustom(''); setPred('')
    setSub(false)
  }

  return (
    <div className="tab-panel">
      <h2 className="sec-head">📝 New Prediction</h2>
      <div className="form-row">
        <div className="form-col">
          <label>Match / Event</label>
          <select value={match} onChange={e => setMatch(e.target.value)}>
            <option value="">Select a match...</option>
            <option value="Custom...">Custom...</option>
            {NOTABLE_MATCHES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {match === 'Custom...' && (
            <input placeholder="e.g. Brazil vs Argentina" value={custom} onChange={e => setCustom(e.target.value)} />
          )}
        </div>
        <div className="form-col">
          <label>Your Prediction</label>
          <textarea
            placeholder="e.g. Brazil wins 2-1, Vinicius Jr scores"
            value={prediction}
            onChange={e => setPred(e.target.value)}
            rows={4}
          />
        </div>
      </div>
      <button className="btn-primary" onClick={submit} disabled={submitting}>
        {submitting ? 'Saving to Walrus...' : '📌 Submit Prediction'}
      </button>
      <p className="hint">⚠️ Submitting will prompt your Sui wallet twice (register + certify on Walrus Mainnet)</p>

      <h3 className="sec-head" style={{ marginTop: 28 }}>All Predictions</h3>
      {appState.predictions.length === 0 ? (
        <p className="empty">No predictions yet. Make one above!</p>
      ) : (
        [...appState.predictions].reverse().map(p => (
          <div className="pred-row" key={p.id}>
            <span className={`badge badge-${p.status}`}>{
              p.status === 'pending' ? '⏳' : p.status === 'correct' ? '✅' : '❌'
            } {p.status}</span>
            <span className="pred-text"><strong>{p.match}</strong>: {p.prediction}</span>
            {p.result && <span className="pred-result">→ {p.result}</span>}
            <span className="pred-date">{new Date(p.date).toLocaleDateString()}</span>
          </div>
        ))
      )}
    </div>
  )
}

// ── Tab: Resolve ─────────────────────────────────────────────────────────────
function ResolveTab({ appState, autoSave, roast, praise, saving }) {
  const pending               = getPending(appState)
  const [chosen, setChosen]   = useState('')
  const [actual, setActual]   = useState('')
  const [resolving, setRes]   = useState(false)

  async function resolve(correct) {
    if (!chosen || !actual.trim()) return toast.error('Select a prediction and enter result')
    const id = parseInt(chosen)
    setRes(true)
    const newState = resolvePrediction(appState, id, actual.trim(), correct)
    const pred     = appState.predictions.find(p => p.id === id)
    const saved    = await autoSave(newState)
    if (correct) {
      await praise(saved.address || appState.address, pred?.prediction || '', newState.stats, newState.grudgeLog)
    } else {
      await roast(saved.address || appState.address, pred?.prediction || '', actual.trim(), newState.grudgeLog, newState.stats)
    }
    setChosen(''); setActual('')
    setRes(false)
  }

  return (
    <div className="tab-panel">
      <h2 className="sec-head">✅ Resolve a Prediction</h2>
      {pending.length === 0 ? (
        <p className="empty">No pending predictions. Make some in the Predict tab!</p>
      ) : (
        <>
          <div className="form-row">
            <div className="form-col">
              <label>Select Prediction</label>
              <select value={chosen} onChange={e => setChosen(e.target.value)}>
                <option value="">Choose...</option>
                {pending.map(p => (
                  <option key={p.id} value={p.id}>#{p.id} {p.match} — {p.prediction}</option>
                ))}
              </select>
            </div>
            <div className="form-col">
              <label>What actually happened?</label>
              <input
                placeholder="e.g. Argentina won 3-0"
                value={actual}
                onChange={e => setActual(e.target.value)}
              />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn-correct" onClick={() => resolve(true)} disabled={resolving || saving}>
              {resolving ? '...' : '✅ Mark Correct'}
            </button>
            <button className="btn-wrong" onClick={() => resolve(false)} disabled={resolving || saving}>
              {resolving ? '...' : '❌ Mark Wrong 🔥'}
            </button>
          </div>
          <p className="hint">⚠️ Resolving auto-saves to Walrus — wallet will prompt twice</p>
        </>
      )}
    </div>
  )
}

// ── Tab: Hot Takes ────────────────────────────────────────────────────────────
function HotTakesTab({ appState, autoSave, debate, saving }) {
  const [take, setTake]       = useState('')
  const [submitting, setSub]  = useState(false)

  async function submit() {
    if (!take.trim()) return toast.error('Type your hot take!')
    setSub(true)
    const past     = [...appState.hotTakes]
    const newState = addHotTake(appState, take.trim())
    const saved    = await autoSave(newState)
    await debate(saved.address || appState.address, take.trim(), past)
    setTake('')
    setSub(false)
  }

  return (
    <div className="tab-panel">
      <h2 className="sec-head">💬 Drop a Hot Take</h2>
      <textarea
        placeholder="e.g. Mbappe is overrated, France won't make it past the quarters..."
        value={take}
        onChange={e => setTake(e.target.value)}
        rows={4}
      />
      <button className="btn-primary" onClick={submit} disabled={submitting || saving}>
        {submitting ? 'Submitting...' : '🔥 Submit Hot Take'}
      </button>
      <p className="hint">⚠️ Submitting saves to Walrus — wallet will prompt twice</p>

      {appState.hotTakes.length > 0 && (
        <>
          <h3 className="sec-head" style={{ marginTop: 28 }}>Your Hot Take History</h3>
          {[...appState.hotTakes].reverse().map((t, i) => (
            <div className="pred-row" key={i}>
              <span>💬</span>
              <span className="pred-text"><em>"{t.take}"</em></span>
              <span className="pred-date">{t.date}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ── Tab: Grudge Report ────────────────────────────────────────────────────────
function GrudgeTab({ appState, grudgeReport, loading }) {
  async function generate() {
    await grudgeReport(appState.address, appState.grudgeLog, appState.stats)
  }

  return (
    <div className="tab-panel">
      <h2 className="sec-head">😤 The Grudge Report</h2>
      <button className="btn-danger" onClick={generate} disabled={loading}>
        {loading ? 'Compiling failures...' : '💀 Generate Full Grudge Report'}
      </button>

      {appState.grudgeLog?.length > 0 ? (
        <>
          <h3 className="sec-head" style={{ marginTop: 28 }}>All Grudges on File</h3>
          {[...appState.grudgeLog].reverse().map((g, i) => (
            <div className="pred-row grudge" key={i}>
              <span>😤</span>
              <span className="pred-text">
                <strong>{g.match}</strong>: predicted "<em>{g.prediction}</em>" but "<em>{g.actual}</em>" happened
              </span>
              <span className="pred-date">{g.date}</span>
            </div>
          ))}
        </>
      ) : (
        <p className="empty">No grudges yet. Make some wrong predictions first! 😈</p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: Live Scores + Auto-resolve
// ══════════════════════════════════════════════════════════════════════════════
function LiveScoresTab({
  finished, live, loading, error, lastFetch,
  fetchScores, appState, autoSave, roast, praise,
  saving, findResult, short,
}) {
  const [autoResolving, setAutoResolving] = useState(false)
  const [resolved, setResolved] = useState([])

  // ── Auto-resolve pending predictions against real results ─────────────────
  async function autoResolve() {
    const pending = appState.predictions.filter(p => p.status === 'pending')
    if (pending.length === 0) {
      toast('No pending predictions to resolve!')
      return
    }

    setAutoResolving(true)
    let currentState = { ...appState }
    const resolvedNames = []

    for (const pred of pending) {
      const match = findResult(pred.prediction + ' ' + pred.match)
      if (!match) continue

      const homeWon = match.homeGoals > match.awayGoals
      const awayWon = match.awayGoals > match.homeGoals
      const predLower = pred.prediction.toLowerCase()

      // Simple win/draw detection
      let correct = false
      if (predLower.includes('draw') || predLower.includes('tie')) {
        correct = match.homeGoals === match.awayGoals
      } else if (predLower.includes(match.home?.toLowerCase())) {
        correct = homeWon
      } else if (predLower.includes(match.away?.toLowerCase())) {
        correct = awayWon
      } else {
        // Can't determine — skip
        continue
      }

      // Import resolve function
      const { resolvePrediction } = await import('../lib/state')
      currentState = resolvePrediction(currentState, pred.id, match.result, correct)
      resolvedNames.push(`#${pred.id} ${pred.match} → ${match.result}`)
    }

    if (resolvedNames.length === 0) {
      toast('No predictions matched completed matches yet.')
      setAutoResolving(false)
      return
    }

    // Save updated state
    const saved = await autoSave(currentState)

    // Generate roast/praise for each resolved
    for (const pred of appState.predictions.filter(p =>
      resolvedNames.some(r => r.includes(`#${p.id}`))
    )) {
      const match = findResult(pred.prediction + ' ' + pred.match)
      const correct = currentState.predictions.find(p => p.id === pred.id)?.status === 'correct'
      if (correct) {
        await praise(short, pred.prediction, currentState.stats, currentState.grudgeLog)
      } else {
        await roast(short, pred.prediction, match?.result || '', currentState.grudgeLog, currentState.stats)
      }
    }

    setResolved(resolvedNames)
    setAutoResolving(false)
    toast.success(`✅ Auto-resolved ${resolvedNames.length} prediction(s)!`)
  }

  return (
    <div className="tab-panel">
      <h2 className="sec-head">🔴 Live WC2026 Scores</h2>

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button
          className="btn-primary"
          onClick={fetchScores}
          disabled={loading}
        >
          {loading ? '⏳ Fetching...' : '🔄 Refresh Scores'}
        </button>
        <button
          className="btn-correct"
          onClick={autoResolve}
          disabled={autoResolving || saving || finished.length === 0}
        >
          {autoResolving ? '⏳ Auto-resolving...' : '⚡ Auto-Resolve My Predictions'}
        </button>
      </div>

      {lastFetch && (
        <p className="hint">Last updated: {lastFetch}</p>
      )}

      {error && (
        <div className="pred-row" style={{ borderLeft: '3px solid #ff5252' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Auto-resolved results */}
      {resolved.length > 0 && (
        <>
          <h3 className="sec-head" style={{ marginTop: 20 }}>
            ✅ Just Auto-Resolved
          </h3>
          {resolved.map((r, i) => (
            <div className="pred-row badge-correct" key={i}>
              ⚡ {r}
            </div>
          ))}
        </>
      )}

      {/* Live matches */}
      {live.length > 0 && (
        <>
          <h3 className="sec-head" style={{ marginTop: 20, color: '#ff5252' }}>
            🔴 Live Right Now
          </h3>
          {live.map(m => (
            <div className="pred-row" key={m.id} style={{ borderLeft: '3px solid #ff5252' }}>
              <span style={{ color: '#ff5252', fontWeight: 700 }}>LIVE</span>
              <span className="pred-text">
                <strong>{m.home}</strong> {m.homeGoals} - {m.awayGoals}{' '}
                <strong>{m.away}</strong>
              </span>
              <span className="pred-date">{m.group}</span>
            </div>
          ))}
        </>
      )}

      {/* Finished matches */}
      <h3 className="sec-head" style={{ marginTop: 20 }}>
        ✅ Completed Matches ({finished.length})
      </h3>

      {finished.length === 0 && !loading && (
        <p className="empty">No completed matches yet — click Refresh.</p>
      )}

      {finished.map(m => (
        <div className="pred-row" key={m.id}>
          <span className="badge badge-correct">FT</span>
          <span className="pred-text">
            <strong>{m.home}</strong> {m.homeGoals} - {m.awayGoals}{' '}
            <strong>{m.away}</strong>
          </span>
          <span className="pred-date">{m.date} · {m.group}</span>
        </div>
      ))}
    </div>
  )
}

// ── Tab: History ──────────────────────────────────────────────────────────────
function HistoryTab({ appState, blobChain }) {
  const timeline = [
    ...appState.predictions.map(p => ({
      date: p.date, icon: p.status === 'pending' ? '📝' : p.status === 'correct' ? '✅' : '❌',
      type: 'prediction', text: `${p.match}: ${p.prediction}${p.result ? ` → ${p.result}` : ''}`,
      cls: p.status,
    })),
    ...appState.grudgeLog.map(g => ({
      date: g.date, icon: '😤', type: 'grudge',
      text: `${g.match}: "${g.prediction}" → "${g.actual}"`, cls: 'wrong',
    })),
    ...appState.hotTakes.map(t => ({
      date: t.date, icon: '🔥', type: 'hottake', text: `"${t.take}"`, cls: 'take',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="tab-panel">
      <h2 className="sec-head">📖 Full Session History</h2>

      {/* Blob chain */}
      {blobChain?.length > 0 && (
        <details className="blob-chain-details">
          <summary>🔗 Blob Chain ({blobChain.length} snapshots on Walrus Mainnet)</summary>
          <div className="blob-chain-list">
            {[...blobChain].reverse().map((bid, i) => (
              <div className="blob-chain-item" key={bid}>
                <span className="blob-chain-num">#{blobChain.length - i}</span>
                <code className="blob-code">{bid}</code>
                <a href={getExplorerUrl(bid)} target="_blank" rel="noreferrer" className="blob-link">
                  view ↗
                </a>
                {i === 0 && <span className="latest-tag">← latest</span>}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Timeline */}
      {timeline.length === 0 ? (
        <p className="empty">No history yet. Start making predictions!</p>
      ) : (
        timeline.map((item, i) => (
          <div className={`pred-row timeline-item`} key={i}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span className={`badge badge-${item.cls}`}>{item.type}</span>
            <span className="pred-text">{item.text}</span>
            <span className="pred-date">{typeof item.date === 'string' ? item.date.slice(0, 10) : item.date}</span>
          </div>
        ))
      )}

      {/* Raw payload */}
      <details style={{ marginTop: 24 }}>
        <summary className="sec-head">🧬 Raw Walrus Payload</summary>
        <pre className="raw-json">{JSON.stringify(appState, null, 2)}</pre>
      </details>
    </div>
  )
}

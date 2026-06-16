// Main dashboard — shown after wallet connects
// Contains all 5 tabs: Predict, Resolve, Hot Takes, Grudge Report, History

// Add this import at the top of Dashboard.jsx
import { getExplorerUrl, saveLocalBlobId } from '../lib/walrus'

// Inside autoSave, after setLastBlobId(blobId):
saveLocalBlobId(account.address, blobId)

import { useState } from 'react'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { useWalrus }    from '../hooks/useWalrus'
import { useRoast }     from '../hooks/useRoast'
import {
  addPrediction,
  resolvePrediction,
  addHotTake,
  getPending,
  NOTABLE_MATCHES,
} from '../lib/state'
import { getExplorerUrl } from '../lib/walrus'
import toast from 'react-hot-toast'

const TABS = [
  '📝 Predict',
  '✅ Resolve',
  '💬 Hot Takes',
  '😤 Grudge Report',
  '📖 History',
]

export function Dashboard({
  appState,
  setAppState,
  blobChain,
  setBlobChain,
}) {
  const account                = useCurrentAccount()
  const { save, saving }       = useWalrus()
  const {
    response,
    loading: roastLoading,
    lastType,
    roast,
    praise,
    debate,
    grudgeReport,
  } = useRoast()

  const [tab,        setTab]        = useState(0)
  const [lastBlobId, setLastBlobId] = useState(
    appState.blobChain?.slice(-1)[0] || ''
  )

  const addr  = account?.address || appState.address || ''
  const short = addr
    ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
    : 'unknown'

  // ── Auto-save to Walrus after every action ──────────────────────────────
  async function autoSave(newState) {
    if (!account) {
      toast.error('Wallet not connected — changes not saved')
      return newState
    }
    const toastId = toast.loading(
      '💾 Saving to Walrus Mainnet...\n(wallet will prompt twice)'
    )
    try {
      const blobId  = await save(newState)
      const chain   = [...(blobChain || []), blobId].slice(-20)
      const updated = {
        ...newState,
        blobChain:   chain,
        lastUpdated: new Date().toISOString(),
      }
      setBlobChain(chain)
      setLastBlobId(blobId)
      setAppState(updated)
      toast.success(
        `✅ Saved to Walrus Mainnet!\nBlob: ${blobId.slice(0, 14)}...`,
        { id: toastId, duration: 6000 }
      )
      return updated
    } catch (err) {
      toast.error(`❌ Save failed: ${err.message}`, { id: toastId })
      return newState
    }
  }

  const s = appState.stats || {}

  return (
    <div className="dashboard">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="hero">
        <div className="hero-stripe" />
        <div className="hero-inner">
          <span className="hero-ball">⚽</span>
          <h1>WC2026 GRUDGE AGENT</h1>
          <p className="subtitle">
            Welcome back,{' '}
            <strong style={{ color: '#ffd700' }}>{short}</strong>
            {' '}— I remember everything you've ever gotten wrong 😤
          </p>
          <div className="hero-badges">
            <span className="badge-pill walrus">🌊 Walrus Mainnet</span>
            <span className="badge-pill usa">🇺🇸 Jun 11 – Jul 19, 2026</span>
            {lastBlobId && (
              <span className="badge-pill wc">🔗 Memory Active</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Ticker ───────────────────────────────────────────────────────── */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          ⚽ WC2026 kicks off June 11, 2026 &nbsp;·&nbsp;
          🏟️ MetLife Stadium Final &nbsp;·&nbsp;
          🔥 Every wrong prediction stored on chain &nbsp;·&nbsp;
          😤 Grudges held forever on Walrus Mainnet &nbsp;·&nbsp;
          ⚡ {short} — make your predictions count &nbsp;·&nbsp;
          🏆 48 teams · 104 matches · 3 host nations &nbsp;·&nbsp;
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="stats-row">
        {[
          ['✅', s.correct || 0,                    'Correct',   'green'],
          ['❌', s.wrong   || 0,                    'Wrong',     'red'],
          ['⏳', s.pending || 0,                    'Pending',   'yellow'],
          ['📊', s.winRate || '0%',                 'Win Rate',  'blue'],
          ['😤', appState.grudgeLog?.length  || 0,  'Grudges',   'purple'],
          ['🔥', appState.hotTakes?.length   || 0,  'Hot Takes', 'orange'],
        ].map(([icon, val, label, cls]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-val ${cls}`}>{icon} {val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Agent response bubble ─────────────────────────────────────────── */}
      {response && (
        <div className={`agent-bubble ${
          lastType === 'roast' || lastType === 'grudge_report'
            ? 'roast'
            : lastType === 'praise'
            ? 'praise'
            : 'debate'
        }`}>
          <div className="bubble-tag">🤖 Agent</div>
          {roastLoading ? '...' : response}
        </div>
      )}

      {/* ── Blob save status ─────────────────────────────────────────────── */}
      {lastBlobId && (
        <div className="blob-status">
          <span className="dot green pulse" />
          <span>Saved to Walrus Mainnet</span>
          <span>·</span>
          <a
            href={getExplorerUrl(lastBlobId)}
            target="_blank"
            rel="noreferrer"
          >
            View on WalrusScan ↗
          </a>
          <span className="blob-id-short">
            · {lastBlobId.slice(0, 16)}...
          </span>
        </div>
      )}

      {/* ── Wallet + connect button ───────────────────────────────────────── */}
      <div className="topbar">
        <div className="wallet-info">
          <span className="dot green" />
          <span>{short}</span>
        </div>
        <ConnectButton />
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`tab-btn ${tab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <div className="tab-content">
        {tab === 0 && (
          <PredictTab
            appState={appState}
            autoSave={autoSave}
            saving={saving}
          />
        )}
        {tab === 1 && (
          <ResolveTab
            appState={appState}
            autoSave={autoSave}
            roast={roast}
            praise={praise}
            saving={saving}
          />
        )}
        {tab === 2 && (
          <HotTakesTab
            appState={appState}
            autoSave={autoSave}
            debate={debate}
            saving={saving}
          />
        )}
        {tab === 3 && (
          <GrudgeTab
            appState={appState}
            grudgeReport={grudgeReport}
            loading={roastLoading}
            short={short}
          />
        )}
        {tab === 4 && (
          <HistoryTab
            appState={appState}
            blobChain={blobChain}
          />
        )}
      </div>

    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Predict
// ══════════════════════════════════════════════════════════════════════════════
function PredictTab({ appState, autoSave, saving }) {
  const [match,      setMatch]  = useState('')
  const [custom,     setCustom] = useState('')
  const [prediction, setPred]   = useState('')
  const [submitting, setSub]    = useState(false)

  async function submit() {
    const m = match === 'Custom...' ? custom.trim() : match
    if (!m)               return toast.error('Select or enter a match')
    if (!prediction.trim()) return toast.error('Enter your prediction')

    setSub(true)
    try {
      const newState = addPrediction(appState, m, prediction.trim())
      await autoSave(newState)
      setMatch(''); setCustom(''); setPred('')
      toast.success('Prediction logged! ⏳')
    } catch {
      // autoSave already shows toast
    } finally {
      setSub(false)
    }
  }

  return (
    <div className="tab-panel">
      <h2 className="sec-head">📝 New Prediction</h2>

      <div className="form-row">
        <div className="form-col">
          <label>Match / Event</label>
          <select value={match} onChange={e => setMatch(e.target.value)}>
            <option value="">Select a match...</option>
            <option value="Custom...">✏️ Custom...</option>
            {NOTABLE_MATCHES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {match === 'Custom...' && (
            <input
              placeholder="e.g. Brazil vs Argentina"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              style={{ marginTop: 8 }}
            />
          )}
        </div>
        <div className="form-col">
          <label>Your Prediction</label>
          <textarea
            placeholder="e.g. Brazil wins 2-1, Vinicius Jr scores first"
            value={prediction}
            onChange={e => setPred(e.target.value)}
            rows={4}
          />
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={submit}
        disabled={submitting || saving}
      >
        {submitting || saving
          ? '⏳ Saving to Walrus...'
          : '📌 Submit Prediction'}
      </button>

      <p className="hint">
        ⚠️ Submitting saves to Walrus Mainnet — your wallet will prompt twice
      </p>

      {/* Prediction history */}
      <h3 className="sec-head" style={{ marginTop: 28 }}>
        All Predictions ({appState.predictions.length})
      </h3>

      {appState.predictions.length === 0 ? (
        <p className="empty">No predictions yet. Make one above!</p>
      ) : (
        [...appState.predictions].reverse().map(p => (
          <div className="pred-row" key={p.id}>
            <span className={`badge badge-${p.status}`}>
              {p.status === 'pending'  ? '⏳' :
               p.status === 'correct' ? '✅' : '❌'}{' '}
              {p.status}
            </span>
            <span className="pred-text">
              <strong>{p.match}</strong>: {p.prediction}
            </span>
            {p.result && (
              <span className="pred-result">→ {p.result}</span>
            )}
            <span className="pred-date">
              {new Date(p.date).toLocaleDateString()}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Resolve
// ══════════════════════════════════════════════════════════════════════════════
function ResolveTab({ appState, autoSave, roast, praise, saving }) {
  const pending             = getPending(appState)
  const [chosen, setChosen] = useState('')
  const [actual, setActual] = useState('')
  const [busy,   setBusy]   = useState(false)

  async function resolve(correct) {
    if (!chosen)        return toast.error('Select a prediction first')
    if (!actual.trim()) return toast.error('Enter what actually happened')

    const id   = parseInt(chosen)
    const pred = appState.predictions.find(p => p.id === id)

    setBusy(true)
    try {
      const newState = resolvePrediction(appState, id, actual.trim(), correct)
      const saved    = await autoSave(newState)

      // Get AI response after save
      const name = saved.address || appState.address || 'unknown'
      if (correct) {
        await praise(name, pred?.prediction || '', newState.stats, newState.grudgeLog)
      } else {
        await roast(name, pred?.prediction || '', actual.trim(), newState.grudgeLog, newState.stats)
      }

      setChosen('')
      setActual('')
    } catch {
      // autoSave already shows toast
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="tab-panel">
      <h2 className="sec-head">✅ Resolve a Prediction</h2>

      {pending.length === 0 ? (
        <p className="empty">
          No pending predictions. Head to 📝 Predict to make some!
        </p>
      ) : (
        <>
          <div className="form-row">
            <div className="form-col">
              <label>Select Prediction</label>
              <select value={chosen} onChange={e => setChosen(e.target.value)}>
                <option value="">Choose a prediction...</option>
                {pending.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.id} · {p.match} — {p.prediction}
                  </option>
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
            <button
              className="btn-correct"
              onClick={() => resolve(true)}
              disabled={busy || saving}
            >
              {busy ? '⏳ Saving...' : '✅ Mark Correct'}
            </button>
            <button
              className="btn-wrong"
              onClick={() => resolve(false)}
              disabled={busy || saving}
            >
              {busy ? '⏳ Saving...' : '❌ Mark Wrong 🔥'}
            </button>
          </div>

          <p className="hint">
            ⚠️ Resolving auto-saves to Walrus — wallet will prompt twice
          </p>
        </>
      )}

      {/* Resolved history */}
      {appState.predictions.filter(p => p.status !== 'pending').length > 0 && (
        <>
          <h3 className="sec-head" style={{ marginTop: 28 }}>
            Resolved Predictions
          </h3>
          {appState.predictions
            .filter(p => p.status !== 'pending')
            .reverse()
            .map(p => (
              <div className="pred-row" key={p.id}>
                <span className={`badge badge-${p.status}`}>
                  {p.status === 'correct' ? '✅' : '❌'} {p.status}
                </span>
                <span className="pred-text">
                  <strong>{p.match}</strong>: {p.prediction}
                </span>
                <span className="pred-result">→ {p.result}</span>
                <span className="pred-date">
                  {new Date(p.date).toLocaleDateString()}
                </span>
              </div>
            ))}
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Hot Takes
// ══════════════════════════════════════════════════════════════════════════════
function HotTakesTab({ appState, autoSave, debate, saving }) {
  const [take,       setTake] = useState('')
  const [submitting, setSub]  = useState(false)

  async function submit() {
    if (!take.trim()) return toast.error('Type your hot take first!')

    setSub(true)
    try {
      const past     = [...appState.hotTakes]
      const newState = addHotTake(appState, take.trim())
      const saved    = await autoSave(newState)
      await debate(
        saved.address || appState.address || 'unknown',
        take.trim(),
        past
      )
      setTake('')
    } catch {
      // autoSave already shows toast
    } finally {
      setSub(false)
    }
  }

  return (
    <div className="tab-panel">
      <h2 className="sec-head">💬 Drop a Hot Take</h2>

      <textarea
        placeholder="e.g. Mbappe is overrated and France won't make it past the quarters..."
        value={take}
        onChange={e => setTake(e.target.value)}
        rows={4}
      />

      <button
        className="btn-primary"
        onClick={submit}
        disabled={submitting || saving}
        style={{ marginTop: 12 }}
      >
        {submitting || saving
          ? '⏳ Saving to Walrus...'
          : '🔥 Submit Hot Take'}
      </button>

      <p className="hint">
        ⚠️ Submitting saves to Walrus Mainnet — wallet will prompt twice
      </p>

      {appState.hotTakes.length > 0 && (
        <>
          <h3 className="sec-head" style={{ marginTop: 28 }}>
            Your Hot Take History ({appState.hotTakes.length})
          </h3>
          {[...appState.hotTakes].reverse().map((t, i) => (
            <div className="pred-row" key={i}>
              <span>💬</span>
              <span className="pred-text">
                <em>"{t.take}"</em>
              </span>
              <span className="pred-date">{t.date}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Grudge Report
// ══════════════════════════════════════════════════════════════════════════════
function GrudgeTab({ appState, grudgeReport, loading, short }) {
  async function generate() {
    await grudgeReport(
      short,
      appState.grudgeLog,
      appState.stats
    )
  }

  return (
    <div className="tab-panel">
      <h2 className="sec-head">😤 The Grudge Report</h2>

      <button
        className="btn-danger"
        onClick={generate}
        disabled={loading}
      >
        {loading
          ? '⏳ Compiling all your failures...'
          : '💀 Generate Full Grudge Report'}
      </button>

      {appState.grudgeLog?.length > 0 ? (
        <>
          <h3 className="sec-head" style={{ marginTop: 28 }}>
            All Grudges on File ({appState.grudgeLog.length})
          </h3>
          {[...appState.grudgeLog].reverse().map((g, i) => (
            <div className="pred-row grudge" key={i}>
              <span>😤</span>
              <span className="pred-text">
                <strong>{g.match}</strong>: predicted{' '}
                "<em>{g.prediction}</em>" but{' '}
                "<em>{g.actual}</em>" happened
              </span>
              <span className="pred-date">{g.date}</span>
            </div>
          ))}
        </>
      ) : (
        <p className="empty">
          No grudges yet. Make some wrong predictions first! 😈
        </p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 5 — History
// ══════════════════════════════════════════════════════════════════════════════
function HistoryTab({ appState, blobChain }) {
  // Build unified timeline from all events
  const timeline = [
    ...appState.predictions.map(p => ({
      date: p.date,
      icon: p.status === 'pending'  ? '📝' :
            p.status === 'correct'  ? '✅' : '❌',
      type: 'prediction',
      cls:  p.status,
      text: `${p.match}: ${p.prediction}${
        p.result ? ` → ${p.result}` : ''
      }`,
    })),
    ...appState.grudgeLog.map(g => ({
      date: g.date,
      icon: '😤',
      type: 'grudge',
      cls:  'wrong',
      text: `${g.match}: "${g.prediction}" → "${g.actual}"`,
    })),
    ...appState.hotTakes.map(t => ({
      date: t.date,
      icon: '🔥',
      type: 'hottake',
      cls:  'take',
      text: `"${t.take}"`,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="tab-panel">
      <h2 className="sec-head">📖 Full Session History</h2>

      {/* Blob chain */}
      {blobChain.length > 0 && (
        <details className="blob-chain-details">
          <summary>
            🔗 Blob Chain — {blobChain.length} snapshot
            {blobChain.length !== 1 ? 's' : ''} on Walrus Mainnet
          </summary>
          <div className="blob-chain-list">
            {[...blobChain].reverse().map((bid, i) => (
              <div className="blob-chain-item" key={bid}>
                <span className="blob-chain-num">
                  #{blobChain.length - i}
                </span>
                <code className="blob-code">{bid}</code>
                <a
                  href={getExplorerUrl(bid)}
                  target="_blank"
                  rel="noreferrer"
                  className="blob-link"
                >
                  view ↗
                </a>
                {i === 0 && (
                  <span className="latest-tag">← latest</span>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Timeline */}
      {timeline.length === 0 ? (
        <p className="empty">
          No history yet. Start making predictions!
        </p>
      ) : (
        timeline.map((item, i) => (
          <div className="pred-row timeline-item" key={i}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span className={`badge badge-${item.cls}`}>
              {item.type}
            </span>
            <span className="pred-text">{item.text}</span>
            <span className="pred-date">
              {typeof item.date === 'string'
                ? item.date.slice(0, 10)
                : item.date}
            </span>
          </div>
        ))
      )}

      {/* Raw Walrus payload */}
      <details style={{ marginTop: 24 }}>
        <summary className="sec-head" style={{ cursor: 'pointer' }}>
          🧬 Raw Walrus Payload
        </summary>
        <pre className="raw-json">
          {JSON.stringify(appState, null, 2)}
        </pre>
      </details>
    </div>
  )
}
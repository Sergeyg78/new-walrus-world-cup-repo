// State management for predictions, grudges, hot takes
// Pure functions — no side effects, easy to test

// ── Create empty state for a new user ────────────────────────────────────────
export function emptyState(address) {
  return {
    address,
    schema:      '3.0',
    predictions: [],
    grudgeLog:   [],
    hotTakes:    [],
    stats: {
      correct: 0,
      wrong:   0,
      pending: 0,
      winRate: '0%',
    },
    blobChain:   [],
    lastUpdated: new Date().toISOString(),
  }
}

// ── Add a new pending prediction ──────────────────────────────────────────────
export function addPrediction(state, match, prediction) {
  return {
    ...state,
    predictions: [
      ...state.predictions,
      {
        id:         state.predictions.length + 1,
        match,
        prediction,
        result:     null,
        status:     'pending',
        date:       new Date().toISOString(),
      },
    ],
    stats: {
      ...state.stats,
      pending: state.stats.pending + 1,
    },
    lastUpdated: new Date().toISOString(),
  }
}

// ── Resolve a prediction as correct or wrong ──────────────────────────────────
export function resolvePrediction(state, predId, actual, correct) {
  const predictions = state.predictions.map(p => {
    if (p.id !== predId || p.status !== 'pending') return p
    return {
      ...p,
      result:       actual,
      status:       correct ? 'correct' : 'wrong',
      resolvedDate: new Date().toISOString(),
    }
  })

  const newStats = {
    ...state.stats,
    pending: Math.max(0, state.stats.pending - 1),
  }
  if (correct) newStats.correct += 1
  else         newStats.wrong   += 1

  const total = newStats.correct + newStats.wrong
  newStats.winRate = total > 0
    ? `${Math.round((newStats.correct / total) * 100)}%`
    : '0%'

  // Add to grudge log if wrong
  const resolved = state.predictions.find(p => p.id === predId)
  const grudgeLog = correct
    ? state.grudgeLog
    : [
        ...state.grudgeLog,
        {
          predictionId: predId,
          match:        resolved?.match      || '',
          prediction:   resolved?.prediction || '',
          actual,
          date: new Date().toLocaleDateString(),
        },
      ]

  return {
    ...state,
    predictions,
    stats:       newStats,
    grudgeLog,
    lastUpdated: new Date().toISOString(),
  }
}

// ── Add a hot take ────────────────────────────────────────────────────────────
export function addHotTake(state, take) {
  return {
    ...state,
    hotTakes: [
      ...state.hotTakes,
      { take, date: new Date().toLocaleDateString() },
    ],
    lastUpdated: new Date().toISOString(),
  }
}

// ── Get only pending predictions ──────────────────────────────────────────────
export function getPending(state) {
  return state.predictions.filter(p => p.status === 'pending')
}

// ── Recalculate stats from scratch (useful after loading from blob) ───────────
export function recalcStats(state) {
  const correct = state.predictions.filter(p => p.status === 'correct').length
  const wrong   = state.predictions.filter(p => p.status === 'wrong').length
  const pending = state.predictions.filter(p => p.status === 'pending').length
  const total   = correct + wrong
  return {
    ...state,
    stats: {
      correct,
      wrong,
      pending,
      winRate: total > 0 ? `${Math.round((correct / total) * 100)}%` : '0%',
    },
  }
}

// ── WC2026 match data ─────────────────────────────────────────────────────────
export const NOTABLE_MATCHES = [
  'USA vs Ecuador (Group A)',
  'Argentina vs Chile (Group B)',
  'Brazil vs Colombia (Group C)',
  'England vs Netherlands (Group D)',
  'France vs Belgium (Group E)',
  'Spain vs Portugal (Group F)',
  'Germany vs Japan (Group G)',
  'Italy vs Australia (Group H)',
  'Senegal vs Cameroon (Group I)',
  'South Korea vs Iran (Group J)',
  'World Cup Final',
  'Semi Final 1',
  'Semi Final 2',
  'Quarter Final 1',
  'Quarter Final 2',
  'Round of 16',
]

export const WC2026_INFO = {
  name:    'FIFA World Cup 2026',
  hosts:   'USA 🇺🇸 · Canada 🇨🇦 · Mexico 🇲🇽',
  dates:   'Jun 11 – Jul 19, 2026',
  teams:   48,
  matches: 104,
  final:   'MetLife Stadium, New York/New Jersey',
  }
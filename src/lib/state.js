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

// ── Real WC2026 Groups (correct as of June 18, 2026) ─────────────────────────
export const WC2026_GROUPS = {
  'Group A': ['Mexico 🇲🇽', 'South Africa 🇿🇦', 'South Korea 🇰🇷', 'Czechia 🇨🇿'],
  'Group B': ['Canada 🇨🇦', 'Bosnia-Herzegovina 🇧🇦', 'Qatar 🇶🇦', 'Switzerland 🇨🇭'],
  'Group C': ['Brazil 🇧🇷', 'Haiti 🇭🇹', 'Scotland 🇴󠁧󠁢󠁳󠁣󠁴󠁿', 'Morocco 🇲🇦'],
  'Group D': ['USA 🇺🇸', 'Paraguay 🇵🇾', 'Australia 🇦🇺', 'Türkiye 🇹🇷'],
  'Group E': ['Spain 🇪🇸', 'unknown', 'unknown', 'unknown'],
  'Group F': ['Argentina 🇦🇷', 'unknown', 'unknown', 'unknown'],
  'Group G': ['Germany 🇩🇪', 'unknown', 'unknown', 'unknown'],
  'Group H': ['England 🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'unknown', 'unknown', 'unknown'],
  'Group I': ['France 🇫🇷', 'Senegal 🇸🇳', 'Iraq 🇮🇶', 'Norway 🇳🇴'],
  'Group J': ['unknown', 'unknown', 'unknown', 'unknown'],
  'Group K': ['Portugal 🇵🇹', 'DR Congo 🇨🇩', 'Uzbekistan 🇺🇿', 'Colombia 🇨🇴'],
  'Group L': ['unknown', 'unknown', 'unknown', 'unknown'],
}

// ── Real results so far (June 11-18, 2026) ───────────────────────────────────
export const COMPLETED_MATCHES = [
  { match: 'Mexico vs South Africa (Group A)',    result: 'Mexico 2-0 South Africa',    date: 'Jun 11' },
  { match: 'South Korea vs Czechia (Group A)',    result: 'South Korea 2-1 Czechia',    date: 'Jun 11' },
  { match: 'Canada vs Bosnia-Herzegovina (Group B)', result: 'Canada 1-1 Bosnia-Herzegovina', date: 'Jun 12' },
  { match: 'USA vs Paraguay (Group D)',           result: 'USA 4-1 Paraguay',           date: 'Jun 12' },
  { match: 'Australia vs Türkiye (Group D)',      result: 'Australia 2-0 Türkiye',      date: 'Jun 13' },
  { match: 'Scotland vs Haiti (Group C)',         result: 'Scotland W 4-1 Haiti',       date: 'Jun 13' },
  { match: 'Germany vs Japan (Group D)',          result: 'Germany 2-2 Japan',          date: 'Jun 14' },
  { match: 'France vs Iraq (Group I)',            result: 'France 4-1 Iraq',            date: 'Jun 17' },
  { match: 'Portugal vs DR Congo (Group K)',      result: 'Portugal 1-1 DR Congo',      date: 'Jun 17' },
]

// ── Upcoming fixtures (June 19+) ──────────────────────────────────────────────
export const NOTABLE_MATCHES = [
  // Today June 19
  'USA vs Australia (Group D) — Jun 19',
  'Scotland vs Morocco (Group C) — Jun 19',
  'Brazil vs Haiti (Group C) — Jun 19',
  'Türkiye vs Paraguay (Group D) — Jun 19',
  // Upcoming group stage
  'Mexico vs South Korea (Group A) — Jun 21',
  'Canada vs Qatar (Group B) — Jun 21',
  'France vs Senegal (Group I) — Jun 23',
  'Portugal vs Uzbekistan (Group K) — Jun 23',
  'Spain vs Group E match',
  'Argentina vs Group F match',
  'Germany vs Group G match',
  'England vs Group H match',
  // Knockout stage (upcoming)
  'Round of 32',
  'Round of 16',
  'Quarter Final',
  'Semi Final 1',
  'Semi Final 2',
  'World Cup Final — Jul 19',
  // Custom
  'Custom match...',
]

export const WC2026_INFO = {
  name:    'FIFA World Cup 2026',
  hosts:   'USA 🇺🇸 · Canada 🇨🇦 · Mexico 🇲🇽',
  dates:   'Jun 11 – Jul 19, 2026',
  teams:   48,
  matches: 104,
  final:   'MetLife Stadium, New York/New Jersey — Jul 19',
  status:  '🔴 LIVE — Group Stage Week 2',
}
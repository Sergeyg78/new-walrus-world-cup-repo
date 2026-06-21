// api/scores.js — fetches live WC2026 results from football-data.org

// ── Team name aliases ─────────────────────────────────────────────────────────
// Maps API names → common names users might type in predictions
const ALIASES = {
  // Special characters
  'curaçao':              'curacao',
  'türkiye':              'turkey',
  // Full names → short
  'united states':        'usa',
  'republic of korea':    'south korea',
  'korea republic':       'south korea',
  'ir iran':              'iran',
  'czechia':              'czech republic',
  'côte d\'ivoire':       'ivory coast',
  "cote d'ivoire":        'ivory coast',
  'bosnia-herzegovina':   'bosnia',
  'bosnia and herzegovina': 'bosnia',
  'dr congo':             'congo',
  'democratic republic of congo': 'congo',
}

function normalize(name) {
  if (!name) return ''
  const lower = name.toLowerCase().trim()
  return ALIASES[lower] || lower
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const API_KEY = process.env.FOOTBALL_DATA_API_KEY
  if (!API_KEY) {
    return res.status(500).json({ error: 'FOOTBALL_DATA_API_KEY not set' })
  }

  try {
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      { headers: { 'X-Auth-Token': API_KEY } }
    )

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Football API error: ${response.status}`
      })
    }

    const data = await response.json()

    const finished = (data.matches || [])
      .filter(m => m.status === 'FINISHED')
      .map(m => ({
        id:           m.id,
        date:         m.utcDate?.slice(0, 10),
        home:         m.homeTeam?.name,
        away:         m.awayTeam?.name,
        // normalized versions for matching
        homeNorm:     normalize(m.homeTeam?.name),
        awayNorm:     normalize(m.awayTeam?.name),
        homeGoals:    m.score?.fullTime?.home,
        awayGoals:    m.score?.fullTime?.away,
        result:       `${m.homeTeam?.name} ${m.score?.fullTime?.home}-${m.score?.fullTime?.away} ${m.awayTeam?.name}`,
        stage:        m.stage,
        group:        m.group,
      }))

    const live = (data.matches || [])
      .filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
      .map(m => ({
        id:        m.id,
        date:      m.utcDate?.slice(0, 10),
        home:      m.homeTeam?.name,
        away:      m.awayTeam?.name,
        homeNorm:  normalize(m.homeTeam?.name),
        awayNorm:  normalize(m.awayTeam?.name),
        homeGoals: m.score?.fullTime?.home ?? m.score?.halfTime?.home,
        awayGoals: m.score?.fullTime?.away ?? m.score?.halfTime?.away,
        result:    `${m.homeTeam?.name} ${m.score?.fullTime?.home ?? '?'}-${m.score?.fullTime?.away ?? '?'} ${m.awayTeam?.name} (LIVE)`,
        stage:     m.stage,
        group:     m.group,
        live:      true,
      }))

    return res.status(200).json({ finished, live, total: finished.length })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

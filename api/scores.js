// api/scores.js — fetches live WC2026 results from football-data.org
// Free tier: 10 calls/minute, includes World Cup (competition code: WC)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const API_KEY = process.env.FOOTBALL_DATA_API_KEY
  if (!API_KEY) {
    return res.status(500).json({ error: 'FOOTBALL_DATA_API_KEY not set' })
  }

  try {
    // Fetch all WC2026 matches
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      {
        headers: {
          'X-Auth-Token': API_KEY,
        },
      }
    )

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Football API error: ${response.status}`
      })
    }

    const data = await response.json()

    // Filter to only finished matches with scores
    const finished = (data.matches || [])
      .filter(m => m.status === 'FINISHED')
      .map(m => ({
        id:        m.id,
        date:      m.utcDate?.slice(0, 10),
        home:      m.homeTeam?.name,
        away:      m.awayTeam?.name,
        homeGoals: m.score?.fullTime?.home,
        awayGoals: m.score?.fullTime?.away,
        result:    `${m.homeTeam?.name} ${m.score?.fullTime?.home}-${m.score?.fullTime?.away} ${m.awayTeam?.name}`,
        stage:     m.stage,
        group:     m.group,
      }))

    // Also get live matches
    const live = (data.matches || [])
      .filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
      .map(m => ({
        id:        m.id,
        date:      m.utcDate?.slice(0, 10),
        home:      m.homeTeam?.name,
        away:      m.awayTeam?.name,
        homeGoals: m.score?.fullTime?.home ?? m.score?.halfTime?.home,
        awayGoals: m.score?.fullTime?.away ?? m.score?.halfTime?.away,
        result:    `${m.homeTeam?.name} ${m.score?.fullTime?.home ?? '?'}-${m.score?.fullTime?.away ?? '?'} ${m.awayTeam?.name} (LIVE)`,
        stage:     m.stage,
        group:     m.group,
        live:      true,
      }))

    return res.status(200).json({
      finished,
      live,
      total: finished.length,
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
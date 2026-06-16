// Vercel serverless function — handles all Claude AI calls
// Runs server-side so ANTHROPIC_API_KEY stays secret
// Endpoint: POST /api/roast

export default async function handler(req, res) {

  // ── CORS headers (allows browser to call this endpoint) ──────────────────
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Validate API key ──────────────────────────────────────────────────────
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_KEY) {
  console.error('[roast.js] ANTHROPIC_API_KEY is not set')
  return res.status(500).json({
    error: 'ANTHROPIC_API_KEY not configured on server',
    hint:  'Add it in Vercel project settings under Environment Variables'
  })
}

  // ── Parse body ────────────────────────────────────────────────────────────
  const {
    type,
    username,
    prediction,
    actual,
    grudgeLog,
    stats,
    hotTake,
    pastTakes,
  } = req.body || {}

  if (!type) {
    return res.status(400).json({ error: 'Missing required field: type' })
  }

  // ── Build prompts based on type ───────────────────────────────────────────
  let systemPrompt = ''
  let userPrompt   = ''

  if (type === 'roast') {
    const pastFailures = (grudgeLog || [])
      .slice(-3)
      .map(g => `- ${g.date}: predicted "${g.prediction}"`)
      .join('\n')

    systemPrompt = `You are a savage but hilarious FIFA World Cup 2026 prediction analyst.
Your job is to roast users when they get predictions wrong.
You hold grudges — you remember past wrong calls and bring them up.
Keep roasts under 3 sentences. Be funny, football-specific, and slightly brutal.
Never be offensive about real people, only about the predictions.`

    userPrompt = `User wallet: ${username}
Their prediction: "${prediction}"
What actually happened: "${actual}"
Their record: ${stats?.correct || 0} correct, ${stats?.wrong || 0} wrong, win rate: ${stats?.winRate || '0%'}

Past failures on record:
${pastFailures || 'This is their first wrong call.'}

Roast them for this wrong prediction. If they have past failures, reference at least one grudgingly.`

  } else if (type === 'praise') {
    const pastFailures = (grudgeLog || [])
      .slice(-2)
      .map(g => `- "${g.prediction}"`)
      .join('\n')

    systemPrompt = `You are a reluctant, grudge-holding FIFA World Cup 2026 analyst.
When someone gets a prediction right, give VERY grudging praise.
Always bring up their past failures to keep them humble.
Keep it under 3 sentences. Be funny and football-specific.`

    userPrompt = `User wallet: ${username}
Correct prediction: "${prediction}"
Their record: ${stats?.correct || 0} correct, ${stats?.wrong || 0} wrong

Past wrong predictions I still hold grudges about:
${pastFailures || 'No past failures yet — but I am watching closely.'}

Give very grudging praise for getting this one right.`

  } else if (type === 'debate') {
    const history = (pastTakes || [])
      .slice(-4)
      .map(t => `- "${t.take}" (${t.date})`)
      .join('\n')

    systemPrompt = `You are a fiery FIFA World Cup 2026 debate partner who never forgets.
Counter hot takes with stats, logic, and by calling out contradictions with past takes.
Keep responses under 4 sentences. Be passionate but fair.`

    userPrompt = `User ${username} says: "${hotTake}"

Their past hot takes I remember:
${history || 'This is their first hot take.'}

Counter this take OR call out if it contradicts their past opinions.
Be direct and football-savvy.`

  } else if (type === 'grudge_report') {
    if (!grudgeLog || grudgeLog.length === 0) {
      return res.status(200).json({
        response: `No grudges on file for ${username} yet... but I am watching. 👀`
      })
    }

    const failures = grudgeLog
      .map(g => `- ${g.date}: predicted "${g.prediction}" but "${g.actual}" happened`)
      .join('\n')

    systemPrompt = `You are a World Cup prediction grudge keeper.
Summarise someone's prediction failures in a brutal but funny roast report.
Keep it under 5 sentences. Reference specific wrong calls by name.`

    userPrompt = `Generate a grudge report for wallet ${username}.
Record: ${stats?.correct || 0} correct / ${stats?.wrong || 0} wrong (${stats?.winRate || '0%'} win rate)

All their wrong predictions:
${failures}`

  } else {
    return res.status(400).json({ error: `Unknown type: ${type}` })
  }

  // ── Call Claude API ───────────────────────────────────────────────────────
  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5',
        max_tokens: 250,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!claudeRes.ok) {
      const errText = await claudeRes.text()
      console.error('[roast.js] Claude API error:', errText)
      return res.status(502).json({
        error:  'Claude API request failed',
        detail: errText.slice(0, 200),
      })
    }

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.[0]?.text

    if (!text) {
      return res.status(502).json({ error: 'Empty response from Claude' })
    }

    return res.status(200).json({ response: text })

  } catch (err) {
    console.error('[roast.js] Exception:', err)
    return res.status(500).json({ error: err.message })
  }
}
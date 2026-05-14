import { Anthropic } from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { message, history } = req.body

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: `You are a CMS SNF compliance expert. Help SNF staff with compliance questions. Reference F-tags.`,
      messages: [...(history || []), { role: 'user', content: message }]
    })

    return res.status(200).json({ response: response.content[0].text })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to communicate with AI' })
  }
}


export async function generateSanctuaryVoice(title, notes) {
    const voiceId = "EXAVITQu4vr4PUpxXtjJ"; // Bella - Professional, Soothing
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: `Welcome to your sanctuary. For your curation of ${title}, we have prepared a sensory ritual. ${notes}. Let the weight of these pages ground you in the present.`,
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.6, similarity_boost: 0.75 }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail?.message || "Audio generation failed");
    }

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
}

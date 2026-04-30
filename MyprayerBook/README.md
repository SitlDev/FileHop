# My Prayer Book

A devotional app for generating Scripture-based prayers, journaling, and building a consistent prayer practice.

## Getting Started

### Prerequisites
- Node.js 16+
- Anthropic API Key

### Setup

1. **Clone the repository:**
   ```bash
   cd /Users/amn/Documents/GitHub/Claude/MyprayerBook
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Anthropic API Key:**
   - Get your API key at https://console.anthropic.com/
   - Add it to `.env.local`:
     ```
     ANTHROPIC_API_KEY=your_api_key_here
     ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to `http://localhost:5173`

## Features

🙏 **Forge** - Generate AI-powered prayers using Anthropic Claude
- Choose prayer types (Confession, Forgiveness, Deliverance, Healing, Gratitude, Intercession, Praise)
- Select depth level (Brief, Standard, Deep)
- Get Scripture-grounded prayers with Bible verses
- Generate variations with fresh language and themes

📖 **Journal** - Save and revisit your prayers
- View your prayer history
- Read aloud with text-to-speech
- Share prayers with others

📚 **Verses** - Master Bible verses through flashcards
- Study verses from your saved prayers
- Track mastered verses
- Progress through your personal scripture library

🕯️ **Streak** - Build prayer consistency
- Track consecutive days of prayer
- View weekly flame visualization
- Monitor your spiritual metrics

🎵 **Music** - 17 classical pieces for prayer ambiance
- Peaceful meditations (Satie, Debussy)
- Devotional works (Bach, Schubert)
- Public domain recordings from Musopen & Internet Archive

## Technology Stack

- **Frontend:** React 18 + Vite
- **UI:** Custom SVG icons, responsive design
- **API:** Anthropic Claude (3.5 Sonnet)
- **Storage:** localStorage for persistence
- **Audio:** Web Audio API + public domain classical music

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## License

Private project. Built with devotion for the faithful.

<div align="center">
  <img src="frontend/src/img/hearsey-logo.png" alt="Hearsay Logo" width="200"/>
  
  # Hearsay
  
  **Audio-First Language Learning for Everyone**
  
  *Built for HackHarvard 2025*
</div>

---

## What is Hearsay?

Hearsay transforms language learning into an accessible, audio-first experience. Learn vocabulary through sound, not screens—perfect for anyone who wants hands-free learning or has limited mobility.

**The Problem:** Traditional flashcard apps require constant visual attention and precise mouse/keyboard control, making them inaccessible for many learners.

**Our Solution:** Audio-driven flashcards with alternative input methods (physical buttons, gesture sensors) that work alongside traditional interfaces. Learn while cooking, exercising, or just resting your eyes.

## Key Features

- **🔊 Audio-First Design** - Complete learning experience through text-to-speech
- **♿ Accessible Controls** - Physical buttons or contactless gesture sensors
- **🧠 Smart Scheduling** - FSRS algorithm optimizes review timing
- **🤖 AI-Generated Content** - Contextual sentences using your known vocabulary
- **📊 Progress Tracking** - Real-time statistics and retention metrics
- **🎨 Beautiful Interface** - Modern React UI with seamless hardware integration

## Quick Start

### Prerequisites
- Python 3.8+ and Node.js 16+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- ElevenLabs API key ([Sign up here](https://elevenlabs.io/))

### Setup (5 minutes)

1. **Configure API Keys**
   ```bash
   # Create .env file in project root
   GEMINI=your_gemini_key
   ELEVENLABS=your_elevenlabs_key
   ```

2. **Start Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open** `http://localhost:3000` and start learning!

For hardware setup, see [Hardware Quick Start](hardware/QUICKSTART.md).

For detailed instructions, see [QUICKSTART.md](QUICKSTART.md).

## Architecture

Hearsay consists of three independent components that work together:

| Component | Purpose | Tech Stack |
|-----------|---------|------------|
| **[Backend](backend/)** | API server, AI integration, FSRS scheduling | FastAPI, Python, Google Gemini, ElevenLabs |
| **[Frontend](frontend/)** | Web interface with Study, Manage, Stats pages | React, Vite, Tailwind CSS |
| **[Hardware](hardware/)** | Alternative input controllers (optional) | Arduino, Python, pyserial |

### How It Works

```
┌─────────────┐
│   Frontend  │  ← User manages words and studies
│  (React UI) │
└──────┬──────┘
       │
       ↓ HTTP API
┌─────────────┐
│   Backend   │  ← Generates sentences (Gemini), creates audio (ElevenLabs)
│  (FastAPI)  │     Schedules reviews (FSRS), stores data (JSON)
└──────┬──────┘
       │
       ↑ HTTP
┌─────────────┐
│  Hardware   │  ← Buttons or sensors send ratings (optional)
│  (Arduino)  │
└─────────────┘
```

## Documentation

Each component has comprehensive documentation:

### Backend
- [Backend README](backend/README.md) - Complete API documentation, database schema, FSRS details
- [Backend Quick Start](backend/QUICKSTART.md) - Get the API running in 60 seconds

### Frontend
- [Frontend README](frontend/README.md) - React architecture, components, styling
- [Frontend Quick Start](frontend/QUICKSTART.md) - Get the UI running in 60 seconds

### Hardware (Optional)
- [Hardware README](hardware/README.md) - Arduino setup, wiring diagrams, Python bridge
- [Hardware Quick Start](hardware/QUICKSTART.md) - Get controllers running in 3 steps

## Usage

### Basic Workflow

1. **Add Words** - Enter a foreign word + English translation. AI generates a contextual sentence and audio.
2. **Study** - Review cards with audio. Rate your recall (Again/Hard/Good/Easy).
3. **Track Progress** - View statistics, retention rate, and upcoming reviews.

### Study Methods

- **Web Interface** - Click buttons to show answers and rate cards
- **Physical Buttons** - 4 buttons for instant ratings (no screen needed)
- **Gesture Sensors** - Wave your hand to rate cards (contactless)
- **Keyboard** - Use keyboard shortcuts (coming soon)

### Hardware Controls

**Button Layout:**
- Button 1 → Hard
- Button 2 → Medium  
- Button 3 → Good
- Button 4 → Easy

**Sensor Gestures:**
- Wave at Sensor X → Hard rating
- Wave at Sensor Y → Good rating

Each input automatically shows the answer and submits the rating—one action does both!

## Tech Stack

### Core Technologies
- **Backend:** FastAPI, Python 3.8+, uvicorn
- **Frontend:** React 18, Vite, Tailwind CSS
- **Hardware:** Arduino, Python, pyserial

### Integrations
- **Google Gemini 2.5 Flash** - Contextual sentence generation
- **ElevenLabs** - Multilingual text-to-speech
- **FSRS Algorithm** - Scientifically-optimized spaced repetition

### Data Storage
- **JSON Database** - Simple, portable file-based storage
- **Audio Files** - MP3 format for offline playback

## API Overview

The backend exposes 13 REST endpoints for full system control:

| Endpoint | Description |
|----------|-------------|
| `POST /notes` | Create word with AI-generated sentence & audio |
| `GET /study/next` | Get next card due for review |
| `POST /study/answer` | Submit rating and update schedule |
| `GET /stats` | Retrieve all learning statistics |
| `POST /hardware/input` | Process button/sensor input |

See [Backend README](backend/README.md) for complete API documentation.

## Development

### Project Structure
```
hearsay/
├── backend/           # FastAPI server
│   ├── main.py       # API endpoints
│   ├── database.py   # JSON storage
│   ├── fsrs_controller.py
│   ├── gemini_controller.py
│   └── elevenlabs_controller.py
├── frontend/         # React application
│   └── src/
│       ├── pages/    # Study, Manage, Stats
│       └── api/      # Backend client
├── hardware/         # Arduino controllers
│   ├── ArduinoCode/  # Button sketch
│   ├── Sensors/      # Sensor sketch
│   ├── hardware_buttons.py
│   └── hardware_sensors.py
└── .env             # API keys (create this)
```

### Testing

**Backend:**
```bash
cd backend
python test_api.py
```

**Frontend:**
Open `http://localhost:3000` and use the interface.

**Hardware:**
Press buttons or wave at sensors—check frontend Study page for responses.

## Design Philosophy

1. **Accessibility First** - Alternative inputs make learning possible for everyone
2. **Audio-Centric** - Learn without constant screen attention
3. **Scientific Foundation** - FSRS algorithm maximizes retention
4. **Progressive Enhancement** - Works great with keyboard/mouse, enhanced by hardware
5. **Minimal Friction** - Each hardware input does two actions (show + rate)

## Why FSRS?

FSRS (Free Spaced Repetition Scheduler) is a modern alternative to traditional algorithms like SM-2:
- **Scientifically optimized** from millions of real review sessions
- **Personalized scheduling** based on card difficulty and stability
- **Higher retention** with fewer reviews compared to older algorithms

## Contributing

This project was built for HackHarvard 2025 by a team passionate about accessible education technology.

**Team Members:** Samuel Orellana Mateo, Jacobo Tagua Santana, Arjun Pun Magar, David Majekodunmi

**Want to contribute?** Reach out to the team or submit issues/PRs on the repository.

## Troubleshooting

### Quick Fixes

| Problem | Solution |
|---------|----------|
| Backend won't start | Check Python 3.8+: `python --version` |
| Frontend won't start | Clear cache: `npm cache clean --force` |
| Audio not generating | Verify API keys in `.env` file |
| Hardware not responding | Close Arduino IDE Serial Monitor |
| Port already in use | Change port in config files |

For detailed troubleshooting, see component READMEs:
- [Backend Troubleshooting](backend/README.md#troubleshooting)
- [Frontend Troubleshooting](frontend/README.md#troubleshooting)
- [Hardware Troubleshooting](hardware/README.md#troubleshooting)

## License

This project is developed for educational purposes as part of HackHarvard 2025.

## Acknowledgments

- **FSRS Team** - Open-source spaced repetition algorithm
- **Google Gemini** - AI-powered content generation
- **ElevenLabs** - Realistic text-to-speech synthesis
- **HackHarvard 2025** - For the opportunity to build accessible technology

---

<div align="center">
  
**Built with care for HackHarvard 2025**

[Documentation](backend/README.md) • [Quick Start](QUICKSTART.md) • [Hardware Setup](hardware/README.md)

</div>

# Language Learning Backend API

A FastAPI backend for a language learning application that uses the FSRS (Free Spaced Repetition Scheduler) algorithm for scheduling reviews and integrates with Gemini and ElevenLabs APIs for content generation.

## Features

- **Spaced Repetition**: Uses FSRS algorithm for optimal flashcard scheduling
- **AI-Generated Content**: Generates contextual sentences using Google Gemini API
- **Text-to-Speech**: Creates audio files for words and sentences using ElevenLabs API
- **RESTful API**: Complete FastAPI implementation with CORS support
- **JSON Database**: Simple file-based storage for notes, cards, and review logs

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the parent directory (one level up from the backend folder) with your API keys:

```
ELEVENLABS=your_elevenlabs_api_key_here
GEMINI=your_gemini_api_key_here
```

### 3. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

## API Endpoints

### `POST /notes`
Creates a new learning note with generated sentence and audio files.

**Request Body:**
```json
{
  "word": "objetivo",
  "translation": "target"
}
```

**Response:**
```json
{
  "note_id": 1,
  "card_ids": [1, 2],
  "message": "Note and two cards created"
}
```

### `GET /notes`
Gets all learning notes.

**Response:**
```json
[
  {
    "id": 1,
    "word": "objetivo",
    "translation": "target",
    "sentence": "Mi *objetivo* es aprender español.",
    "sentence_translation": "My goal is to learn Spanish.",
    "word_audio": "word_1.mp3",
    "translation_audio": "translation_1.mp3",
    "sentence_audio": "sentence_1.mp3",
    "sentence_translation_audio": "sentence_translation_1.mp3",
    "created_at": "2024-01-15T10:30:00.000000+00:00"
  }
]
```

### `GET /study/next`
Gets the next card due for review.

**Response:**
```json
{
  "id": 1,
  "note_id": 1,
  "direction": "forward",
  "fsrs_card": { ... },
  "note": { ... }
}
```

Or if no cards are due:
```json
{
  "message": "No cards due"
}
```

### `POST /study/answer`
Records a review for a card.

**Request Body:**
```json
{
  "card_id": 1,
  "rating": 3
}
```

**Ratings:**
- `1` - Again (forgot the card)
- `2` - Hard (remembered with serious difficulty)
- `3` - Good (remembered after hesitation)
- `4` - Easy (remembered easily)

**Response:**
```json
{
  "message": "Review recorded for card_id: 1"
}
```

### `GET /stats`
Gets all data (notes, cards, and review logs) for statistics.

**Response:**
```json
{
  "learning_notes": [...],
  "cards": [...],
  "review_logs": [...]
}
```

### `POST /hardware/input`
Logs input from hardware controller.

**Request Body:**
```json
{
  "input_type": "button",
  "value": "button_1"
}
```

**Response:**
```json
{
  "status": "received"
}
```

## Project Structure

```
backend/
├── main.py                      # FastAPI application with all endpoints
├── database.py                  # JSON database operations
├── fsrs_controller.py           # FSRS algorithm logic
├── gemini_controller.py         # Google Gemini API integration
├── elevenlabs_controller.py     # ElevenLabs TTS integration
├── requirements.txt             # Python dependencies
├── database.json               # Data storage (auto-created)
└── audio/                      # Generated audio files (auto-created)
```

## How It Works

### Creating a Note
1. User provides a word and translation
2. Backend selects well-known words (top 10% by mastery score)
3. Gemini API generates a contextual sentence using the target word
4. ElevenLabs API creates audio files for word, translation, sentence, and sentence translation
5. Two flashcards (forward and reverse) are created with FSRS scheduling
6. Everything is saved to `database.json`

### Studying
1. User requests next card via `/study/next`
2. Backend finds the card with earliest due date
3. User reviews the card and submits a rating (1-4)
4. FSRS algorithm calculates next review date
5. Review log is stored for future optimization

## FSRS Algorithm

The backend uses the FSRS (Free Spaced Repetition Scheduler) algorithm for optimal review scheduling:

- **Learning State**: New cards start here
- **Review State**: Cards that have been successfully learned
- **Relearning State**: Cards that were forgotten and need relearning

Cards are automatically scheduled based on:
- User's rating (1-4)
- Card's stability and difficulty
- Desired retention rate (default: 90%)

## Dependencies

- **FastAPI**: Modern web framework for building APIs
- **fsrs**: FSRS algorithm implementation
- **google-generativeai**: Google Gemini API client
- **elevenlabs**: ElevenLabs text-to-speech API client
- **python-dotenv**: Environment variable management
- **uvicorn**: ASGI server for FastAPI

## Notes

- All timestamps use UTC timezone
- Audio files are stored in the `/audio` directory
- Database is stored in `database.json` (JSON format)
- No Pydantic models are used - all data is handled with Python dictionaries
- CORS is enabled for all origins (adjust in production)


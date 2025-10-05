# Backend - Language Learning API

A comprehensive FastAPI backend server that powers the Hearsay language learning system with spaced repetition scheduling, AI-generated content, and text-to-speech audio generation.

## Overview

This backend provides a RESTful API for managing language learning flashcards with intelligent scheduling using the FSRS (Free Spaced Repetition Scheduler) algorithm. It integrates with Google Gemini for contextual sentence generation and ElevenLabs for high-quality text-to-speech audio synthesis.

## Features

- **FSRS Spaced Repetition**: Scientifically optimized review scheduling for maximum retention
- **AI-Generated Sentences**: Contextual sentences using learner's known vocabulary
- **Text-to-Speech Audio**: Natural-sounding pronunciation in multiple languages
- **RESTful API**: Complete FastAPI implementation with automatic documentation
- **Hardware Integration**: Endpoints for physical button and sensor controllers
- **JSON Database**: Simple, portable file-based storage
- **CORS Enabled**: Accessible from any frontend
- **Static File Serving**: Direct audio file access
- **Real-Time State Management**: Synchronizes hardware and frontend

## Architecture

### Core Components

#### 1. **main.py** - FastAPI Application
The central API server that handles all HTTP requests, coordinates controllers, and manages application state.

**Key Features:**
- 13 REST API endpoints
- Hardware action queue for async communication
- Page state tracking for hardware context
- Card state management (question/answer showing)
- Startup event for database initialization
- Static file mounting for audio access

#### 2. **database.py** - Data Persistence Layer
Manages JSON-based storage with three main collections:

**Collections:**
- `learning_notes`: Word, translation, sentence, audio filenames
- `cards`: Flashcard instances with FSRS state (forward/reverse)
- `review_logs`: Historical review data for optimization

**Functions:**
- `initialize_database()`: Creates database.json if not exists
- `read_data()`: Loads entire database
- `write_data(data)`: Saves entire database
- `get_next_id(data, collection)`: Generates unique IDs

#### 3. **fsrs_controller.py** - Spaced Repetition Engine
Implements the FSRS algorithm with custom parameters optimized for short-term learning.

**Configuration:**
- **Desired Retention**: 92% (shorter intervals for active learning)
- **Maximum Interval**: 15 days (suitable for demo/exam timeframe)
- **Learning Steps**: 1 minute, 10 minutes
- **Relearning Steps**: 10 minutes
- **Initial Stability**: Reduced for faster iteration (w[0-3]: 0.3, 0.5, 1.5, 5.0)

**Functions:**
- `create_new_card()`: Initialize FSRS card
- `review_card(card_dict, rating, now)`: Update card based on rating
- `get_card_retrievability(card_dict)`: Calculate current memory strength
- `calculate_mastery_score(card_dict)`: Combined stability × retrievability metric
- `is_card_due(card_dict)`: Check if review is needed
- `estimate_workload_for_retention(cards, target_retention)`: Calculate daily review load

**Rating System:**
- **1 - Again**: Completely forgot
- **2 - Hard**: Difficult to recall
- **3 - Good**: Recalled with hesitation
- **4 - Easy**: Instant recall

#### 4. **gemini_controller.py** - AI Sentence Generation
Integrates with Google's Gemini 2.5 Flash model for generating contextual sentences.

**Features:**
- Uses learner's top 10% mastered words for context
- Generates ~10 word sentences
- Automatic target word detection and marking with asterisks
- Fallback to simple prompts if no known words exist
- Error handling with detailed messages

**Functions:**
- `initialize_client()`: Setup Gemini API connection
- `generate_sentence(target_word, known_words)`: Create contextual sentence
- `generate_sentence_simple(target_word, translation)`: Create basic sentence
- `find_target_word_in_sentence(sentence, target_word)`: Auto-mark target word

**Algorithm:**
Automatically finds the best matching word in the sentence (handles conjugations, gender/number variations) by counting sequential character matches.

#### 5. **elevenlabs_controller.py** - Text-to-Speech Synthesis
Generates realistic audio using ElevenLabs' multilingual voice model.

**Configuration:**
- **Model**: eleven_multilingual_v2
- **Voice**: 21m00Tcm4TlvDq8ikWAM (default voice)
- **Output Format**: MP3
- **Storage**: `audio/` directory

**Functions:**
- `initialize_client()`: Setup ElevenLabs API connection
- `generate_audio(text, filename)`: Create single audio file
- `generate_audio_for_note(word, translation, sentence, sentence_translation, note_id)`: Generate all 4 audio files for a note

**Audio Files Generated:**
- `word_{id}.mp3`: Target language word
- `translation_{id}.mp3`: English translation
- `sentence_{id}.mp3`: Contextual sentence
- `sentence_translation_{id}.mp3`: English sentence translation

## API Endpoints

### Core Learning Endpoints

#### `GET /`
Health check endpoint.

**Response:**
```json
{
  "message": "Language Learning API is running"
}
```

---

#### `POST /notes`
Creates a new learning note with AI-generated sentence and audio files.

**Request Body:**
```json
{
  "word": "objetivo",
  "translation": "target"
}
```

**Process:**
1. Selects top 10% mastered words from user's vocabulary
2. Calls Gemini API to generate contextual sentence
3. Calls ElevenLabs API to create 4 audio files
4. Creates note record
5. Creates 2 flashcards (forward and reverse)
6. Saves to database

**Response:**
```json
{
  "note_id": 1,
  "card_ids": [1, 2],
  "message": "Note and two cards created"
}
```

**Errors:**
- `400`: Missing word or translation
- `500`: Gemini API error or ElevenLabs API error

**Timing:** 10-20 seconds (due to AI generation and TTS)

---

#### `GET /notes`
Retrieves all learning notes.

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

---

#### `GET /study/next`
Gets the next card due for review based on FSRS scheduling.

**Response (card available):**
```json
{
  "id": 1,
  "note_id": 1,
  "direction": "forward",
  "fsrs_card": {
    "due": "2024-01-15T10:00:00+00:00",
    "stability": 1.5,
    "difficulty": 5.0,
    "elapsed_days": 0,
    "scheduled_days": 1,
    "reps": 0,
    "lapses": 0,
    "state": 0,
    "last_review": null
  },
  "note": {
    "id": 1,
    "word": "objetivo",
    "translation": "target",
    ...
  }
}
```

**Response (no cards due):**
```json
{
  "message": "No cards due"
}
```

**Logic:**
- Filters cards where `due <= current_time`
- Sorts by earliest due date
- Returns card with combined note data
- Resets card state to "question_showing"

---

#### `POST /study/answer`
Records a review and updates the card's schedule using FSRS algorithm.

**Request Body:**
```json
{
  "card_id": 1,
  "rating": 3
}
```

**Ratings:**
- `1`: Again (forgot)
- `2`: Hard (difficult)
- `3`: Good (remembered with hesitation)
- `4`: Easy (instant recall)

**Response:**
```json
{
  "message": "Review recorded for card_id: 1"
}
```

**Process:**
1. Finds card in database
2. Calls FSRS controller to calculate new schedule
3. Updates card's FSRS state (due date, stability, difficulty)
4. Creates review log entry
5. Saves to database

**Errors:**
- `400`: Missing card_id/rating or invalid rating
- `404`: Card not found

---

#### `GET /stats`
Returns all data for frontend statistics processing.

**Response:**
```json
{
  "learning_notes": [...],
  "cards": [...],
  "review_logs": [...]
}
```

Used by frontend to calculate:
- Total words and cards
- Cards due today
- Card state distribution (new/learning/review/relearning)
- Rating distribution
- Average stability and retention rate
- Review history timeline

---

### Hardware Integration Endpoints

#### `POST /hardware/page`
Sets the current page context for hardware controllers.

**Request Body:**
```json
{
  "page": "study"
}
```

**Valid Pages:** `"study"`, `"manage"`, `"stats"`

**Response:**
```json
{
  "status": "ok",
  "current_page": "study"
}
```

**Purpose:** Hardware inputs are only processed when page is "study"

---

#### `GET /hardware/page`
Gets the current page state.

**Response:**
```json
{
  "page": "study"
}
```

---

#### `GET /hardware/card-state`
Gets whether question or answer is currently showing.

**Response:**
```json
{
  "state": "question_showing"
}
```

**States:** `"question_showing"` or `"answer_showing"`

---

#### `POST /hardware/input`
Processes input from hardware controllers (buttons or sensors).

**Request Body (Show Card):**
```json
{
  "action": "show_card"
}
```

**Request Body (Submit Rating):**
```json
{
  "action": "submit_rating",
  "rating": 3
}
```

**Response (Success):**
```json
{
  "status": "ok",
  "action": "submit_rating",
  "rating": 3
}
```

**Response (Ignored - Wrong Page):**
```json
{
  "status": "ignored",
  "reason": "not on study page"
}
```

**Response (Cooldown Active):**
```json
{
  "status": "cooldown",
  "wait_time": 0.45
}
```

**Features:**
- **Page Context**: Only processes when on study page
- **Cooldown**: 1-second minimum between completed actions
- **Action Queue**: Queues actions for frontend polling
- **State Management**: Updates card state (question/answer)

---

#### `GET /hardware/poll`
Frontend polls this endpoint to get pending hardware actions.

**Response (Actions Available):**
```json
{
  "actions": [
    {"action": "show_card"},
    {"action": "submit_rating", "rating": 3}
  ]
}
```

**Response (No Actions):**
```json
{
  "actions": []
}
```

**Behavior:** Returns all pending actions and clears the queue.

---

### Advanced Endpoints

#### `POST /optimize-fsrs`
Optimizes FSRS parameters based on review history.

**Response:**
```json
{
  "message": "Optimization completed with 150 reviews analyzed. Parameters are now optimized for your learning pattern.",
  "review_count": 150,
  "note": "Using default FSRS parameters. For production, implement fsrs.optimizer() function."
}
```

**Requirements:** Minimum 10 review logs

**Note:** Currently a placeholder. Full optimization requires implementing FSRS optimizer from fsrs-rs or py-fsrs library.

---

#### `GET /workload-retention`
Calculates estimated daily review workload for different retention levels.

**Response:**
```json
{
  "data_points": [
    {"retention": 0.70, "workload": 5.2},
    {"retention": 0.80, "workload": 7.8},
    {"retention": 0.90, "workload": 12.4},
    {"retention": 0.95, "workload": 18.9}
  ]
}
```

**Usage:** Visualize tradeoff between retention goals and daily review time.

---

## External APIs

### Google Gemini API

**Service:** AI-powered sentence generation  
**Model:** gemini-2.5-flash  
**Endpoint:** Via `google.generativeai` Python SDK  
**Authentication:** API key from environment variable `GEMINI`

**Setup:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `.env`: `GEMINI=your_key_here`

**Rate Limits:** Follow Google's Gemini API rate limits (typically generous for free tier)

**Error Handling:**
- Connection errors return detailed error messages
- Empty responses handled gracefully
- Malformed responses trigger fallback behavior

---

### ElevenLabs API

**Service:** Text-to-speech synthesis  
**Model:** eleven_multilingual_v2  
**Voice ID:** 21m00Tcm4TlvDq8ikWAM  
**Endpoint:** Via `elevenlabs.client` Python SDK  
**Authentication:** API key from environment variable `ELEVENLABS`

**Setup:**
1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign up and get API key
3. Add to `.env`: `ELEVENLABS=your_key_here`

**Rate Limits:** 
- Free tier: 10,000 characters/month
- Consider paid plan for production use

**Audio Specs:**
- Format: MP3
- Quality: High (multilingual model)
- Storage: `audio/` directory

---

## Dependencies

```
fastapi==0.109.0        # Modern web framework
uvicorn==0.27.0         # ASGI server
python-dotenv==1.0.0    # Environment variables
fsrs==4.1.1             # Spaced repetition algorithm
elevenlabs==1.3.0       # Text-to-speech API
google-generativeai==0.3.2  # Gemini AI API
```

**Install:**
```bash
pip install -r requirements.txt
```

---

## Database Structure

The backend uses a simple JSON-based file storage system (`database.json`) for persistence. This choice prioritizes simplicity and portability for the hackathon demo while maintaining full functionality.

### File Location

- **File:** `backend/database.json`
- **Format:** JSON
- **Encoding:** UTF-8
- **Created:** Automatically on first run if not exists

### Top-Level Structure

```json
{
  "learning_notes": [],
  "cards": [],
  "review_logs": []
}
```

The database consists of three main collections that work together to implement the spaced repetition learning system:

1. **learning_notes** - The core vocabulary data (words, sentences, audio)
2. **cards** - Flashcard instances with FSRS scheduling state
3. **review_logs** - Historical review data for optimization

---

### Collection 1: Learning Notes

Stores vocabulary words with AI-generated sentences and audio files.

**Purpose:**
- Contains the actual learning content
- References audio files stored in `audio/` directory
- One note can have multiple cards (forward and reverse)

**Structure:**

```json
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
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier (auto-increment) |
| `word` | string | Target language word |
| `translation` | string | English translation |
| `sentence` | string | Contextual sentence (asterisks mark target word) |
| `sentence_translation` | string | English translation of sentence |
| `word_audio` | string | Filename for target word audio |
| `translation_audio` | string | Filename for translation audio |
| `sentence_audio` | string | Filename for sentence audio |
| `sentence_translation_audio` | string | Filename for sentence translation audio |
| `created_at` | string (ISO 8601) | UTC timestamp of creation |

**Relationships:**
- `id` is referenced by `cards.note_id`
- One note generates exactly 2 cards (forward and reverse)

**Example:**
```json
{
  "id": 3,
  "word": "gato",
  "translation": "cat",
  "sentence": "El *gato* está durmiendo en el sofá.",
  "sentence_translation": "The cat is sleeping on the sofa.",
  "word_audio": "word_3.mp3",
  "translation_audio": "translation_3.mp3",
  "sentence_audio": "sentence_3.mp3",
  "sentence_translation_audio": "sentence_translation_3.mp3",
  "created_at": "2024-01-15T14:20:35.123456+00:00"
}
```

---

### Collection 2: Cards

Stores flashcard instances with FSRS scheduling state.

**Purpose:**
- Represents individual flashcards for spaced repetition
- Contains FSRS algorithm state (stability, difficulty, due date)
- Each note has 2 cards: forward (target→English) and reverse (English→target)

**Structure:**

```json
{
  "id": 1,
  "note_id": 1,
  "direction": "forward",
  "fsrs_card": {
    "due": "2024-01-15T10:00:00+00:00",
    "stability": 1.5,
    "difficulty": 5.0,
    "elapsed_days": 0,
    "scheduled_days": 1,
    "reps": 0,
    "lapses": 0,
    "state": 0,
    "last_review": "2024-01-14T10:00:00+00:00"
  }
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique card identifier |
| `note_id` | integer | Foreign key to learning_notes.id |
| `direction` | string | "forward" or "reverse" |
| `fsrs_card` | object | FSRS algorithm state (see below) |

**Direction Values:**
- `"forward"`: Shows target language word, expects English translation
- `"reverse"`: Shows English word, expects target language translation

**FSRS Card Object:**

| Field | Type | Description |
|-------|------|-------------|
| `due` | string (ISO 8601) | Next review date/time (UTC) |
| `stability` | float | Memory stability in days (FSRS metric) |
| `difficulty` | float | Card difficulty (0-10, default ~5) |
| `elapsed_days` | integer | Days since last review |
| `scheduled_days` | integer | Days until next review |
| `reps` | integer | Total number of reviews |
| `lapses` | integer | Number of times forgotten |
| `state` | integer | Learning state (see below) |
| `last_review` | string (ISO 8601) | Timestamp of last review (UTC) |

**FSRS State Values:**

| State | Name | Description |
|-------|------|-------------|
| `0` | New | Card never reviewed |
| `1` | Learning | Card in initial learning phase |
| `2` | Review | Card successfully learned |
| `3` | Relearning | Card forgotten, being relearned |

**State Transitions:**
```
New (0) ─review→ Learning (1) ─review→ Review (2)
                                          ↓ forgot
                                    Relearning (3)
                                          ↓ relearn
                                    Review (2)
```

**Relationships:**
- `note_id` references `learning_notes.id`
- `id` is referenced by `review_logs.card_id`

**Example Cards for One Note:**
```json
[
  {
    "id": 5,
    "note_id": 3,
    "direction": "forward",
    "fsrs_card": {
      "due": "2024-01-16T09:30:00+00:00",
      "stability": 2.3,
      "difficulty": 4.8,
      "elapsed_days": 1,
      "scheduled_days": 2,
      "reps": 3,
      "lapses": 0,
      "state": 2,
      "last_review": "2024-01-15T14:25:00+00:00"
    }
  },
  {
    "id": 6,
    "note_id": 3,
    "direction": "reverse",
    "fsrs_card": {
      "due": "2024-01-15T20:00:00+00:00",
      "stability": 1.8,
      "difficulty": 5.2,
      "elapsed_days": 0,
      "scheduled_days": 1,
      "reps": 2,
      "lapses": 1,
      "state": 3,
      "last_review": "2024-01-15T14:26:00+00:00"
    }
  }
]
```

---

### Collection 3: Review Logs

Stores complete history of all card reviews.

**Purpose:**
- Historical record of all reviews
- Used for statistics and analytics
- Used for FSRS parameter optimization
- Tracks learning progress over time

**Structure:**

```json
{
  "id": 1,
  "card_id": 1,
  "rating": 3,
  "state": 1,
  "due": "2024-01-15T10:00:00+00:00",
  "stability": 1.5,
  "difficulty": 5.0,
  "elapsed_days": 1,
  "last_elapsed_days": 0,
  "scheduled_days": 1,
  "review": "2024-01-15T10:00:00+00:00"
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique log entry identifier |
| `card_id` | integer | Foreign key to cards.id |
| `rating` | integer | User's rating (1-4) |
| `state` | integer | Card state at time of review |
| `due` | string (ISO 8601) | Due date before review |
| `stability` | float | Stability after review |
| `difficulty` | float | Difficulty after review |
| `elapsed_days` | integer | Days since previous review |
| `last_elapsed_days` | integer | Elapsed days from previous review |
| `scheduled_days` | integer | Days scheduled until next review |
| `review` | string (ISO 8601) | Timestamp when review occurred (UTC) |

**Rating Values:**

| Rating | Label | Meaning |
|--------|-------|---------|
| `1` | Again | Completely forgot |
| `2` | Hard | Difficult to recall |
| `3` | Good | Recalled with hesitation |
| `4` | Easy | Instant recall |

**Relationships:**
- `card_id` references `cards.id`

**Example:**
```json
{
  "id": 15,
  "card_id": 5,
  "rating": 3,
  "state": 2,
  "due": "2024-01-16T09:30:00+00:00",
  "stability": 2.3,
  "difficulty": 4.8,
  "elapsed_days": 1,
  "last_elapsed_days": 0,
  "scheduled_days": 2,
  "review": "2024-01-16T10:45:23.456789+00:00"
}
```

---

### Database Operations

The `database.py` module provides simple CRUD operations:

**Functions:**

```python
def initialize_database():
    """Creates database.json with empty collections if not exists"""
    
def read_data():
    """Loads entire database into memory"""
    
def write_data(data):
    """Saves entire database to disk"""
    
def get_next_id(data, collection_name):
    """Generates next unique ID for collection"""
```

**Usage Pattern:**

```python
# Read
data = database.read_data()
notes = data["learning_notes"]
cards = data["cards"]

# Modify
new_note = {
    "id": database.get_next_id(data, "learning_notes"),
    "word": "hola",
    # ... other fields
}
data["learning_notes"].append(new_note)

# Write
database.write_data(data)
```

---

### Data Flow Example

**Creating a New Word:**

1. User submits `word="gato"` and `translation="cat"`
2. Backend generates:
   - Note ID: 3
   - Sentence: "El *gato* está durmiendo"
   - Audio files: `word_3.mp3`, etc.
3. Creates learning note with ID 3
4. Creates 2 cards:
   - Card 5: `note_id=3`, `direction="forward"`
   - Card 6: `note_id=3`, `direction="reverse"`
5. Both cards start with `state=0` (New)

**Reviewing a Card:**

1. Frontend requests `/study/next`
2. Backend finds card 5 (due now)
3. Returns card 5 + note 3 data
4. User reviews and rates `3` (Good)
5. FSRS calculates new schedule:
   - `stability` increases to 2.3
   - `due` set to 2 days from now
   - `state` changes to 2 (Review)
6. Creates review log entry ID 15
7. Updates card 5 in database

**Querying for Statistics:**

1. Frontend requests `/stats`
2. Backend returns entire database
3. Frontend calculates:
   - Total notes: `len(learning_notes)`
   - Cards due: count where `card.due <= now`
   - Average stability: mean of `card.fsrs_card.stability`
   - Reviews today: count `review_logs` where `review.date == today`

---

### Backup and Recovery

**Manual Backup:**
```bash
cp backend/database.json backend/database_backup.json
```

**Restore:**
```bash
cp backend/database_backup.json backend/database.json
```

**Export for Analysis:**
```bash
# Database is already JSON - can be directly imported to analysis tools
python -c "import json; print(json.dumps(json.load(open('database.json')), indent=2))"
```

---

### Performance Considerations

**Current Implementation:**
- Entire database loaded into memory for each request
- Simple and fast for small datasets (< 1000 notes)
- Atomic writes (entire file replaced)

**Scalability:**
For production use with large datasets, consider:
- PostgreSQL or MongoDB for better querying
- Index on `cards.due` for faster `/study/next`
- Separate audio file storage (S3, CDN)
- Connection pooling
- Caching frequently accessed data

**Estimated Sizes:**
- 1 note with 2 cards: ~1 KB JSON
- 1000 notes: ~1 MB JSON
- Audio files: ~50-100 KB each
- 1000 notes with audio: ~400-800 MB total

---

## Running the Server

### Development Mode

```bash
python main.py
```

Server runs on `http://0.0.0.0:8000`

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Custom Configuration

Edit `main.py`:
```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",  # Accept connections from any IP
        port=8000,       # Change port if needed
        reload=True      # Auto-reload on code changes (dev only)
    )
```

---

## Testing

### Automated Test Suite

```bash
python test_api.py
```

Tests all endpoints with real API calls.

### Manual cURL Testing

See [QUICKSTART.md](QUICKSTART.md) for cURL commands.

### API Documentation

Visit `http://localhost:8000/docs` for interactive Swagger UI documentation (auto-generated by FastAPI).

---

## Project Structure

```
backend/
├── main.py                      # FastAPI app with all endpoints
├── database.py                  # JSON database operations
├── fsrs_controller.py           # FSRS scheduling algorithm
├── gemini_controller.py         # Google Gemini integration
├── elevenlabs_controller.py     # ElevenLabs TTS integration
├── test_api.py                  # Automated test suite
├── requirements.txt             # Python dependencies
├── database.json               # Data storage (auto-created)
├── audio/                      # Generated MP3 files (auto-created)
├── README.md                   # This file
└── QUICKSTART.md               # Fast setup guide
```

---

## Security Considerations

**Current Configuration (Development):**
- CORS enabled for all origins (`allow_origins=["*"]`)
- No authentication required
- Database is plain JSON file

**Production Recommendations:**
- Restrict CORS to specific domains
- Add API key authentication
- Use proper database (PostgreSQL, MongoDB)
- Add rate limiting
- Use HTTPS
- Secure API keys with proper secret management

---

## Performance Notes

- **Note Creation**: 10-20 seconds (AI generation + TTS)
- **Card Retrieval**: <10ms (JSON file read)
- **Review Submission**: <50ms (FSRS calculation + write)
- **Audio File Size**: ~50-100KB per MP3

**Optimization Opportunities:**
- Cache Gemini API responses
- Batch audio generation
- Use database connection pooling
- Implement Redis for action queue
- Add CDN for audio files

---

## Contributing

See main project [README](../README.md) for contribution guidelines.

---

Built for HackHarvard 2025

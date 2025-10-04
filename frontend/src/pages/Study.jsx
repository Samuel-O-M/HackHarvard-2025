import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = '/api'
const AUDIO_BASE = 'http://localhost:8000/audio'

function Study() {
  const [currentCard, setCurrentCard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchNextCard()
  }, [])

  // Auto-play question audio when card appears
  useEffect(() => {
    if (currentCard && currentCard.note && !showAnswer) {
      const { note, direction } = currentCard
      const isForward = direction === 'forward'
      const audioFilename = isForward ? note.word_audio : note.translation_audio
      
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        playAudio(audioFilename)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [currentCard, showAnswer])

  // Auto-play answer audio when "show answer" is pressed
  useEffect(() => {
    if (showAnswer && currentCard && currentCard.note) {
      const { note, direction } = currentCard
      const isForward = direction === 'forward'
      const audioFilename = isForward ? note.translation_audio : note.word_audio
      
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        playAudio(audioFilename)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [showAnswer])

  const fetchNextCard = async () => {
    try {
      setLoading(true)
      setShowAnswer(false)
      const response = await axios.get(`${API_URL}/study/next`)
      
      if (response.data.message) {
        setMessage(response.data.message)
        setCurrentCard(null)
      } else {
        setCurrentCard(response.data)
        setMessage('')
      }
    } catch (error) {
      console.error('Error fetching next card:', error)
      setMessage('Error loading card')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (rating) => {
    if (!currentCard) return
    
    try {
      setLoading(true)
      await axios.post(`${API_URL}/study/answer`, {
        card_id: currentCard.id,
        rating: rating
      })
      
      // Fetch next card
      await fetchNextCard()
    } catch (error) {
      console.error('Error submitting answer:', error)
      setMessage('Error submitting answer')
      setLoading(false)
    }
  }

  const playAudio = (filename) => {
    if (!filename) return
    const audio = new Audio(`${AUDIO_BASE}/${filename}`)
    audio.play().catch(err => console.error('Error playing audio:', err))
  }

  const renderCardContent = () => {
    if (!currentCard || !currentCard.note) return null

    const { note, direction } = currentCard
    const isForward = direction === 'forward'

    return (
      <div className="space-y-6">
        {/* Question Side */}
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">
              {isForward ? 'Spanish → English' : 'English → Spanish'}
            </h3>
            <span className="text-sm text-blue-600 font-medium">
              {direction.toUpperCase()}
            </span>
          </div>

          <div className="space-y-4">
            {/* Word */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500 mb-1">Word:</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isForward ? note.word : note.translation}
                </p>
              </div>
              <button 
                onClick={() => playAudio(isForward ? note.word_audio : note.translation_audio)}
                className="btn btn-primary text-2xl"
              >
                🔊
              </button>
            </div>

            {/* Sentence */}
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Sentence:</p>
                <button 
                  onClick={() => playAudio(isForward ? note.sentence_audio : note.sentence_translation_audio)}
                  className="btn btn-secondary text-xl"
                >
                  🔊
                </button>
              </div>
              <p className="text-xl text-gray-900 leading-relaxed">
                {isForward 
                  ? note.sentence.replace(/\*/g, '') 
                  : note.sentence_translation}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setShowAnswer(!showAnswer)}
            className="btn btn-primary w-full mt-6"
          >
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>
        </div>

        {/* Answer Side */}
        {showAnswer && (
          <div className="card bg-green-50 border-2 border-green-200 animate-fade-in">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Answer</h3>
            
            <div className="space-y-4">
              {/* Translation */}
              <div className="flex items-center justify-between bg-white p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Translation:</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isForward ? note.translation : note.word}
                  </p>
                </div>
                <button 
                  onClick={() => playAudio(isForward ? note.translation_audio : note.word_audio)}
                  className="btn btn-success text-2xl"
                >
                  🔊
                </button>
              </div>

              {/* Translation Sentence */}
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Translation:</p>
                  <button 
                    onClick={() => playAudio(isForward ? note.sentence_translation_audio : note.sentence_audio)}
                    className="btn btn-secondary text-xl"
                  >
                    🔊
                  </button>
                </div>
                <p className="text-xl text-gray-900 leading-relaxed">
                  {isForward 
                    ? note.sentence_translation 
                    : note.sentence.replace(/\*/g, '')}
                </p>
              </div>
            </div>

            {/* Rating Buttons */}
            <div className="mt-6 space-y-3">
              <p className="text-center text-sm text-gray-600 font-medium">How well did you know this?</p>
              <div className="grid grid-cols-4 gap-3">
                <button 
                  onClick={() => handleAnswer(1)}
                  disabled={loading}
                  className="btn bg-red-600 text-white hover:bg-red-700 py-4 disabled:opacity-50"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">😰</div>
                    <div className="text-xs font-semibold">Again</div>
                  </div>
                </button>
                <button 
                  onClick={() => handleAnswer(2)}
                  disabled={loading}
                  className="btn bg-orange-500 text-white hover:bg-orange-600 py-4 disabled:opacity-50"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">😕</div>
                    <div className="text-xs font-semibold">Hard</div>
                  </div>
                </button>
                <button 
                  onClick={() => handleAnswer(3)}
                  disabled={loading}
                  className="btn bg-blue-600 text-white hover:bg-blue-700 py-4 disabled:opacity-50"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🙂</div>
                    <div className="text-xs font-semibold">Good</div>
                  </div>
                </button>
                <button 
                  onClick={() => handleAnswer(4)}
                  disabled={loading}
                  className="btn bg-green-600 text-white hover:bg-green-700 py-4 disabled:opacity-50"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">😄</div>
                    <div className="text-xs font-semibold">Easy</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading && !currentCard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading card...</p>
        </div>
      </div>
    )
  }

  if (message && !currentCard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
          <p className="text-gray-600 mb-6">Add more words to continue learning!</p>
          <a href="/manage" className="btn btn-primary">
            Add Words
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Session</h1>
        <p className="text-gray-600">Review your flashcards and improve your vocabulary</p>
      </div>

      {renderCardContent()}
    </div>
  )
}

export default Study


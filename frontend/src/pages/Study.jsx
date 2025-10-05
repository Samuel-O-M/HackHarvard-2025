import { useState, useEffect } from 'react'
import { getApi, getBackendUrl } from '../api/backend'

function Study() {
  const [currentCard, setCurrentCard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [message, setMessage] = useState('')
  const [backendUrl, setBackendUrl] = useState('')
  const [defaultAudio, setDefaultAudio] = useState('word') // 'word' or 'sentence'

  useEffect(() => {
    initializeBackend()
  }, [])

  // Poll for hardware actions
  useEffect(() => {
    let pollInterval

    const pollHardware = async () => {
      try {
        const api = await getApi()
        const response = await api.get('/hardware/poll')
        
        if (response.data.actions && response.data.actions.length > 0) {
          // Process each action
          for (const action of response.data.actions) {
            if (action.action === 'show_card') {
              // Show the answer
              setShowAnswer(true)
            } else if (action.action === 'submit_rating') {
              // Submit the rating if answer is shown
              if (showAnswer && currentCard) {
                await handleAnswer(action.rating)
              }
            }
          }
        }
      } catch (error) {
        // Silently fail - backend might not be available
        console.log('Hardware poll error:', error.message)
      }
    }

    // Poll every 200ms for responsive hardware interaction
    pollInterval = setInterval(pollHardware, 200)

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [showAnswer, currentCard]) // Re-create interval when these change

  const initializeBackend = async () => {
    try {
      const url = await getBackendUrl()
      setBackendUrl(url)
      fetchNextCard()
    } catch (error) {
      setMessage('No backend available. Please start a backend server.')
      console.error('Backend connection failed:', error)
    }
  }

  // Auto-play question audio when card appears
  useEffect(() => {
    if (currentCard && currentCard.note && !showAnswer) {
      const { note, direction } = currentCard
      const isForward = direction === 'forward'
      
      // Use defaultAudio preference to determine which audio to play
      let audioFilename
      if (defaultAudio === 'word') {
        audioFilename = isForward ? note.word_audio : note.translation_audio
      } else {
        audioFilename = isForward ? note.sentence_audio : note.sentence_translation_audio
      }
      
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        playAudio(audioFilename)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [currentCard, showAnswer, defaultAudio])

  // Auto-play answer audio when "show answer" is pressed
  useEffect(() => {
    if (showAnswer && currentCard && currentCard.note) {
      const { note, direction } = currentCard
      const isForward = direction === 'forward'
      
      // Use defaultAudio preference to determine which audio to play
      let audioFilename
      if (defaultAudio === 'word') {
        audioFilename = isForward ? note.translation_audio : note.word_audio
      } else {
        audioFilename = isForward ? note.sentence_translation_audio : note.sentence_audio
      }
      
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        playAudio(audioFilename)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [showAnswer, defaultAudio])

  const fetchNextCard = async () => {
    try {
      setLoading(true)
      setShowAnswer(false)
      const api = await getApi()
      const response = await api.get('/study/next')
      
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
      const api = await getApi()
      await api.post('/study/answer', {
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
    if (!filename || !backendUrl) return
    const audio = new Audio(`${backendUrl}/audio/${filename}`)
    audio.play().catch(err => console.error('Error playing audio:', err))
  }

  const renderCardContent = () => {
    if (!currentCard || !currentCard.note) return null

    const { note, direction } = currentCard
    const isForward = direction === 'forward'

    return (
      <div className="space-y-6">
        {/* Main Card with Question and Answer */}
        <div className="card bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-hearsay-cyan">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-hearsay-cyan to-hearsay-purple bg-clip-text text-transparent">
              {isForward ? 'Foreign Language → English' : 'English → Foreign Language'}
            </h3>
            <span className="text-sm text-hearsay-blue font-medium">
              {direction.toUpperCase()}
            </span>
          </div>

          <div className="space-y-6">
            {/* Question Section */}
            <div className="space-y-3">
              {/* Question Word */}
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-blue-200">
                <p className="text-3xl font-bold text-gray-900">
                  {isForward ? note.word : note.translation}
                </p>
                <button 
                  onClick={() => playAudio(isForward ? note.word_audio : note.translation_audio)}
                  className="btn btn-primary text-2xl"
                >
                  🔊
                </button>
              </div>

              {/* Question Sentence */}
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <p className="text-xl text-gray-900 leading-relaxed flex-1">
                    {isForward 
                      ? note.sentence.replace(/\*/g, '') 
                      : note.sentence_translation}
                  </p>
                  <button 
                    onClick={() => playAudio(isForward ? note.sentence_audio : note.sentence_translation_audio)}
                    className="btn btn-secondary text-xl ml-3"
                  >
                    🔊
                  </button>
                </div>
              </div>
            </div>

            {/* Answer Section */}
            <div className="space-y-3">
              {/* Answer Word */}
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                showAnswer 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-gray-100 border-gray-300'
              }`}>
                {showAnswer ? (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {isForward ? note.translation : note.word}
                    </p>
                    <button 
                      onClick={() => playAudio(isForward ? note.translation_audio : note.word_audio)}
                      className="btn btn-success text-2xl"
                    >
                      🔊
                    </button>
                  </>
                ) : (
                  <div className="w-full h-12 flex items-center">
                    <div className="text-2xl text-gray-400">___________</div>
                  </div>
                )}
              </div>

              {/* Answer Sentence */}
              <div className={`p-4 rounded-lg border-2 transition-all ${
                showAnswer 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-gray-100 border-gray-300'
              }`}>
                {showAnswer ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xl text-gray-900 leading-relaxed flex-1">
                      {isForward 
                        ? note.sentence_translation 
                        : note.sentence.replace(/\*/g, '')}
                    </p>
                    <button 
                      onClick={() => playAudio(isForward ? note.sentence_translation_audio : note.sentence_audio)}
                      className="btn btn-secondary text-xl ml-3"
                    >
                      🔊
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-8 flex items-center">
                    <div className="text-xl text-gray-400">___________</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Show Answer Button or Rating Buttons */}
          {!showAnswer ? (
            <button 
              onClick={() => setShowAnswer(true)}
              className="btn btn-primary w-full mt-6 py-4 text-lg"
            >
              Show Answer
            </button>
          ) : (
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
                  className="btn bg-gradient-to-r from-hearsay-cyan to-hearsay-blue text-white hover:shadow-lg py-4 disabled:opacity-50"
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
          )}
        </div>
      </div>
    )
  }

  if (loading && !currentCard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-hearsay-blue mx-auto mb-4"></div>
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
      {/* Audio Toggle */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="text-sm text-gray-600 font-medium">Default Audio:</span>
        <div className="inline-flex rounded-lg border-2 border-hearsay-cyan overflow-hidden">
          <button
            onClick={() => setDefaultAudio('word')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              defaultAudio === 'word'
                ? 'bg-hearsay-cyan text-white'
                : 'bg-white text-hearsay-cyan hover:bg-cyan-50'
            }`}
          >
            Word
          </button>
          <button
            onClick={() => setDefaultAudio('sentence')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              defaultAudio === 'sentence'
                ? 'bg-hearsay-cyan text-white'
                : 'bg-white text-hearsay-cyan hover:bg-cyan-50'
            }`}
          >
            Sentence
          </button>
        </div>
      </div>

      {renderCardContent()}
    </div>
  )
}

export default Study


import { useState, useEffect } from 'react'
import { getApi } from '../api/backend'

function Manage() {
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [notes, setNotes] = useState([])
  const [loadingNotes, setLoadingNotes] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoadingNotes(true)
      const api = await getApi()
      const response = await api.get('/notes')
      setNotes(response.data)
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!word.trim() || !translation.trim()) {
      setMessage({ type: 'error', text: 'Please fill in both fields' })
      return
    }

    // Demo mode - show alert instead of creating note
    alert('This is a frontend-only version. To generate new content, please self-host the backend by following the instructions at https://github.com/Samuel-O-M/HackHarvard-2025')
    
    setMessage({ 
      type: 'info', 
      text: 'This is a demo version. Please self-host the backend to add new words.' 
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Words</h1>
        <p className="text-gray-600">Add new words to your learning collection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Word Form */}
        <div>
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Word</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foreign Language Word
                </label>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="e.g., objetivo"
                  className="input-field"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Translation
                </label>
                <input
                  type="text"
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  placeholder="e.g., target"
                  className="input-field"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Note...
                  </span>
                ) : (
                  '+ Add Word'
                )}
              </button>
            </form>

            {/* Message Display */}
            {message.text && (
              <div className={`mt-4 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-100 text-green-800' :
                message.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 bg-gradient-to-br from-cyan-50 to-blue-50 border border-hearsay-cyan rounded-lg p-4">
              <h3 className="font-semibold bg-gradient-to-r from-hearsay-cyan to-hearsay-purple bg-clip-text text-transparent mb-2">What happens when you add a word?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✨ AI generates a contextual sentence</li>
                <li>🔊 Creates 4 audio files (word, translation, sentences)</li>
                <li>📇 Creates 2 flashcards (forward & reverse)</li>
                <li>📊 Schedules with FSRS algorithm</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div>
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Words</h2>
            
            {loadingNotes ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hearsay-blue mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading words...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-gray-600">No words yet. Add your first word!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {notes.map((note) => (
                  <div 
                    key={note.id} 
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-gray-900">
                            {note.word}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-lg font-medium text-gray-600">
                            {note.translation}
                          </span>
                        </div>
                        {note.sentence && (
                          <p className="text-sm text-gray-600 italic">
                            {note.sentence.replace(/\*/g, '')}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 ml-4">
                        #{note.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Words:</span>
                <span className="font-bold text-gray-900">{notes.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Total Cards:</span>
                <span className="font-bold text-gray-900">{notes.length * 2}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Manage


// Frontend-only demo version - uses local dummy data

class LocalBackend {
  constructor() {
    this.data = null
    this.loadingPromise = null
  }

  async loadData() {
    if (this.data) return this.data
    if (this.loadingPromise) return this.loadingPromise

    this.loadingPromise = fetch('/dummy_database.json')
      .then(response => response.json())
      .then(data => {
        this.data = data
        return data
      })

    return this.loadingPromise
  }

  async getStats() {
    const data = await this.loadData()
    return {
      data: {
        total_notes: data.learning_notes.length,
        total_cards: data.cards.length,
        cards: data.cards,
        review_logs: data.review_logs,
        notes: data.learning_notes
      }
    }
  }

  async getWorkloadRetention() {
    // Return empty data for workload retention in demo mode
    return {
      data: {
        data_points: []
      }
    }
  }

  async getNotes() {
    const data = await this.loadData()
    return {
      data: data.learning_notes
    }
  }

  async getNextCard() {
    const data = await this.loadData()
    
    // Find cards that are due (check due date)
    const now = new Date()
    const dueCards = data.cards.filter(card => {
      const dueDate = new Date(card.fsrs_card.due)
      return dueDate <= now
    })

    if (dueCards.length === 0) {
      return {
        data: {
          message: "No cards due for review! All caught up! 🎉"
        }
      }
    }

    // Get a random due card
    const randomIndex = Math.floor(Math.random() * dueCards.length)
    const card = dueCards[randomIndex]
    
    // Find the associated note
    const note = data.learning_notes.find(n => n.id === card.note_id)
    
    return {
      data: {
        ...card,
        note: note
      }
    }
  }

  async submitAnswer(cardId, rating) {
    // In demo mode, just simulate success
    // The card state is not persisted
    return {
      data: {
        message: "Answer recorded (demo mode - not persisted)"
      }
    }
  }

  async createNote(word, translation) {
    // This should not be called in demo mode, but return an error just in case
    throw new Error('Cannot create notes in demo mode')
  }

  async optimizeFSRS() {
    // This should not be called in demo mode, but return an error just in case
    throw new Error('Cannot optimize FSRS in demo mode')
  }

  async pollHardware() {
    // No hardware support in demo mode
    return {
      data: {
        actions: []
      }
    }
  }
}

// Export a singleton instance
export const localBackend = new LocalBackend()

// Export API methods that match the original backend interface
export async function getApi() {
  // Return an axios-like interface
  return {
    get: async (endpoint) => {
      if (endpoint === '/stats') {
        return await localBackend.getStats()
      } else if (endpoint === '/notes') {
        return await localBackend.getNotes()
      } else if (endpoint === '/study/next') {
        return await localBackend.getNextCard()
      } else if (endpoint === '/workload-retention') {
        return await localBackend.getWorkloadRetention()
      } else if (endpoint === '/hardware/poll') {
        return await localBackend.pollHardware()
      }
      throw new Error(`Unknown endpoint: ${endpoint}`)
    },
    post: async (endpoint, data) => {
      if (endpoint === '/study/answer') {
        return await localBackend.submitAnswer(data.card_id, data.rating)
      } else if (endpoint === '/notes') {
        return await localBackend.createNote(data.word, data.translation)
      } else if (endpoint === '/optimize-fsrs') {
        return await localBackend.optimizeFSRS()
      }
      throw new Error(`Unknown endpoint: ${endpoint}`)
    }
  }
}

// Export a convenience method to get backend URL (returns base path for audio)
export async function getBackendUrl() {
  // Return empty string so audio paths work with local files
  return ''
}

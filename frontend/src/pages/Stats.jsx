import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const API_URL = '/api'

function Stats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('simple') // 'simple' or 'advanced'
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [sortOrder, setSortOrder] = useState('asc')
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeMessage, setOptimizeMessage] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const optimizeFSRSParameters = async () => {
    try {
      setOptimizing(true)
      setOptimizeMessage('Optimizing FSRS parameters...')
      const response = await axios.post(`${API_URL}/optimize-fsrs`)
      setOptimizeMessage(response.data.message || 'Parameters optimized successfully!')
      setTimeout(() => setOptimizeMessage(''), 5000)
      await fetchStats()
    } catch (error) {
      console.error('Error optimizing FSRS:', error)
      setOptimizeMessage(error.response?.data?.detail || 'Error optimizing parameters')
    } finally {
      setOptimizing(false)
    }
  }

  const calculateDueCards = () => {
    if (!stats || !stats.cards) return 0
    
    const now = new Date()
    return stats.cards.filter(card => {
      const dueDate = new Date(card.fsrs_card.due)
      return dueDate <= now
    }).length
  }

  const calculateReviewsToday = () => {
    if (!stats || !stats.review_logs) return 0
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return stats.review_logs.filter(log => {
      const reviewDate = new Date(log.review_time)
      reviewDate.setHours(0, 0, 0, 0)
      return reviewDate.getTime() === today.getTime()
    }).length
  }

  const getCardStateDistribution = () => {
    if (!stats || !stats.cards) return { new: 0, learning: 0, review: 0, relearning: 0 }
    
    const distribution = { new: 0, learning: 0, review: 0, relearning: 0 }
    
    stats.cards.forEach(card => {
      const state = card.fsrs_card.state
      if (state === 0) distribution.new++
      else if (state === 1) distribution.learning++
      else if (state === 2) distribution.review++
      else if (state === 3) distribution.relearning++
    })
    
    return distribution
  }

  const getAverageStability = () => {
    if (!stats || !stats.cards || stats.cards.length === 0) return 0
    
    const totalStability = stats.cards.reduce((sum, card) => {
      return sum + (card.fsrs_card.stability || 0)
    }, 0)
    
    return (totalStability / stats.cards.length).toFixed(2)
  }

  const getRecentReviews = () => {
    if (!stats || !stats.review_logs) return []
    
    return [...stats.review_logs]
      .sort((a, b) => new Date(b.review_time) - new Date(a.review_time))
      .slice(0, 10)
  }

  const getRatingDistribution = () => {
    if (!stats || !stats.review_logs) return { 1: 0, 2: 0, 3: 0, 4: 0 }
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 }
    
    stats.review_logs.forEach(log => {
      if (distribution[log.rating] !== undefined) {
        distribution[log.rating]++
      }
    })
    
    return distribution
  }

  // Get enriched card data with note information
  const getEnrichedCards = useMemo(() => {
    if (!stats || !stats.cards || !stats.learning_notes) return []
    
    return stats.cards.map(card => {
      const note = stats.learning_notes.find(n => n.id === card.note_id)
      return {
        ...card,
        note,
        word: note?.word || 'N/A',
        translation: note?.translation || 'N/A'
      }
    })
  }, [stats])

  // Filter and sort cards for advanced view
  const filteredAndSortedCards = useMemo(() => {
    if (!getEnrichedCards.length) return []
    
    let filtered = getEnrichedCards.filter(card => {
      if (!searchTerm) return true
      const search = searchTerm.toLowerCase()
      return (
        card.word.toLowerCase().includes(search) ||
        card.translation.toLowerCase().includes(search) ||
        card.id.toString().includes(search)
      )
    })
    
    filtered.sort((a, b) => {
      let aVal, bVal
      
      switch (sortBy) {
        case 'id':
          aVal = a.id
          bVal = b.id
          break
        case 'word':
          aVal = a.word.toLowerCase()
          bVal = b.word.toLowerCase()
          break
        case 'stability':
          aVal = a.fsrs_card.stability || 0
          bVal = b.fsrs_card.stability || 0
          break
        case 'difficulty':
          aVal = a.fsrs_card.difficulty || 0
          bVal = b.fsrs_card.difficulty || 0
          break
        case 'due':
          aVal = new Date(a.fsrs_card.due).getTime()
          bVal = new Date(b.fsrs_card.due).getTime()
          break
        case 'reps':
          aVal = a.fsrs_card.reps || 0
          bVal = b.fsrs_card.reps || 0
          break
        case 'state':
          aVal = a.fsrs_card.state || 0
          bVal = b.fsrs_card.state || 0
          break
        default:
          aVal = a.id
          bVal = b.id
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    
    return filtered
  }, [getEnrichedCards, searchTerm, sortBy, sortOrder])

  // Calculate workload vs retention data
  const workloadRetentionData = useMemo(() => {
    if (!stats || !stats.cards) return []
    
    const data = []
    const retentionPoints = [0.70, 0.75, 0.80, 0.85, 0.90, 0.95]
    
    retentionPoints.forEach(retention => {
      // Simplified workload calculation
      // In reality, this should use FSRS's actual workload calculation
      // Assuming average reviews per day based on retention
      const avgInterval = retention === 0.90 ? 30 : (1 / (1 - retention)) * 10
      const workload = stats.cards.length / avgInterval
      
      data.push({
        retention: (retention * 100).toFixed(0),
        workload: Math.round(workload),
        color: retention === 0.90 ? '#22c55e' : retention < 0.90 ? '#ef4444' : '#3b82f6'
      })
    })
    
    return data
  }, [stats])

  const getStateName = (state) => {
    const states = ['New', 'Learning', 'Review', 'Relearning']
    return states[state] || 'Unknown'
  }

  const getStateColor = (state) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-yellow-100 text-yellow-800', 'bg-green-100 text-green-800', 'bg-red-100 text-red-800']
    return colors[state] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load statistics</p>
      </div>
    )
  }

  const cardStates = getCardStateDistribution()
  const ratingDist = getRatingDistribution()
  const recentReviews = getRecentReviews()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Statistics</h1>
          <p className="text-gray-600">Track your learning progress and performance</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">View:</label>
          <select 
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="simple">Simple</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {viewMode === 'simple' ? renderSimpleView() : renderAdvancedView()}
    </div>
  )

  function renderSimpleView() {
    return (
      <>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm font-medium opacity-90 mb-2">Total Words</div>
          <div className="text-4xl font-bold">{stats.learning_notes.length}</div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm font-medium opacity-90 mb-2">Total Cards</div>
          <div className="text-4xl font-bold">{stats.cards.length}</div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm font-medium opacity-90 mb-2">Due Today</div>
          <div className="text-4xl font-bold">{calculateDueCards()}</div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="text-sm font-medium opacity-90 mb-2">Reviews Today</div>
          <div className="text-4xl font-bold">{calculateReviewsToday()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Card States */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Card States</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="font-medium text-gray-900">New</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{cardStates.new}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="font-medium text-gray-900">Learning</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{cardStates.learning}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="font-medium text-gray-900">Review</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{cardStates.review}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="font-medium text-gray-900">Relearning</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{cardStates.relearning}</span>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Rating Distribution</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">😰</span>
                <span className="font-medium text-gray-900">Again</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{ratingDist[1]}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">😕</span>
                <span className="font-medium text-gray-900">Hard</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">{ratingDist[2]}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🙂</span>
                <span className="font-medium text-gray-900">Good</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{ratingDist[3]}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">😄</span>
                <span className="font-medium text-gray-900">Easy</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{ratingDist[4]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Metrics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Total Reviews</span>
              <span className="text-xl font-bold text-gray-900">{stats.review_logs.length}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Average Stability</span>
              <span className="text-xl font-bold text-gray-900">{getAverageStability()} days</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Retention Rate</span>
              <span className="text-xl font-bold text-gray-900">
                {stats.review_logs.length > 0 
                  ? Math.round(((ratingDist[3] + ratingDist[4]) / stats.review_logs.length) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Reviews</h2>
          {recentReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews yet. Start studying!
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentReviews.map((review, index) => {
                const ratingEmoji = ['', '😰', '😕', '🙂', '😄'][review.rating]
                const ratingColor = ['', 'text-red-600', 'text-orange-600', 'text-blue-600', 'text-green-600'][review.rating]
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{ratingEmoji}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Card #{review.card_id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(review.review_time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold ${ratingColor}`}>
                      {['', 'Again', 'Hard', 'Good', 'Easy'][review.rating]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      </>
    )
  }

  function renderAdvancedView() {
    const maxWorkload = Math.max(...workloadRetentionData.map(d => d.workload), 1)
    
    return (
      <>
        {/* Advanced Statistics */}
        <div className="space-y-8">
          {/* FSRS Optimization Section */}
          <div className="card bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">FSRS Parameters Optimization</h2>
                <p className="text-gray-600">Optimize the spaced repetition algorithm based on your review history</p>
              </div>
              <button
                onClick={optimizeFSRSParameters}
                disabled={optimizing || !stats.review_logs || stats.review_logs.length < 10}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {optimizing ? 'Optimizing...' : 'Optimize Parameters'}
              </button>
            </div>
            {optimizeMessage && (
              <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded-lg">
                {optimizeMessage}
              </div>
            )}
            {stats.review_logs && stats.review_logs.length < 10 && (
              <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                ⚠️ Need at least 10 reviews to optimize parameters. Current: {stats.review_logs.length}
              </div>
            )}
          </div>

          {/* Workload vs Retention Graph */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Workload vs Retention</h2>
            <p className="text-gray-600 mb-6">
              Expected daily reviews for different retention targets. Green indicates optimal retention (90%).
            </p>
            
            <div className="space-y-4">
              {workloadRetentionData.map((point, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Retention: {point.retention}%
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {point.workload} reviews/day
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full flex items-center justify-end px-3 text-white text-sm font-bold transition-all"
                      style={{
                        width: `${(point.workload / maxWorkload) * 100}%`,
                        backgroundColor: point.color,
                        minWidth: point.workload > 0 ? '50px' : '0'
                      }}
                    >
                      {point.workload > 0 && point.workload}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Legend:</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-red-500 mr-2"></div>
                  <span>Low Retention (&lt;90%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
                  <span>Optimal (90%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
                  <span>High Retention (&gt;90%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Details Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Cards - FSRS Data</h2>
              <span className="text-sm text-gray-600">
                Showing {filteredAndSortedCards.length} of {stats.cards.length} cards
              </span>
            </div>

            {/* Search and Sort Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by word, translation, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="id">ID</option>
                  <option value="word">Word</option>
                  <option value="stability">Stability</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="due">Due Date</option>
                  <option value="reps">Repetitions</option>
                  <option value="state">State</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Translation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stability</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reps</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lapses</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedCards.map((card) => {
                    const fsrs = card.fsrs_card
                    const isDue = new Date(fsrs.due) <= new Date()
                    
                    return (
                      <tr key={card.id} className={isDue ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {card.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {card.word}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {card.translation}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {card.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStateColor(fsrs.state)}`}>
                            {getStateName(fsrs.state)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {fsrs.stability?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {fsrs.difficulty?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {fsrs.reps || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {fsrs.lapses || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex flex-col">
                            <span>{new Date(fsrs.due).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(fsrs.due).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredAndSortedCards.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No cards found matching your search.
                </div>
              )}
            </div>
          </div>

          {/* Additional FSRS Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Stability:</span>
                  <span className="font-bold">{getAverageStability()} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Difficulty:</span>
                  <span className="font-bold">
                    {stats.cards.length > 0 
                      ? (stats.cards.reduce((sum, c) => sum + (c.fsrs_card.difficulty || 0), 0) / stats.cards.length).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Reps:</span>
                  <span className="font-bold">
                    {stats.cards.length > 0 
                      ? (stats.cards.reduce((sum, c) => sum + (c.fsrs_card.reps || 0), 0) / stats.cards.length).toFixed(1)
                      : '0.0'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Counts</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Reps:</span>
                  <span className="font-bold">
                    {stats.cards.reduce((sum, c) => sum + (c.fsrs_card.reps || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Lapses:</span>
                  <span className="font-bold">
                    {stats.cards.reduce((sum, c) => sum + (c.fsrs_card.lapses || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Reviews:</span>
                  <span className="font-bold">{stats.review_logs.length}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cards Due:</span>
                  <span className="font-bold text-red-600">{calculateDueCards()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cards:</span>
                  <span className="font-bold">{stats.cards.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Words:</span>
                  <span className="font-bold">{stats.learning_notes.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default Stats


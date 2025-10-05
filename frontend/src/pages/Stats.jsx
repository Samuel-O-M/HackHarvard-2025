import { useState, useEffect, useMemo } from 'react'
import { getApi } from '../api/backend'

function Stats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('simple') // 'simple' or 'advanced'
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [sortOrder, setSortOrder] = useState('asc')
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeMessage, setOptimizeMessage] = useState('')
  const [workloadData, setWorkloadData] = useState([])
  const [loadingWorkload, setLoadingWorkload] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchWorkloadData()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const api = await getApi()
      const response = await api.get('/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkloadData = async () => {
    try {
      setLoadingWorkload(true)
      const api = await getApi()
      const response = await api.get('/workload-retention')
      setWorkloadData(response.data.data_points || [])
    } catch (error) {
      console.error('Error fetching workload data:', error)
      setWorkloadData([])
    } finally {
      setLoadingWorkload(false)
    }
  }

  const optimizeFSRSParameters = async () => {
    try {
      setOptimizing(true)
      setOptimizeMessage('Optimizing FSRS parameters...')
      const api = await getApi()
      const response = await api.post('/optimize-fsrs')
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

  // Calculate retrievability using FSRS formula
  const calculateRetrievability = (fsrsCard) => {
    try {
      const now = new Date()
      const due = new Date(fsrsCard.due)
      const stability = fsrsCard.stability || 0
      
      if (stability === 0) return 0
      
      // FSRS retrievability formula: R = (1 + (t - due) / (9 * S))^(-1)
      // where t is current time, due is due date, and S is stability
      const timeDiff = (now - due) / (1000 * 60 * 60 * 24) // Convert to days
      const retrievability = Math.pow(1 + timeDiff / (9 * stability), -1)
      
      // Clamp between 0 and 1
      return Math.max(0, Math.min(1, retrievability))
    } catch (error) {
      return 0
    }
  }

  // Calculate mastery score (retrievability * stability)
  const calculateMasteryScore = (fsrsCard) => {
    const retrievability = calculateRetrievability(fsrsCard)
    const stability = fsrsCard.stability || 0
    return retrievability * stability
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
      const masteryScore = calculateMasteryScore(card.fsrs_card)
      return {
        ...card,
        note,
        word: note?.word || 'N/A',
        translation: note?.translation || 'N/A',
        masteryScore
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
        case 'mastery':
          aVal = a.masteryScore || 0
          bVal = b.masteryScore || 0
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

  // Get color for retention level (based on workload efficiency)
  const getRetentionColor = (retention) => {
    if (retention <= 0.90) return '#22c55e' // Green for sustainable/efficient (<=90%)
    if (retention <= 0.95) return '#fbbf24' // Yellow for moderate cost (90-95%)
    return '#ef4444' // Red for high-cost/diminishing returns (>95%)
  }

  // Get zone label for retention level
  const getRetentionZone = (retention) => {
    if (retention <= 0.90) return 'Sustainable Zone'
    if (retention <= 0.95) return 'Efficiency Frontier'
    return 'High-Cost Zone'
  }

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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-hearsay-blue mx-auto mb-4"></div>
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hearsay-blue focus:border-transparent"
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
        <div className="card bg-gradient-to-br from-hearsay-cyan to-hearsay-blue text-white">
          <div className="text-sm font-medium opacity-90 mb-2">Total Words</div>
          <div className="text-4xl font-bold">{stats.learning_notes.length}</div>
        </div>

        <div className="card bg-gradient-to-br from-hearsay-blue to-hearsay-purple text-white">
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
            <div className="flex items-center justify-between p-4 bg-cyan-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-hearsay-cyan rounded-full mr-3"></div>
                <span className="font-medium text-gray-900">New</span>
              </div>
              <span className="text-2xl font-bold text-hearsay-cyan">{cardStates.new}</span>
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
              <span className="text-2xl font-bold text-hearsay-blue">{ratingDist[3]}</span>
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
    const maxWorkload = workloadData.length > 0 
      ? Math.max(...workloadData.map(d => d.workload), 1)
      : 1
    
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
              The cost of memory: This curve shows how much daily effort (reviews per day) is required 
              to maintain different retention targets. Higher retention requires exponentially more reviews 
              as you fight against your brain's natural forgetting curve.
            </p>
            
            {loadingWorkload ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hearsay-blue"></div>
              </div>
            ) : workloadData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No data available. Add some cards to see the workload curve.
              </div>
            ) : (
              <>
                {/* SVG Graph */}
                <div className="relative w-full" style={{ height: '400px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
                    {/* Define gradient zones */}
                    <defs>
                      <linearGradient id="workloadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#22c55e" stopOpacity="0.2" />
                        <stop offset="75%" stopColor="#fbbf24" stopOpacity="0.2" />
                        <stop offset="85%" stopColor="#ef4444" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    
                    {/* Background zones */}
                    <rect x="50" y="20" width="700" height="320" fill="url(#workloadGradient)" />
                    
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <line 
                        key={`grid-${i}`}
                        x1="50" 
                        y1={20 + (i * 320/5)} 
                        x2="750" 
                        y2={20 + (i * 320/5)} 
                        stroke="#e5e7eb" 
                        strokeWidth="1"
                      />
                    ))}
                    
                    {/* Y-axis labels */}
                    {[0, 1, 2, 3, 4, 5].map(i => {
                      const value = Math.round(maxWorkload * (5 - i) / 5)
                      return (
                        <text 
                          key={`y-label-${i}`}
                          x="40" 
                          y={25 + (i * 320/5)} 
                          textAnchor="end" 
                          fontSize="12" 
                          fill="#6b7280"
                        >
                          {value}
                        </text>
                      )
                    })}
                    
                    {/* X-axis labels */}
                    {workloadData.map((point, index) => {
                      if (index % 2 === 0) { // Show every other label to avoid crowding
                        const x = 50 + (index / (workloadData.length - 1)) * 700
                        return (
                          <text 
                            key={`x-label-${index}`}
                            x={x} 
                            y="360" 
                            textAnchor="middle" 
                            fontSize="12" 
                            fill="#6b7280"
                          >
                            {(point.retention * 100).toFixed(0)}%
                          </text>
                        )
                      }
                      return null
                    })}
                    
                    {/* Axis labels */}
                    <text x="400" y="395" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">
                      Desired Retention
                    </text>
                    <text 
                      x="20" 
                      y="200" 
                      textAnchor="middle" 
                      fontSize="14" 
                      fontWeight="bold" 
                      fill="#374151"
                      transform="rotate(-90 20 200)"
                    >
                      Daily Workload (Reviews/Day)
                    </text>
                    
                    {/* Draw the curve */}
                    <path
                      d={workloadData.map((point, index) => {
                        const x = 50 + (index / (workloadData.length - 1)) * 700
                        const y = 340 - ((point.workload / maxWorkload) * 320)
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Draw area under curve */}
                    <path
                      d={
                        workloadData.map((point, index) => {
                          const x = 50 + (index / (workloadData.length - 1)) * 700
                          const y = 340 - ((point.workload / maxWorkload) * 320)
                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                        }).join(' ') + 
                        ` L 750 340 L 50 340 Z`
                      }
                      fill="#3b82f6"
                      fillOpacity="0.1"
                    />
                    
                    {/* Draw points */}
                    {workloadData.map((point, index) => {
                      const x = 50 + (index / (workloadData.length - 1)) * 700
                      const y = 340 - ((point.workload / maxWorkload) * 320)
                      const color = getRetentionColor(point.retention)
                      
                      return (
                        <g key={`point-${index}`}>
                          <circle 
                            cx={x} 
                            cy={y} 
                            r="5" 
                            fill={color}
                            stroke="white"
                            strokeWidth="2"
                          />
                        </g>
                      )
                    })}
                  </svg>
                </div>

                {/* Data table */}
                <div className="mt-8 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retention</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daily Workload</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workloadData.map((point, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {(point.retention * 100).toFixed(0)}%
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {point.workload.toFixed(1)} reviews/day
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span 
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ 
                                backgroundColor: getRetentionColor(point.retention) + '33',
                                color: getRetentionColor(point.retention)
                              }}
                            >
                              {getRetentionZone(point.retention)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Understanding the Curve:</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p className="font-medium text-gray-900">
                  Key Insight: Higher retention targets require MORE frequent reviews, resulting in higher daily workload.
                </p>
                <div className="flex items-start">
                  <div className="w-4 h-4 rounded bg-green-500 mr-3 mt-0.5 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium">Sustainable Zone (≤90%):</span> Balanced approach where you allow some 
                    forgetting in exchange for manageable daily workload. Most efficient for long-term learning. 
                    The "sweet spot" for most learners.
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-4 h-4 rounded bg-yellow-500 mr-3 mt-0.5 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium">Efficiency Frontier (90-95%):</span> Pursuing higher retention means 
                    more frequent reviews. Each percentage point starts to cost significantly more daily effort. 
                    Suitable for exam preparation or high-stakes material.
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-4 h-4 rounded bg-red-500 mr-3 mt-0.5 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium">High-Cost Zone (&gt;95%):</span> Near-perfect retention requires 
                    extremely frequent reviews. Each additional percentage point demands exponentially more time. 
                    The law of diminishing returns makes this unsustainable for most learners.
                  </div>
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hearsay-blue"
                >
                  <option value="id">ID</option>
                  <option value="word">Word</option>
                  <option value="mastery">Mastery Score</option>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mastery</th>
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`font-bold ${
                            card.masteryScore > 5 ? 'text-green-600' :
                            card.masteryScore > 2 ? 'text-blue-600' :
                            card.masteryScore > 0.5 ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {card.masteryScore.toFixed(2)}
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
                  <span className="text-gray-600">Avg Mastery:</span>
                  <span className="font-bold text-hearsay-blue">
                    {getEnrichedCards.length > 0 
                      ? (getEnrichedCards.reduce((sum, c) => sum + (c.masteryScore || 0), 0) / getEnrichedCards.length).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
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


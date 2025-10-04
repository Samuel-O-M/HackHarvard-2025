import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = '/api'

function Stats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Statistics</h1>
        <p className="text-gray-600">Track your learning progress and performance</p>
      </div>

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
    </div>
  )
}

export default Stats


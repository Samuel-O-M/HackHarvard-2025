import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Stats from './pages/Stats'
import Manage from './pages/Manage'
import Study from './pages/Study'

function Navigation() {
  const location = useLocation()
  
  const isActive = (path) => location.pathname === path
  
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Language Learning</h1>
          <div className="flex space-x-4">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Study
            </Link>
            <Link 
              to="/stats" 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/stats') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Stats
            </Link>
            <Link 
              to="/manage" 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/manage') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Manage
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Study />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/manage" element={<Manage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App


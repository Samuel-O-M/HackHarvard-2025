import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { getApi } from './api/backend'
import Landing from './pages/Landing'
import Stats from './pages/Stats'
import Manage from './pages/Manage'
import Study from './pages/Study'
import logo from './img/hearsey-logo.png'

// Hook to notify backend of current page (for hardware control)
function usePageTracking() {
  const location = useLocation()
  
  useEffect(() => {
    const notifyBackend = async () => {
      try {
        const api = await getApi()
        
        // Map routes to page names
        let pageName = 'study'
        if (location.pathname === '/app/stats') {
          pageName = 'stats'
        } else if (location.pathname === '/app/manage') {
          pageName = 'manage'
        }
        
        // Notify backend of current page
        await api.post('/hardware/page', { page: pageName })
      } catch (error) {
        // Silently fail if backend is not available
        console.log('Could not notify backend of page change:', error.message)
      }
    }
    
    notifyBackend()
  }, [location])
}

function Navigation() {
  const location = useLocation()
  
  // Track page changes for hardware
  usePageTracking()
  
  const isActive = (path) => location.pathname === path
  
  return (
    <nav className="bg-white shadow-md border-b border-gray-100">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Hearsay" className="w-10 h-10" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-hearsay-cyan via-hearsay-blue to-hearsay-purple bg-clip-text text-transparent">
              Hearsay
            </h1>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex space-x-4">
            <Link 
              to="/app" 
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/app') 
                  ? 'bg-gradient-to-r from-hearsay-cyan to-hearsay-blue text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-hearsay-cyan hover:to-hearsay-blue hover:text-white'
              }`}
            >
              Study
            </Link>
            <Link 
              to="/app/stats" 
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/app/stats') 
                  ? 'bg-gradient-to-r from-hearsay-cyan to-hearsay-blue text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-hearsay-cyan hover:to-hearsay-blue hover:text-white'
              }`}
            >
              Stats
            </Link>
            <Link 
              to="/app/manage" 
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/app/manage') 
                  ? 'bg-gradient-to-r from-hearsay-cyan to-hearsay-blue text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-hearsay-cyan hover:to-hearsay-blue hover:text-white'
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

function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Navigation />
      <main className="container mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Study />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/manage" element={<Manage />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app/*" element={<AppLayout />} />
      </Routes>
    </Router>
  )
}

export default App


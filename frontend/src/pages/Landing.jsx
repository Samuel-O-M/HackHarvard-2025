import { useNavigate } from 'react-router-dom'
import logo from '../img/hearsey-logo.png'

function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-6">
      <div className="max-w-6xl w-full">
        <div className="flex items-center justify-center gap-16 mb-32">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src={logo} 
              alt="Hearsay Logo" 
              className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl"
            />
          </div>
          
          {/* Branding */}
          <div className="flex flex-col justify-center">
            <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-cyan-500 via-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
              HEARSAY
            </h1>
            <p className="text-2xl md:text-3xl text-blue-400 font-light tracking-wide">
              Language, universally connected.
            </p>
          </div>
        </div>
        
        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/app')}
            className="group text-2xl text-blue-400 hover:text-purple-500 transition-all duration-300 flex items-center gap-2"
          >
            <span className="font-light">Click to continue</span>
            <span className="transform group-hover:translate-x-2 transition-transform duration-300">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Landing


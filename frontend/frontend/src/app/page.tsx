'use client';

import Image from "next/image";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StatsModal from '../components/ui/StatsModal';
import AddModal from '../components/ui/AddModal';

export default function Home() {
  const [showStats, setShowStats] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showDashboard = searchParams.get('page') === 'dashboard';

  return (
    <main className="min-h-screen bg-white relative">
      {!showDashboard ? (
        /* Initial Splash Screen */
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          {/* Logo/Brand Area */}
          <div className="text-center mb-12">
            <div className="w-36 h-36 mb-6 mx-auto relative">
              <div className="rounded-full overflow-hidden shadow-lg border-4 border-cyan-400">
                <Image src="/logo.png" alt="EchoMine logo" width={144} height={144} className="object-cover w-36 h-36" />
              </div>
            </div>
            <div className="mb-2">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">EchoMine</h1>
              <p className="text-sm md:text-base text-gray-500 mt-2">A voice-driven, screenless language mining platform.</p>
            </div>
          </div>

          {/* Main CTA Button */} 
          <button 
            onClick={() => router.push('/?page=dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-12 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 mb-16"
          >
            Let's Get Started
          </button>


        </div>
      
      ) : (
        /* Dashboard with Stats and Add buttons */
        <div>


          {/* Stats and Add Buttons */}
          <div className="absolute top-8 left-0 right-0 flex justify-between items-center px-16 max-w-4xl mx-auto z-10">
            <button 
              onClick={() => setShowStats(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-full shadow-md transition-all duration-200"
            >
              📊 Stats
            </button>
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-full shadow-md transition-all duration-200"
            >
              ➕ Add
            </button>
          </div>

          {/* Dashboard Content */}
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Welcome to Dashboard
              </h1>
              <p className="text-gray-600 mb-8">
                Click on Stats or Add buttons above to get started!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
    </main>
  )
}

import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ResearchJourney from './pages/ResearchJourney'
import axios from 'axios'

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8000'

function App() {
  const [sessionId, setSessionId] = useState(null)

  useEffect(() => {
    // Generate or retrieve session ID
    const existingSessionId = localStorage.getItem('researchSessionId')
    if (existingSessionId) {
      setSessionId(existingSessionId)
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('researchSessionId', newSessionId)
      setSessionId(newSessionId)
    }
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home sessionId={sessionId} />} />
          <Route path="/journey" element={<ResearchJourney sessionId={sessionId} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App



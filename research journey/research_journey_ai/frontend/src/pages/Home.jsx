import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Home = ({ sessionId }) => {
  const navigate = useNavigate()
  const [studentName, setStudentName] = useState('')
  const [areaOfInterest, setAreaOfInterest] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleStartJourney = async (e) => {
    e.preventDefault()
    if (!studentName.trim() || !areaOfInterest.trim()) {
      alert('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      // Create or update session
      await axios.post('/sessions', {
        session_id: sessionId,
        student_name: studentName,
        area_of_interest: areaOfInterest
      })

      // Navigate to research journey
      navigate('/journey')
    } catch (error) {
      console.error('Error starting journey:', error)
      alert('Error starting your research journey. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              AI-Powered Research Journey
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your intelligent companion for navigating your first research experience. 
              Get personalized guidance, literature reviews, and proposal writing assistance.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Topic Discovery</h3>
              <p className="text-gray-600">AI-powered topic suggestions tailored to your interests</p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Literature Review</h3>
              <p className="text-gray-600">Automated literature summaries and key paper recommendations</p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Proposal Writing</h3>
              <p className="text-gray-600">Step-by-step guidance for crafting your research proposal</p>
            </div>
          </div>

          {/* Start Form */}
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Start Your Research Journey</h2>
            <form onSubmit={handleStartJourney} className="space-y-6">
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label htmlFor="areaOfInterest" className="block text-sm font-medium text-gray-700 mb-2">
                  Area of Interest
                </label>
                <input
                  type="text"
                  id="areaOfInterest"
                  value={areaOfInterest}
                  onChange={(e) => setAreaOfInterest(e.target.value)}
                  className="input-field"
                  placeholder="e.g., AI in agriculture, renewable energy, healthcare technology"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Describe the general area you're interested in researching
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Starting Journey...' : 'Begin My Research Journey'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500">
            <p>Powered by Gemini AI • Built for Researchers • Designed for Success</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

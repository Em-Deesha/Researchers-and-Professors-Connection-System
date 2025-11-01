import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TopicSelector from '../components/TopicSelector'
import LiteratureReview from '../components/LiteratureReview'
import ProposalBuilder from '../components/ProposalBuilder'
import ProgressSaver from '../components/ProgressSaver'
import axios from 'axios'

const ResearchJourney = ({ sessionId }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [sessionData, setSessionData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const steps = [
    { id: 1, title: 'Choose Topic', description: 'Select your research focus' },
    { id: 2, title: 'Literature Review', description: 'Explore existing research' },
    { id: 3, title: 'Write Proposal', description: 'Craft your research proposal' },
    { id: 4, title: 'Save Progress', description: 'Save and download your work' }
  ]

  useEffect(() => {
    loadSessionData()
  }, [sessionId])

  const loadSessionData = async () => {
    try {
      const response = await axios.get(`/sessions/${sessionId}`)
      setSessionData(response.data)
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSessionData = async (updates) => {
    try {
      await axios.put(`/sessions/${sessionId}`, updates)
      setSessionData(prev => ({ ...prev, ...updates }))
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your research journey...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Research Journey</h1>
              <p className="text-gray-600">Welcome, {sessionData?.student_name || 'Student'}</p>
            </div>
            <div className="text-sm text-gray-500">
              Session: {sessionId?.slice(-8)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`step-indicator ${
                    currentStep === step.id ? 'step-active' :
                    currentStep > step.id ? 'step-completed' : 'step-pending'
                  }`}>
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 mx-4 hidden sm:block"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <TopicSelector
                sessionData={sessionData}
                onUpdate={updateSessionData}
                onNext={nextStep}
              />
            )}
            {currentStep === 2 && (
              <LiteratureReview
                sessionData={sessionData}
                onUpdate={updateSessionData}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === 3 && (
              <ProposalBuilder
                sessionData={sessionData}
                onUpdate={updateSessionData}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === 4 && (
              <ProgressSaver
                sessionData={sessionData}
                onUpdate={updateSessionData}
                onPrev={prevStep}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ResearchJourney



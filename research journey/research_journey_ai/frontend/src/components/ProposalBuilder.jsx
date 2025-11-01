import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const ProposalBuilder = ({ sessionData, onUpdate, onNext, onPrev }) => {
  const [proposal, setProposal] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editableProposal, setEditableProposal] = useState({
    title: '',
    abstract: '',
    objectives: '',
    methodology: ''
  })

  useEffect(() => {
    if (sessionData?.selected_topic && !proposal) {
      generateProposal()
    }
  }, [sessionData])

  const generateProposal = async () => {
    if (!sessionData?.selected_topic) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await axios.post('/generate-proposal', {
        topic: sessionData.selected_topic,
        research_questions: sessionData.research_questions || 'General research questions'
      })
      const proposalData = response.data.proposal
      setProposal(proposalData)
      setEditableProposal(proposalData)
    } catch (error) {
      console.error('Error generating proposal:', error)
      setError('Failed to generate research proposal. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setEditableProposal(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    onUpdate({
      proposal_title: editableProposal.title,
      proposal_abstract: editableProposal.abstract,
      proposal_objectives: editableProposal.objectives,
      proposal_methodology: editableProposal.methodology
    })
  }

  const handleNext = () => {
    handleSave()
    onNext()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Research Proposal Builder</h2>
          <p className="text-gray-600">
            AI-generated research proposal for: <strong>{sessionData?.selected_topic}</strong>
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">AI is crafting your research proposal...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={generateProposal}
              className="mt-2 btn-primary text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {proposal && !isLoading && (
          <div className="space-y-8">
            {/* Proposal Title */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Research Title
              </label>
              <textarea
                value={editableProposal.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
                placeholder="Enter your research title"
              />
            </div>

            {/* Abstract */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Abstract
              </label>
              <textarea
                value={editableProposal.abstract}
                onChange={(e) => handleInputChange('abstract', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={6}
                placeholder="Enter your research abstract"
              />
              <p className="text-sm text-gray-500 mt-2">
                A good abstract should be 150-200 words and include background, objectives, methodology, and expected outcomes.
              </p>
            </div>

            {/* Research Objectives */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Research Objectives
              </label>
              <textarea
                value={editableProposal.objectives}
                onChange={(e) => handleInputChange('objectives', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={5}
                placeholder="List your specific research objectives"
              />
              <p className="text-sm text-gray-500 mt-2">
                Each objective should be specific, measurable, achievable, relevant, and time-bound (SMART).
              </p>
            </div>

            {/* Methodology */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Methodology
              </label>
              <textarea
                value={editableProposal.methodology}
                onChange={(e) => handleInputChange('methodology', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={6}
                placeholder="Describe your research methodology"
              />
              <p className="text-sm text-gray-500 mt-2">
                Include research design, data collection methods, analysis techniques, timeline, and required resources.
              </p>
            </div>

            {/* Professor Contact Guidance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                💡 Next Steps: Contacting Professors
              </h3>
              <div className="text-blue-800 space-y-3">
                <p><strong>1. Find Relevant Professors:</strong> Look for faculty members whose research aligns with your topic.</p>
                <p><strong>2. Prepare Your Pitch:</strong> Use your proposal to explain your research interests clearly.</p>
                <p><strong>3. Send Professional Emails:</strong> Be concise, specific, and show genuine interest in their work.</p>
                <p><strong>4. Follow Up:</strong> If you don't hear back in 1-2 weeks, send a polite follow-up email.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button onClick={onPrev} className="btn-secondary">
            Back to Literature Review
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="btn-secondary"
            >
              Save Draft
            </button>
            <button
              onClick={handleNext}
              className="btn-primary"
            >
              Continue to Save Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProposalBuilder



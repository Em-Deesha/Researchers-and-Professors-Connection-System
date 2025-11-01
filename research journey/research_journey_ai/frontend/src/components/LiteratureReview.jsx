import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const LiteratureReview = ({ sessionData, onUpdate, onNext, onPrev }) => {
  const [literatureSummary, setLiteratureSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (sessionData?.selected_topic && !literatureSummary) {
      generateLiteratureSummary()
    }
  }, [sessionData])

  const generateLiteratureSummary = async () => {
    if (!sessionData?.selected_topic) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await axios.post('/literature-summary', {
        selected_topic: sessionData.selected_topic
      })
      setLiteratureSummary(response.data.literature_summary)
    } catch (error) {
      console.error('Error generating literature summary:', error)
      setError('Failed to generate literature summary. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (literatureSummary) {
      onUpdate({ literature_summary: literatureSummary.summary })
      onNext()
    } else {
      alert('Please wait for the literature summary to load')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Literature Review</h2>
          <p className="text-gray-600">
            AI-generated literature summary for: <strong>{sessionData?.selected_topic}</strong>
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">AI is analyzing research papers and generating a literature review...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={generateLiteratureSummary}
              className="mt-2 btn-primary text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {literatureSummary && !isLoading && (
          <div className="space-y-8">
            {/* Literature Summary */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Literature Summary</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {literatureSummary.summary}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Papers */}
            {literatureSummary.key_papers && (
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Key Papers to Read</h3>
                <div className="space-y-4">
                  {literatureSummary.key_papers.map((paper, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {paper.title}
                          </h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Authors:</strong> {paper.authors}</p>
                            <p><strong>Year:</strong> {paper.year}</p>
                            <p><strong>Relevance:</strong> {paper.relevance}</p>
                          </div>
                        </div>
                        <div className="ml-4">
                          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            Read Abstract
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Research Questions */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Your Research Questions</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-800 mb-4">
                  Based on the literature review, consider these refined research questions:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-blue-600 text-sm font-medium">1</span>
                    </div>
                    <p className="text-blue-700">
                      How can the latest AI techniques be applied to improve efficiency in your chosen area?
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-blue-600 text-sm font-medium">2</span>
                    </div>
                    <p className="text-blue-700">
                      What are the current limitations and challenges in this research area?
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-blue-600 text-sm font-medium">3</span>
                    </div>
                    <p className="text-blue-700">
                      How can your research contribute to solving real-world problems in this domain?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button onClick={onPrev} className="btn-secondary">
            Back to Topic Selection
          </button>
          <button
            onClick={handleNext}
            disabled={!literatureSummary}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Proposal Writing
          </button>
        </div>
      </div>
    </div>
  )
}

export default LiteratureReview



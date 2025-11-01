import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const TopicSelector = ({ sessionData, onUpdate, onNext }) => {
  const [selectedTopic, setSelectedTopic] = useState('')
  const [suggestions, setSuggestions] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (sessionData?.area_of_interest && !suggestions) {
      generateSuggestions()
    }
  }, [sessionData])

  const generateSuggestions = async () => {
    if (!sessionData?.area_of_interest) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await axios.post('/suggest-topic', {
        area_of_interest: sessionData.area_of_interest
      })
      setSuggestions(response.data.suggestions)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      setError('Failed to generate topic suggestions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic)
    onUpdate({ selected_topic: topic.title })
  }

  const handleNext = () => {
    if (selectedTopic) {
      onNext()
    } else {
      alert('Please select a topic to continue')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Research Topic</h2>
          <p className="text-gray-600">
            Based on your interest in <strong>{sessionData?.area_of_interest}</strong>, 
            here are some refined research topics to consider:
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">AI is analyzing your interests and generating topic suggestions...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={generateSuggestions}
              className="mt-2 btn-primary text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {suggestions && !isLoading && (
          <div className="space-y-6">
            {suggestions.topics?.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                  selectedTopic === topic.title
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
                onClick={() => handleTopicSelect(topic)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {topic.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{topic.explanation}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords:</h4>
                        <div className="flex flex-wrap gap-2">
                          {topic.keywords?.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Research Questions:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {topic.questions?.map((question, idx) => (
                            <li key={idx}>{question}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedTopic === topic.title
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedTopic === topic.title && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-8">
          <div></div>
          <button
            onClick={handleNext}
            disabled={!selectedTopic}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Literature Review
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopicSelector



import React, { useState, useEffect } from 'react'
import { Server, Check, X, Loader } from 'lucide-react'
import axios from 'axios'

const BackendConfig = ({ onConfigured }) => {
  const [backendUrl, setBackendUrl] = useState('')
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState(null) // 'success', 'error', null
  const [error, setError] = useState('')

  useEffect(() => {
    // Load saved backend URL from localStorage
    const saved = localStorage.getItem('backendUrl')
    if (saved) {
      setBackendUrl(saved)
      testConnection(saved, true)
    } else {
      // Default to environment variable or localhost
      const defaultUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      setBackendUrl(defaultUrl)
    }
  }, [])

  const testConnection = async (url, silent = false) => {
    if (!url) return

    setTesting(true)
    setError('')
    setStatus(null)

    try {
      const response = await axios.get(`${url}/api/health`, { timeout: 5000 })
      
      if (response.data.status === 'healthy') {
        setStatus('success')
        
        // Save to localStorage
        localStorage.setItem('backendUrl', url)
        
        // Update axios baseURL
        axios.defaults.baseURL = url
        
        if (!silent) {
          setTimeout(() => {
            if (onConfigured) onConfigured(url)
          }, 500)
        }
      } else {
        throw new Error('Backend returned unhealthy status')
      }
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Cannot connect to backend')
      console.error('Backend connection test failed:', err)
    } finally {
      setTesting(false)
    }
  }

  const handleTest = () => {
    testConnection(backendUrl)
  }

  const handleSave = () => {
    if (status === 'success') {
      if (onConfigured) onConfigured(backendUrl)
    } else {
      testConnection(backendUrl)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <Server className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Backend Configuration
        </h2>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Enter your Raspberry Pi backend IP address and port
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Backend URL
          </label>
          <input
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="http://192.168.1.100:5000"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Example: http://192.168.1.100:5000
          </p>
        </div>

        {status && (
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            status === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {status === 'success' ? (
              <>
                <Check className="w-5 h-5" />
                <span className="text-sm">Connected successfully!</span>
              </>
            ) : (
              <>
                <X className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </>
            )}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleTest}
            disabled={testing || !backendUrl}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {testing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <span>Test Connection</span>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={testing || !backendUrl}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
          >
            {status === 'success' ? 'Continue' : 'Save & Test'}
          </button>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Tip:</strong> To find your Raspberry Pi's IP address, run <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">hostname -I</code> on the Pi
        </p>
      </div>
    </div>
  )
}

export default BackendConfig

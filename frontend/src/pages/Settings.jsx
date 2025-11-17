import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Server, Check, X, Loader, RefreshCw } from 'lucide-react'
import axios from 'axios'

const Settings = () => {
  const navigate = useNavigate()
  const [backendUrl, setBackendUrl] = useState('')
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [backendInfo, setBackendInfo] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('backendUrl') || axios.defaults.baseURL
    setBackendUrl(saved)
    testConnection(saved, true)
  }, [])

  const testConnection = async (url, silent = false) => {
    if (!url) return

    setTesting(true)
    setError('')
    setStatus(null)
    setBackendInfo(null)

    try {
      const response = await axios.get(`${url}/api/health`, { timeout: 5000 })
      
      if (response.data.status === 'healthy') {
        setStatus('success')
        setBackendInfo(response.data)
        
        localStorage.setItem('backendUrl', url)
        axios.defaults.baseURL = url
        
        if (!silent) {
          alert('Backend connection successful!')
        }
      } else {
        throw new Error('Backend returned unhealthy status')
      }
    } catch (err) {
      setStatus('error')
      const errorMsg = err.code === 'ECONNABORTED' 
        ? 'Connection timeout - backend not responding'
        : err.message || 'Cannot connect to backend'
      setError(errorMsg)
      console.error('Backend connection test failed:', err)
    } finally {
      setTesting(false)
    }
  }

  const handleTest = () => {
    testConnection(backendUrl)
  }

  const handleSave = () => {
    testConnection(backendUrl)
  }

  const handleReset = () => {
    const defaultUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    setBackendUrl(defaultUrl)
    testConnection(defaultUrl)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Server className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Backend Configuration
            </h2>
          </div>

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
                Enter your Raspberry Pi's IP address and port (e.g., http://192.168.1.100:5000)
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
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Connected successfully!</p>
                      {backendInfo && (
                        <p className="text-xs mt-1">{backendInfo.message}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Connection failed</p>
                      <p className="text-xs mt-1">{error}</p>
                    </div>
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
                Save & Test
              </button>

              <button
                onClick={handleReset}
                disabled={testing}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
                title="Reset to default"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              How to find your Raspberry Pi's IP address:
            </h3>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
              <li>Connect to your Raspberry Pi via SSH or directly</li>
              <li>Run the command: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">hostname -I</code></li>
              <li>Use the first IP address shown (e.g., 192.168.1.100)</li>
              <li>Enter it here with port 5000: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">http://192.168.1.100:5000</code></li>
            </ol>
          </div>

          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Troubleshooting:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
              <li>Ensure both devices are on the same WiFi network</li>
              <li>Verify the backend is running on Raspberry Pi: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">python3 backend/app.py</code></li>
              <li>Check firewall settings on Raspberry Pi</li>
              <li>Try pinging the Raspberry Pi from your laptop</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings

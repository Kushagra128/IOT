import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { Mic, Square, ArrowLeft, Loader, Moon, Sun, Activity, AlertCircle } from 'lucide-react'

const Recording = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })
  const transcriptIntervalRef = useRef(null)
  const timerIntervalRef = useRef(null)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  useEffect(() => {
    return () => {
      if (transcriptIntervalRef.current) {
        clearInterval(transcriptIntervalRef.current)
        transcriptIntervalRef.current = null
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ⭐ NEW: Ask browser for mic permission BEFORE backend starts recording
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("Microphone permission granted")

      // Stop stream because backend will handle actual recording
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (err) {
      console.error("Mic permission denied:", err)
      alert("Microphone access is required to record audio.")
      return false
    }
  }

  const startRecording = async () => {
    try {
      setLoading(true)
      setError('')

      // Get microphone permission and start recording locally
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })

      // Create MediaRecorder to capture audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      const audioChunks = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      // Start backend session FIRST
      const response = await axios.post('/api/recordings/start', {
        title: `Recording ${new Date().toLocaleString()}`
      })

      const newSessionId = response.data.session_id
      setSessionId(newSessionId)

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        // Create audio blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        
        console.log('Recording stopped, uploading audio...', audioBlob.size, 'bytes')
        
        // Upload to backend for processing
        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          await axios.post(`/api/recordings/${newSessionId}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 120000 // 2 minute timeout
          })

          console.log('✓ Audio uploaded successfully')
        } catch (error) {
          console.error('Failed to upload audio:', error)
          setError('Failed to upload audio: ' + (error.response?.data?.error || error.message))
        }
      }
      
      // Store mediaRecorder for later
      window.currentMediaRecorder = mediaRecorder
      window.currentSessionId = newSessionId

      // Start recording
      mediaRecorder.start(1000) // Capture in 1-second chunks

      setIsRecording(true)
      setLoading(false)
      setRecordingTime(0)

      // Start polling for live transcript
      transcriptIntervalRef.current = setInterval(fetchTranscript, 2000)
      
      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      console.log('✓ Recording started on laptop, will upload to Pi when stopped')
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to start recording')
      setLoading(false)
    }
  }



  const stopRecording = async () => {
    if (loading || !sessionId) return

    try {
      if (transcriptIntervalRef.current) {
        clearInterval(transcriptIntervalRef.current)
        transcriptIntervalRef.current = null
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }

      setLoading(true)
      setIsRecording(false)

      // Stop the MediaRecorder (this triggers upload)
      if (window.currentMediaRecorder && window.currentMediaRecorder.state !== 'inactive') {
        window.currentMediaRecorder.stop()
      }

      // Wait for upload to complete (increased time)
      console.log('Waiting for upload to complete...')
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Tell backend to process the uploaded audio
      console.log('Telling backend to process...')
      const response = await axios.post(`/api/recordings/${sessionId}/stop`)

      if (response.data.recording?.id) {
        navigate(`/recording/${response.data.recording.id}`)
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Stop recording error:', error)
      setError(error.response?.data?.error || 'Failed to stop recording')
      setLoading(false)
      navigate('/dashboard')
    }
  }

  const fetchTranscript = async () => {
    if (!sessionId) return

    try {
      const response = await axios.get(`/api/recordings/${sessionId}/transcript`, {
        timeout: 5000 // 5 second timeout
      })
      if (response.data.transcript) {
        const fullText = response.data.transcript.full_text || ''
        setTranscript(fullText)
      }
    } catch (error) {
      // Silently handle errors during polling - backend might be processing
      if (error.code !== 'ECONNABORTED') {
        console.error('Error fetching transcript:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Recording</h1>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors duration-200">
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 transition-all duration-300 ${
                isRecording ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {isRecording ? (
                <Mic className="w-16 h-16 text-red-600 dark:text-red-400" />
              ) : (
                <Mic className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              )}
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {isRecording ? 'Recording in Progress...' : 'Ready to Record'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isRecording
                ? 'Speak clearly into your microphone. Click stop when finished.'
                : 'Click the button below to start recording your meeting'}
            </p>
            
            {isRecording && (
              <div className="mt-4 flex items-center justify-center space-x-2">
                <Activity className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
                <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4 mb-8">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={loading}
                className="flex items-center space-x-2 bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition text-lg font-medium"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>Start Recording</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                disabled={loading}
                className="flex items-center space-x-2 bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-lg font-medium"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Stopping...</span>
                  </>
                ) : (
                  <>
                    <Square className="w-5 h-5" />
                    <span>Stop Recording</span>
                  </>
                )}
              </button>
            )}
          </div>

          {isRecording && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                  Live Transcript
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {transcript.split(' ').filter(w => w).length} words
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 min-h-[300px] max-h-[500px] overflow-y-auto border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                {transcript ? (
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {transcript}
                  </p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 italic text-center py-12">
                    Waiting for speech... Start speaking to see transcription here.
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Transcript updates in real-time as you speak
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Recording

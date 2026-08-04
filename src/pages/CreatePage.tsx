import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import './CreatePage.css'

type Step = 'pick' | 'preview' | 'posting'

export default function CreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [step, setStep] = useState<Step>('pick')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)

  if (!user) {
    navigate('/login')
    return null
  }

  const handleFile = (f: File) => {
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setStep('preview')
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      }
    } catch {
      setError('Camera access denied. Upload a video instead.')
    }
  }

  const startRecording = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    if (!stream) return
    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const f = new File([blob], `record-${Date.now()}.webm`, { type: 'video/webm' })
      stream.getTracks().forEach((t) => t.stop())
      handleFile(f)
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    setCameraReady(false)
  }

  const handlePost = async () => {
    if (!file) return
    setStep('posting')
    setError('')
    try {
      await api.uploadVideo(
        file,
        caption,
        `Original Sound — @${user.username}`
      )
      navigate(`/profile/${user.username}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStep('preview')
    }
  }

  return (
    <AppShell dark={false}>
      <div className="create-page">
        <header className="create-header">
          <button type="button" onClick={() => navigate(-1)} aria-label="Back">✕</button>
          <h1>Create</h1>
          {step === 'preview' && (
            <button type="button" className="create-post-btn" onClick={handlePost}>Post</button>
          )}
          {step !== 'preview' && <span />}
        </header>

        {step === 'pick' && (
          <div className="create-pick">
            <div className="create-hero">
              <span className="create-hero-icon">📱</span>
              <h2>Share your moment</h2>
              <p>Record or upload a short video</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />

            <button type="button" className="create-action primary" onClick={() => fileRef.current?.click()}>
              Upload video
            </button>

            {!cameraReady ? (
              <button type="button" className="create-action" onClick={startCamera}>
                Record with camera
              </button>
            ) : (
              <div className="create-camera">
                <video ref={videoRef} className="create-camera-preview" playsInline muted />
                {!recording ? (
                  <button type="button" className="create-record-btn" onClick={startRecording}>
                    ● Record
                  </button>
                ) : (
                  <button type="button" className="create-record-btn recording" onClick={stopRecording}>
                    ■ Stop
                  </button>
                )}
              </div>
            )}

            {error && <p className="create-error">{error}</p>}
          </div>
        )}

        {step === 'preview' && (
          <div className="create-preview">
            <video src={previewUrl} className="create-preview-video" controls playsInline loop />
            <div className="create-caption-wrap">
              <label>
                Caption
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe your video..."
                  maxLength={220}
                  rows={3}
                />
              </label>
              <small>{caption.length}/220</small>
            </div>
            {error && <p className="create-error">{error}</p>}
          </div>
        )}

        {step === 'posting' && (
          <div className="create-posting">
            <div className="spinner" />
            <p>Posting your video...</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/workspace/Sidebar'
import StatusBar from '../components/workspace/StatusBar'
import ClipboardModule from '../components/modules/ClipboardModule'
import MessagesModule from '../components/modules/MessagesModule'
import FilesModule from '../components/modules/FilesModule'
import SecretsModule from '../components/modules/SecretsModule'
import DevicesModule from '../components/modules/DevicesModule'
import SecurityModule from '../components/modules/SecurityModule'
import SettingsModule from '../components/modules/SettingsModule'
import ExpiredModal from '../components/ExpiredModal'
import { useSessionData } from '../utils/useSessionData'
import { supabase } from '../lib/supabase'

export default function Session() {
  const { sessionId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  
  // Retrieve saved state from localStorage if state prop is missing on refresh
  const savedStateStr = localStorage.getItem(`blinkpaste_${sessionId}`)
  const savedState = savedStateStr ? JSON.parse(savedStateStr) : null
  const activeState = state || savedState

  // Persist active state to localStorage whenever present
  useEffect(() => {
    if (state?.name && state?.passcode) {
      localStorage.setItem(`blinkpaste_${sessionId}`, JSON.stringify(state))
    }
  }, [sessionId, state])

  // Ensure state exists (user went through join/create flow)
  useEffect(() => {
    if (!activeState?.name || !activeState?.passcode) {
      navigate('/', { replace: true })
    }
  }, [activeState, navigate])

  const myName = activeState?.name || 'Unknown'
  const myDeviceId = activeState?.deviceId || 'dev_unknown'

  const [activeModule, setActiveModule] = useState('clipboard')
  const [isExpired, setIsExpired] = useState(false)
  
  const {
    session, loading, error,
    clipboardItems, messages, devices, secrets, securityEvents, files, key,
    addClipboard, deleteClipboard, addMessage, deleteMessage, burnMessage,
    addSecret, revealSecret, deleteSecret, removeDevice, kickDevice, makeHost, leaveSession, destroySession, lockSession, addFileMetadata, deleteFileMetadata
  } = useSessionData(sessionId, activeState?.passcode, myName, myDeviceId)

  // Dynamically check if current user is host via session's host_device_id or state flag
  const isHost = Boolean(
    activeState?.isHost || 
    (session && session.host_device_id && session.host_device_id === myDeviceId)
  )

  const handleDestroySession = async () => {
    await destroySession()
    localStorage.removeItem(`blinkpaste_${sessionId}`)
    window.location.href = '/'
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white/50">Loading secure workspace...</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-error">Error: {error}</div>
  }

  const sessionConfig = {
    encryption: session?.encrypt_content ?? true,
    autoDestruct: session?.destroy_on_expire ?? true,
    sensitiveDetection: true
  }

  const handleLeaveSession = async () => {
    await leaveSession()
    localStorage.removeItem(`blinkpaste_${sessionId}`)
    window.location.href = '/'
  }

  const handleFileUpload = async (file) => {
    try {
      // Create a unique path: sessionId/deviceId_timestamp_filename
      const storagePath = `${sessionId}/${myDeviceId}_${Date.now()}_${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('session_files')
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      await addFileMetadata(file, storagePath)
    } catch (err) {
      console.error('File upload failed:', err)
      alert('Failed to upload file. Ensure the "session_files" storage bucket exists in Supabase and is public.')
    }
  }

  const handleFileDownload = async (fileRec) => {
    try {
      const { data, error } = await supabase.storage
        .from('session_files')
        .download(fileRec.storage_path)
        
      if (error) throw error

      // Create a download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileRec.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('File download failed:', err)
      alert('Failed to download file.')
    }
  }

  const handleFileDelete = async (id) => {
    try {
      const fileRec = files.find(f => f.id === id)
      if (fileRec) {
        await supabase.storage.from('session_files').remove([fileRec.storage_path])
        await deleteFileMetadata(id)
      }
    } catch (err) {
      console.error('File delete failed:', err)
    }
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'clipboard':
        return <ClipboardModule items={clipboardItems} onShare={addClipboard} onDelete={deleteClipboard} isEncryptionEnabled={sessionConfig.encryption} />
      case 'messages':
        return <MessagesModule messages={messages} myName={myName} onSend={addMessage} onDelete={deleteMessage} onBurn={burnMessage} />
      case 'files':
        return <FilesModule files={files} onUpload={handleFileUpload} onDownload={handleFileDownload} onDelete={handleFileDelete} />
      case 'secrets':
        return <SecretsModule secrets={secrets} myName={myName} onCreate={addSecret} onReveal={revealSecret} onDestroy={deleteSecret} />
      case 'devices':
        return <DevicesModule devices={devices} myDeviceId={myDeviceId} isHost={isHost} onRemoveDevice={removeDevice} onKickDevice={kickDevice} onMakeHost={makeHost} />
      case 'security':
        return <SecurityModule events={securityEvents} stats={{}} config={sessionConfig} />
      case 'settings':
        return <SettingsModule 
                 session={session} 
                 isHost={isHost} 
                 onLockSession={lockSession} 
                 onDestroySession={handleDestroySession} 
                 onLeaveSession={handleLeaveSession}
                 onUpdateSettings={() => {}}
               />
      default:
        return null
    }
  }

  return (
    <div className="workspace-container">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} sessionId={sessionId} />
      
      <div className="workspace-main relative">
        {/* Background elements */}
        <div className="ambient-glow" style={{ opacity: 0.04, zIndex: 0 }} aria-hidden="true" />
        
        <header className="workspace-header">
          <div className="flex items-center gap-3 hidden md:flex">
             <div className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse" />
             <span className="text-sm text-white/60 font-medium tracking-wide uppercase">
               {activeModule}
             </span>
          </div>
          <div className="flex-1 md:hidden" />
          <div className="flex items-center gap-3">
             <span className="text-sm font-medium text-white">{myName}</span>
             <div className="badge badge-purple">{isHost ? 'Host' : 'Participant'}</div>
          </div>
        </header>
        
        <main className="workspace-content relative z-10">
          {renderModule()}
        </main>
        
        <StatusBar 
          encrypted={sessionConfig.encryption} 
          deviceCount={devices.length} 
          expiresAt={session?.expires_at} 
          onExpire={() => setIsExpired(true)} 
        />
      </div>

      {isExpired && <ExpiredModal />}
    </div>
  )
}

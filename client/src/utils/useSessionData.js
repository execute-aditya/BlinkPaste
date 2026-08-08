import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { deriveKey, encryptIfEnabled, decryptIfEnabled } from './encryption'

export function useSessionData(sessionId, passcode, myName, myDeviceId) {
  const [session, setSession] = useState(null)
  const [clipboardItems, setClipboardItems] = useState([])
  const [messages, setMessages] = useState([])
  const [devices, setDevices] = useState([])
  const [secrets, setSecrets] = useState([])
  const [securityEvents, setSecurityEvents] = useState([])
  
  const [files, setFiles] = useState([])
  const [key, setKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    let sub = null

    async function init() {
      try {
        // Fetch session using maybeSingle to avoid PGRST116
        const { data: sessionData, error: sessionErr } = await supabase
          .from('sessions_v2')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle()

        if (sessionErr) throw sessionErr
        if (!sessionData) throw new Error('Session not found. It may have expired.')
        if (!active) return

        setSession(sessionData)

        // Derive encryption key
        let cryptoKey = null
        if (sessionData.encrypt_content && passcode) {
          const salt = btoa(sessionId.padEnd(16, '0').substring(0, 16))
          cryptoKey = await deriveKey(passcode, salt)
          setKey(cryptoKey)
        }

        // Fetch initial data
        const [cbRes, msgRes, devRes, secRes, evRes, filesRes] = await Promise.all([
          supabase.from('clipboard_items').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
          supabase.from('messages_v2').select('*').eq('session_id', sessionId).order('created_at', { ascending: true }),
          supabase.from('devices').select('*').eq('session_id', sessionId),
          supabase.from('secrets').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
          supabase.from('security_events').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
          supabase.from('files').select('*').eq('session_id', sessionId).order('created_at', { ascending: false })
        ])

        if (active) {
          // Decrypt data if encryption key exists
          const decCb = await Promise.all((cbRes.data || []).map(async item => ({ ...item, content: await decryptIfEnabled(item.content, cryptoKey) })))
          const decMsg = await Promise.all((msgRes.data || []).map(async item => ({ ...item, content: await decryptIfEnabled(item.content, cryptoKey) })))
          const decSec = await Promise.all((secRes.data || []).map(async item => ({ ...item, content: await decryptIfEnabled(item.content, cryptoKey) })))
          const decFiles = await Promise.all((filesRes.data || []).map(async item => ({ ...item, filename: await decryptIfEnabled(item.filename, cryptoKey) })))

          let allDevices = devRes.data || []

          // Check if my device is blocked
          const myDev = allDevices.find(d => d.device_id === myDeviceId)
          if (myDev && myDev.is_blocked) {
            localStorage.removeItem(`blinkpaste_${sessionId}`)
            setError('You have been removed from this session by the host.')
            setLoading(false)
            return
          }

          // Auto-register device if missing from devices table
          if (myDeviceId && myName && !allDevices.some(d => d.device_id === myDeviceId)) {
            const isHostDevice = sessionData.host_device_id === myDeviceId
            const newDev = {
              session_id: sessionId,
              device_id: myDeviceId,
              display_name: myName,
              browser: 'Web',
              os: navigator.platform || 'Unknown',
              role: isHostDevice ? 'host' : 'participant',
              is_blocked: false
            }
            const { data: registered } = await supabase.from('devices').upsert(newDev, { onConflict: 'session_id,device_id' }).select().maybeSingle()
            if (registered) {
              allDevices = [...allDevices, registered]
            }
          }

          setClipboardItems(decCb)
          setMessages(decMsg)
          setDevices(allDevices)
          setSecrets(decSec)
          setSecurityEvents(evRes.data || [])
          setFiles(decFiles)
          setLoading(false)
        }

        // Setup realtime subscription
        sub = supabase
          .channel(`session:${sessionId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'clipboard_items', filter: `session_id=eq.${sessionId}` }, async payload => {
            if (payload.eventType === 'INSERT') {
              const item = { ...payload.new, content: await decryptIfEnabled(payload.new.content, cryptoKey) }
              setClipboardItems(prev => [item, ...prev])
            } else if (payload.eventType === 'DELETE') {
              setClipboardItems(prev => prev.filter(i => i.id !== payload.old.id))
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'messages_v2', filter: `session_id=eq.${sessionId}` }, async payload => {
            if (payload.eventType === 'INSERT') {
              const item = { ...payload.new, content: await decryptIfEnabled(payload.new.content, cryptoKey) }
              setMessages(prev => [...prev, item])
            } else if (payload.eventType === 'UPDATE') {
              const item = { ...payload.new, content: await decryptIfEnabled(payload.new.content, cryptoKey) }
              setMessages(prev => prev.map(m => m.id === item.id ? item : m))
            } else if (payload.eventType === 'DELETE') {
              setMessages(prev => prev.filter(m => m.id !== payload.old.id))
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'devices', filter: `session_id=eq.${sessionId}` }, payload => {
            if (payload.eventType === 'INSERT') {
              setDevices(prev => [...prev, payload.new])
            } else if (payload.eventType === 'UPDATE') {
              if (payload.new.device_id === myDeviceId && payload.new.is_blocked) {
                localStorage.removeItem(`blinkpaste_${sessionId}`)
                alert('You have been removed from the session by the host.')
                window.location.href = '/'
                return
              }
              setDevices(prev => prev.map(d => d.device_id === payload.new.device_id ? payload.new : d))
            } else if (payload.eventType === 'DELETE') {
              setDevices(prev => {
                const myDevRecord = prev.find(d => d.device_id === myDeviceId)
                if (myDevRecord && payload.old.id === myDevRecord.id) {
                  localStorage.removeItem(`blinkpaste_${sessionId}`)
                  alert('You have been removed from the session by the host.')
                  window.location.href = '/'
                }
                return prev.filter(d => d.id !== payload.old.id)
              })
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'secrets', filter: `session_id=eq.${sessionId}` }, async payload => {
            if (payload.eventType === 'INSERT') {
              const item = { ...payload.new, content: await decryptIfEnabled(payload.new.content, cryptoKey) }
              setSecrets(prev => [item, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              const item = { ...payload.new, content: await decryptIfEnabled(payload.new.content, cryptoKey) }
              setSecrets(prev => prev.map(s => s.id === item.id ? item : s))
            } else if (payload.eventType === 'DELETE') {
              setSecrets(prev => prev.filter(s => s.id !== payload.old.id))
            }
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events', filter: `session_id=eq.${sessionId}` }, payload => {
            setSecurityEvents(prev => [payload.new, ...prev])
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'files', filter: `session_id=eq.${sessionId}` }, async payload => {
            if (payload.eventType === 'INSERT') {
              const item = { ...payload.new, filename: await decryptIfEnabled(payload.new.filename, cryptoKey) }
              setFiles(prev => [item, ...prev])
            } else if (payload.eventType === 'DELETE') {
              setFiles(prev => prev.filter(f => f.id !== payload.old.id))
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions_v2', filter: `session_id=eq.${sessionId}` }, payload => {
            if (payload.eventType === 'DELETE') {
              localStorage.removeItem(`blinkpaste_${sessionId}`)
              window.location.href = '/'
            } else if (payload.eventType === 'UPDATE') {
              setSession(payload.new)
            }
          })
          .subscribe()

        // Setup periodic check for session expiration & automated cleanup
        const timer = setInterval(async () => {
          if (new Date(sessionData.expires_at) <= new Date()) {
            clearInterval(timer)
            setError('Session has expired.')
            // Trigger background edge function to clean up expired sessions
            try {
              await supabase.functions.invoke('delete-expired-sessions')
            } catch (e) {
              console.warn('Auto cleanup invoke error:', e)
            }
          }
        }, 10000)

      } catch (err) {
        console.error('Failed to init session:', err)
        if (active) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      active = false
      if (sub) supabase.removeChannel(sub)
    }
  }, [sessionId, passcode])

  const isSelfBlocked = () => {
    return devices.some(d => d.device_id === myDeviceId && d.is_blocked)
  }

  const addClipboard = async (content) => {
    if (isSelfBlocked()) {
      localStorage.removeItem(`blinkpaste_${sessionId}`)
      window.location.href = '/'
      return
    }
    const enc = await encryptIfEnabled(content, key)
    await supabase.from('clipboard_items').insert({ session_id: sessionId, content: enc, sender_name: myName, sender_device_id: myDeviceId })
  }

  const deleteClipboard = async (id) => {
    setClipboardItems(prev => prev.filter(item => item.id !== id))
    await supabase.from('clipboard_items').delete().eq('id', id)
  }

  const addMessage = async (content, burnType) => {
    if (isSelfBlocked()) {
      localStorage.removeItem(`blinkpaste_${sessionId}`)
      window.location.href = '/'
      return
    }
    const enc = await encryptIfEnabled(content, key)
    await supabase.from('messages_v2').insert({ session_id: sessionId, content: enc, sender_name: myName, sender_device_id: myDeviceId, burn_type: burnType })
  }

  const deleteMessage = async (id) => {
    setMessages(prev => prev.filter(m => m.id !== id))
    await supabase.from('messages_v2').delete().eq('id', id)
  }

  const burnMessage = async (id, currentViews) => {
    await supabase.from('messages_v2').update({ view_count: currentViews + 1 }).eq('id', id)
  }

  const addSecret = async (data) => {
    if (isSelfBlocked()) {
      localStorage.removeItem(`blinkpaste_${sessionId}`)
      window.location.href = '/'
      return
    }
    const enc = await encryptIfEnabled(data.content, key)
    let expiresAt = null
    if (data.burnMinutes) {
      expiresAt = new Date(Date.now() + data.burnMinutes * 60000).toISOString()
    }
    await supabase.from('secrets').insert({ 
      session_id: sessionId, 
      title: data.title, 
      content: enc, 
      burn_type: data.burnType, 
      max_views: data.maxViews || (data.burnType === '1view' ? 1 : 999999),
      expires_at: expiresAt,
      created_by: myName 
    })
  }

  const revealSecret = async (id, currentViews) => {
    await supabase.from('secrets').update({ view_count: currentViews + 1 }).eq('id', id)
  }

  const deleteSecret = async (id) => {
    setSecrets(prev => prev.filter(s => s.id !== id))
    await supabase.from('secrets').delete().eq('id', id)
  }

  const addFileMetadata = async (fileObj, storagePath) => {
    if (isSelfBlocked()) {
      localStorage.removeItem(`blinkpaste_${sessionId}`)
      window.location.href = '/'
      return
    }
    const encFilename = await encryptIfEnabled(fileObj.name, key)
    await supabase.from('files').insert({
      session_id: sessionId,
      filename: encFilename,
      mime_type: fileObj.type,
      size_bytes: fileObj.size,
      storage_path: storagePath,
      uploaded_by: myName
    })
  }

  const deleteFileMetadata = async (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    await supabase.from('files').delete().eq('id', id)
  }

  const removeDevice = async (id) => {
    setDevices(prev => prev.filter(d => d.id !== id))
    await supabase.from('devices').delete().eq('id', id)
    await supabase.from('security_events').insert({ session_id: sessionId, event_type: 'blocked', description: 'Device removed by host', device_id: id })
  }

  const kickDevice = async (deviceDbId, deviceIdentifier, deviceName) => {
    setDevices(prev => prev.map(d => d.device_id === deviceIdentifier ? { ...d, is_blocked: true } : d))
    await supabase.from('devices').update({ is_blocked: true }).eq('session_id', sessionId).eq('device_id', deviceIdentifier)
    await supabase.from('security_events').insert({ session_id: sessionId, event_type: 'kicked', description: `${deviceName} was kicked by the host`, device_id: deviceIdentifier })
  }

  const makeHost = async (deviceDbId, deviceIdentifier) => {
    // Update the device role to host
    await supabase.from('devices').update({ role: 'host' }).eq('id', deviceDbId)
    // Update the session's host_device_id
    await supabase.from('sessions_v2').update({ host_device_id: deviceIdentifier }).eq('session_id', sessionId)
    // Demote current host device to participant
    await supabase.from('devices').update({ role: 'participant' }).eq('session_id', sessionId).eq('device_id', myDeviceId)
    await supabase.from('security_events').insert({ session_id: sessionId, event_type: 'host_transfer', description: `Host transferred to device ${deviceIdentifier}`, device_id: deviceIdentifier })
  }

  const leaveSession = async () => {
    if (myDeviceId) {
      await supabase.from('devices').delete().eq('session_id', sessionId).eq('device_id', myDeviceId)
      await supabase.from('security_events').insert({ session_id: sessionId, event_type: 'leave', description: `${myName} left the session`, device_id: myDeviceId })
    }
  }

  const destroySession = async () => {
    await supabase.from('sessions_v2').delete().eq('session_id', sessionId)
  }

  const lockSession = async () => {
    const nextLocked = !session?.is_locked
    await supabase.from('sessions_v2').update({ is_locked: nextLocked }).eq('session_id', sessionId)
  }

  return {
    session, loading, error,
    clipboardItems, messages, devices, secrets, securityEvents, files, key,
    addClipboard, deleteClipboard, addMessage, deleteMessage, burnMessage,
    addSecret, revealSecret, deleteSecret, removeDevice, kickDevice, makeHost, leaveSession, destroySession, lockSession, addFileMetadata, deleteFileMetadata
  }
}

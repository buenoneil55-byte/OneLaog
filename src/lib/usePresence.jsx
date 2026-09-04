import { useEffect, useState } from 'react'
import { supabase } from '@/api/supabaseClient'

// Tracks the current user as online and returns everyone currently online.
// Returns: [{ id, role }]
export function useOnlineUsers(myId, myRole) {
  const [online, setOnline] = useState([])

  useEffect(() => {
    if (!myId) return

    const channel = supabase.channel('online-users', {
      config: { presence: { key: myId } },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users = Object.entries(state).map(([id, payloads]) => ({
        id,
        role: payloads[0]?.role || 'user',
      }))
      setOnline(users)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ role: myRole || 'user', online_at: new Date().toISOString() })
      }
    })

    return () => { supabase.removeChannel(channel) }
  }, [myId, myRole])

  return online
}
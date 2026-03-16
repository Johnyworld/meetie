'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { VideoRoom } from '@/types/video-chat';

export function useVideoRoomList() {
  const [rooms, setRooms] = useState<VideoRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase
      .from('video_rooms')
      .select('*')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false });
    setRooms(data ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  return { rooms, isLoading, refresh: fetchRooms };
}

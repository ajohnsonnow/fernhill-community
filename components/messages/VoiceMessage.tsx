'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Send,
  Loader2
} from 'lucide-react';

interface VoiceMessageRecorderProps {
  onSend: (audioUrl: string, duration: number) => void;
  disabled?: boolean;
}

export function VoiceMessageRecorder({ onSend, disabled }: VoiceMessageRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

    } catch (error) {
      toast.error('Could not access microphone');
      console.error('Microphone error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to Supabase storage
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      onSend(publicUrl, duration);
      discardRecording();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Recording in progress
  if (isRecording) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-2xl border border-red-500/30">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-red-400 font-mono">{formatTime(duration)}</span>
        <div className="flex-1" />
        <button
          onClick={stopRecording}
          className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Recording ready to send
  if (audioUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
        
        <button
          onClick={playPause}
          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full text-emerald-400"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="flex-1">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
          </div>
          <span className="text-xs text-gray-400 mt-1">{formatTime(duration)}</span>
        </div>

        <button
          onClick={discardRecording}
          className="p-2 text-gray-400 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={sendVoiceMessage}
          disabled={uploading}
          className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-full text-white"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  // Default state - show mic button
  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-white/10 rounded-full disabled:opacity-50 transition-colors"
      title="Record voice message"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}

// Voice message player component for received messages
interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration: number;
  isOwn?: boolean;
}

export function VoiceMessagePlayer({ audioUrl, duration, isOwn }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
    });

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-2xl min-w-48 ${
      isOwn ? 'bg-emerald-600' : 'bg-gray-700'
    }`}>
      <audio ref={audioRef} src={audioUrl} />
      
      <button
        onClick={togglePlay}
        className="p-1.5 bg-white/20 rounded-full"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white" />
        )}
      </button>

      <div className="flex-1">
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <span className="text-xs text-white/70 font-mono">
        {formatTime(duration)}
      </span>
    </div>
  );
}

export default VoiceMessageRecorder;

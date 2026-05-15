import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
}

type RecordingState = 'idle' | 'recording' | 'ready';

export function AudioRecorder({ onAudioReady, onCancel }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const MAX_RECORDING_TIME = 60; // 60 segundos

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Parar gravação quando atingir limite
  useEffect(() => {
    if (recordingTime >= MAX_RECORDING_TIME) {
      handleStopRecording();
    }
  }, [recordingTime]);

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        setAudioBlob(audioBlob);
        setState('ready');

        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setState('recording');
      startTimeRef.current = Date.now();

      // Iniciar timer
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 100);

    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onAudioReady(audioBlob, recordingTime);
      handleCancel();
    }
  };

  const handleCancel = () => {
    stopRecording();
    setState('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    audioChunksRef.current = [];
    onCancel?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // IDLE: Botão microfone
  if (state === 'idle') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={startRecording}
        className="h-10 w-10 rounded-full"
        title="Gravar áudio"
      >
        <Mic className="h-5 w-5" />
      </Button>
    );
  }

  // RECORDING: Timer + botões
  if (state === 'recording') {
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-muted rounded-full">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium tabular-nums">
            {formatTime(recordingTime)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8 rounded-full"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={handleStopRecording}
            className="h-8 w-8 rounded-full"
            title="Parar gravação"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // READY: Duração + botões
  if (state === 'ready') {
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-muted rounded-full">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium tabular-nums">
            {formatTime(recordingTime)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8 rounded-full"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={handleSend}
            className="h-8 w-8 rounded-full"
            title="Enviar áudio"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

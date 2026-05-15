import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number; // Duração em segundos (opcional)
}

export function AudioPlayer({ audioUrl, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentTime(0);
    setIsPlaying(false);

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.playbackRate = playbackRate;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    const handleError = () => {
      console.error("Erro ao carregar áudio");
      setHasError(true);
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Se a duração já estiver disponível imediatamente (cache)
    if (audio.readyState >= 1 && audio.duration && !isNaN(audio.duration)) {
      setTotalDuration(audio.duration);
      setIsLoading(false);
    }

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error("Erro ao reproduzir áudio:", err);
        setIsPlaying(false);
      });

      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 100);
    } else {
      audio.pause();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handlePlayPause = useCallback(() => {
    if (hasError) return;
    setIsPlaying((prev) => !prev);
  }, [hasError]);

  const handleSeek = useCallback((value: number[]) => {
    const newTime = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handlePlaybackRateChange = useCallback(() => {
    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
  }, [playbackRate]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-full min-w-[200px]">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando áudio...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-full min-w-[200px]">
        <span className="text-sm text-muted-foreground">Erro ao carregar áudio</span>
      </div>
    );
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-muted rounded-full min-w-[280px] max-w-[400px]">
      {/* Botão Play/Pause */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlayPause}
        className="h-8 w-8 rounded-full shrink-0"
        title={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Barra de progresso + Timer */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <Slider
          value={[currentTime]}
          max={totalDuration || 1}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full cursor-pointer"
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Velocidade */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePlaybackRateChange}
        className="h-7 px-2 text-xs font-medium rounded-full shrink-0 tabular-nums"
        title="Alterar velocidade"
      >
        {playbackRate}x
      </Button>
    </div>
  );
}

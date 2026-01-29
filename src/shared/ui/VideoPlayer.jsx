import React from "react";
import Hls from "hls.js";
import { useTranslation } from "react-i18next";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  ArrowLeft,
  Square,
  LayoutTemplate,
} from "lucide-react";

/**
 * VideoPlayer - Custom HTML5 video player with controls
 * @param {string} src - Video source URL
 * @param {string} poster - Poster image URL
 * @param {string} title - Video title for overlay
 * @param {Function} onBack - Back button callback
 * @param {Array} timestamps - Array of { title, atSec } for chapters
 * @param {Function} onProgress - Progress callback (currentTime, duration)
 * @param {number} initialTime - Initial playback time in seconds
 * @param {boolean} theaterMode - Whether theater mode is active
 * @param {Function} onToggleTheater - Callback to toggle theater mode
 */

export function VideoPlayer({
  src,
  poster,
  title,
  onBack,
  timestamps = [],
  onProgress,
  initialTime = 0,
  className = "",
  theaterMode = false,
  onToggleTheater,
}) {
  const { t } = useTranslation();
  const videoRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const progressRef = React.useRef(null);

  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [buffered, setBuffered] = React.useState(0);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = React.useState(false);

  const controlsTimeoutRef = React.useRef(null);

  // Initialize Video Source (HLS or Standard)
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls;

    const isHls = src.includes(".m3u8") || src.includes(".m4s");

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        capLevelToPlayerSize: true, // Auto quality based on size
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Ready to play
        if (initialTime > 0) video.currentTime = initialTime;
      });
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // try to recover network error
              console.log("fatal network error encountered, try to recover");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("fatal media error encountered, try to recover");
              hls.recoverMediaError();
              break;
            default:
              // cannot recover
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari)
      video.src = src;
      // Seek handled in onLoadedMetadata
    } else {
      // Standard video
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  // Format time as MM:SS

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  // Handle mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    // iOS Safari specific: video.webkitEnterFullscreen()
    if (videoRef.current && videoRef.current.webkitEnterFullscreen) {
      if (videoRef.current.webkitDisplayingFullscreen) {
        videoRef.current.webkitExitFullscreen?.();
      } else {
        videoRef.current.webkitEnterFullscreen();
      }
      return;
    }

    if (!containerRef.current) return;

    if (!fullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen(); // Safari/Chrome
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen(); // IE11
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setFullscreen(!fullscreen);
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    if (!videoRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Handle playback speed
  const handleSpeedChange = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  // Seek forward/backward
  const seek = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration, currentTime + seconds),
    );
  };

  // Jump to timestamp
  const jumpToTimestamp = (atSec) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = atSec;
    setCurrentTime(atSec);
    if (!playing) {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Video event handlers
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onProgress?.(video.currentTime, video.duration);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialTime) {
        video.currentTime = initialTime;
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleEnded = () => setPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [initialTime, onProgress]);

  // Fullscreen change listener
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Cleanup timeout
  React.useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-black/90 text-white aspect-video ${className}`}
      >
        <span className="text-sm text-gray-400">
          {t("videoPlayer.noVideo")}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Top Overlay (Back & Title) */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-linear-to-b from-black/80 to-transparent flex items-center gap-4 transition-opacity duration-300 z-20 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
        {title && (
          <h2 className="text-white font-bold text-lg leading-tight line-clamp-1 drop-shadow-md">
            {title}
          </h2>
        )}
      </div>

      {/* Play/Pause Overlay */}
      {!playing && (
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"
          onClick={togglePlay}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg hover:scale-110 transition-transform">
            <Play className="h-8 w-8 ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-black/80 to-transparent flex items-end px-4 pb-2 select-none transition-opacity duration-300 z-20 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="relative h-1 mb-3 bg-white/20 rounded-full cursor-pointer group/progress"
          onClick={handleProgressClick}
        >
          {/* Buffered */}
          <div
            className="absolute h-full bg-white/30 rounded-full"
            style={{ width: `${(buffered / duration) * 100}%` }}
          />
          {/* Played */}
          <div
            className="absolute h-full bg-[rgb(var(--brand-primary))] rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          {/* Scrubber */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white">
          {/* Left Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {playing ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => seek(-10)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={() => seek(10)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {muted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <span className="text-xs font-medium ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* Speed Button */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-xs font-medium"
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-lg">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-white/10 ${
                        playbackSpeed === speed
                          ? "text-[rgb(var(--brand-primary))]"
                          : ""
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theater Mode Toggle */}
            {onToggleTheater && (
              <button
                onClick={onToggleTheater}
                className={`hidden sm:block p-2 hover:bg-white/10 rounded-lg transition-colors ${theaterMode ? "text-[rgb(var(--brand-primary))]" : ""}`}
                title="Modo Teatro"
              >
                <LayoutTemplate className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {fullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Timestamps/Chapters Panel (if provided) */}
      {timestamps.length > 0 && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="relative">
            <button className="p-2 bg-black/70 rounded-lg text-white hover:bg-black/90 transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

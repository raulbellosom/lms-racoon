import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Loader2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "./cn";

/**
 * A fullscreen image viewer modal with zoom, pan, rotate and mobile gestures support.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Callback when modal closes
 * @param {string} props.src - Current image URL to display
 * @param {string[]} [props.images] - Array of image URLs for gallery navigation
 * @param {number} [props.initialIndex=0] - Initial index when using gallery mode
 * @param {string} [props.alt="Image"] - Alt text for the image
 * @param {boolean} [props.showDownload=true] - Whether to show download button
 * @param {string} [props.downloadFilename] - Custom filename for download
 */
export function ImageViewerModal({
  isOpen,
  onClose,
  src,
  images = [],
  initialIndex = 0,
  alt = "Image",
  showDownload = true,
  downloadFilename,
}) {
  // Determine if we're in gallery mode
  const isGalleryMode = images.length > 1;
  const imageList = isGalleryMode ? images : src ? [src] : [];

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef(null);
  const initialPinchScaleRef = useRef(1);

  // Get current image URL
  const currentImageUrl = imageList[currentIndex] || src;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Handle arrow keys for gallery navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || !isGalleryMode) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isGalleryMode, currentIndex]);

  // Reset state when modal opens/closes or image changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setLoading(true);
  }, [currentIndex, isOpen]);

  // Sync index when initialIndex changes externally
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  const nextImage = useCallback(() => {
    if (!isGalleryMode) return;
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  }, [isGalleryMode, imageList.length]);

  const prevImage = useCallback(() => {
    if (!isGalleryMode) return;
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  }, [isGalleryMode, imageList.length]);

  // Handle Wheel Zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setScale((s) => Math.min(5, Math.max(0.5, s + delta)));
  }, []);

  // Handle Pinch Zoom (Mobile)
  const handleTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        touchStartDistRef.current = dist;
        initialPinchScaleRef.current = scale;
      } else if (e.touches.length === 1 && scale > 1) {
        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        setIsDragging(true);
      }
    },
    [scale],
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (e.touches.length === 2 && touchStartDistRef.current) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        const scaleFactor = dist / touchStartDistRef.current;
        const newScale = Math.min(
          5,
          Math.max(0.5, initialPinchScaleRef.current * scaleFactor),
        );
        setScale(newScale);
      } else if (e.touches.length === 1 && isDragging && scale > 1) {
        const deltaX = e.touches[0].clientX - lastTouchRef.current.x;
        const deltaY = e.touches[0].clientY - lastTouchRef.current.y;

        setPosition((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    [isDragging, scale],
  );

  const handleTouchEnd = useCallback(() => {
    touchStartDistRef.current = null;
    setIsDragging(false);
  }, []);

  // Mouse drag for desktop
  const handleMouseDown = useCallback(
    (e) => {
      if (scale > 1) {
        e.preventDefault();
        lastTouchRef.current = { x: e.clientX, y: e.clientY };
        setIsDragging(true);
      }
    },
    [scale],
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging && scale > 1) {
        const deltaX = e.clientX - lastTouchRef.current.x;
        const deltaY = e.clientY - lastTouchRef.current.y;

        setPosition((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        lastTouchRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isDragging, scale],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDownload = useCallback(
    (e) => {
      e.stopPropagation();
      if (!currentImageUrl) return;

      const link = document.createElement("a");
      link.href = currentImageUrl;
      link.download = downloadFilename || `image-${Date.now()}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [currentImageUrl, downloadFilename],
  );

  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleClose = useCallback(() => {
    resetView();
    onClose();
  }, [onClose, resetView]);

  // Double tap to zoom (mobile)
  const lastTapRef = useRef(0);
  const handleDoubleTap = useCallback(
    (e) => {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap detected
        if (scale > 1) {
          resetView();
        } else {
          setScale(2.5);
        }
      }
      lastTapRef.current = now;
    },
    [scale, resetView],
  );

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key="image-viewer-modal"
        className="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-md"
        />

        {/* Controls Layer */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-10 text-white">
          {/* Top Bar */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="flex justify-between items-center pointer-events-auto"
          >
            {isGalleryMode ? (
              <div className="bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                {currentIndex + 1} / {imageList.length}
              </div>
            ) : (
              <div />
            )}
            <button
              onClick={handleClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10"
            >
              <X size={24} />
            </button>
          </motion.div>

          {/* Middle (Nav Buttons) */}
          {isGalleryMode && (
            <div className="flex-1 flex items-center justify-between pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="p-3 bg-black/30 hover:bg-black/50 rounded-full transition-all border border-white/10 ml-[-6px] sm:ml-0"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="p-3 bg-black/30 hover:bg-black/50 rounded-full transition-all border border-white/10 mr-[-6px] sm:mr-0"
              >
                <ChevronRight size={28} />
              </button>
            </div>
          )}

          {/* Bottom Toolbar */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="flex justify-center pointer-events-auto"
          >
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full p-1.5 sm:p-2 shadow-2xl">
              <ToolButton
                icon={ZoomOut}
                onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                label="Zoom Out"
              />
              <div className="px-2 sm:px-3 min-w-[50px] sm:min-w-[60px] text-center font-mono text-xs sm:text-sm font-medium text-white/90">
                {Math.round(scale * 100)}%
              </div>
              <ToolButton
                icon={ZoomIn}
                onClick={() => setScale((s) => Math.min(5, s + 0.25))}
                label="Zoom In"
              />
              <div className="w-px h-5 sm:h-6 bg-white/10 mx-1 sm:mx-2" />
              <ToolButton
                icon={RotateCw}
                onClick={() => setRotation((r) => r + 90)}
                label="Rotate"
              />
              <ToolButton
                icon={Maximize2}
                onClick={resetView}
                label="Reset"
                active={scale !== 1 || rotation !== 0}
              />
              {showDownload && (
                <>
                  <div className="w-px h-5 sm:h-6 bg-white/10 mx-1 sm:mx-2" />
                  <ToolButton
                    icon={Download}
                    onClick={handleDownload}
                    label="Download"
                    className="bg-white/15 hover:bg-white/25 text-white"
                  />
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Image Layer */}
        <motion.div
          ref={containerRef}
          className={cn(
            "absolute inset-0 flex items-center justify-center p-4 sm:p-12 pointer-events-auto touch-none select-none",
            scale > 1 ? "cursor-grab" : "cursor-default",
            isDragging && "cursor-grabbing",
          )}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleDoubleTap}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-white/30">
              <Loader2 size={48} className="animate-spin" />
            </div>
          )}

          {currentImageUrl && (
            <motion.img
              ref={imageRef}
              key={currentImageUrl}
              src={currentImageUrl}
              alt={alt}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
              animate={{
                scale,
                rotate: rotation,
                x: position.x,
                y: position.y,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
              draggable={false}
              className={cn(
                "max-w-full max-h-full object-contain shadow-2xl rounded-sm",
                loading ? "opacity-0" : "opacity-100",
                "transition-opacity duration-200",
              )}
              style={{
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

function ToolButton({ icon: Icon, onClick, label, className, active }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "p-2 sm:p-2.5 rounded-full transition-all duration-200 group active:scale-95",
        active && "ring-2 ring-white/30",
        className || "text-zinc-300 hover:text-white hover:bg-white/10",
      )}
      title={label}
    >
      <Icon
        size={18}
        className="sm:w-5 sm:h-5 transition-transform group-hover:scale-110"
      />
    </button>
  );
}

export default ImageViewerModal;

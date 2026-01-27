import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalSearch } from "./GlobalSearch";
import { X, ArrowLeft } from "lucide-react";

export function SearchModal({ open, onClose }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-[20%] z-[70] flex flex-col rounded-t-2xl bg-[rgb(var(--bg-surface))] shadow-2xl md:hidden"
          >
            <div className="flex items-center gap-2 border-b border-[rgb(var(--border-base))] p-4">
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-[rgb(var(--bg-muted))]"
              >
                <ArrowLeft className="h-6 w-6 text-[rgb(var(--text-primary))]" />
              </button>
              <div className="flex-1">
                {/* Reusing GlobalSearch but enforcing specific styling for mobile */}
                <div className="relative w-full">
                  <GlobalSearch className="w-full" />
                </div>
              </div>
            </div>

            {/* 
                GlobalSearch handles the dropdown logic internally, but in mobile modal,
                we might want the results to take up the full available space below content.
                The GlobalSearch component currently uses absolute positioning for dropdown.
                For the modal, it might be better if the Search component was just the input
                and we rendered results here. 
                
                However, to save time/complexity, let's keep GlobalSearch as is. 
                The dropdown will open "below" the input. 
                On mobile, that absolute positioning relative to input will work, 
                but we need to make sure it doesn't get cut off.
                
                Ideally GlobalSearch should be responsive, or expose its internals.
                
                Alternative: Just put GlobalSearch in the header of this modal. 
                And since GlobalSearch opens an absolute dropdown, it will overlay the empty body of this modal.
                That works.
             */}

            <div className="flex-1 bg-[rgb(var(--bg-base))] p-4">
              <div className="flex flex-col items-center justify-center h-full text-[rgb(var(--text-secondary))] opacity-50">
                <p className="text-sm">
                  Busca cursos, instructores o lecciones
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

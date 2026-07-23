import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black cursor-pointer"
          />

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative z-10 w-full max-w-sm rounded-3xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center font-sans"
          >
            <div className={`w-14 h-14 mx-auto rounded-2xl border-4 border-black flex items-center justify-center mb-4 rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] ${isDestructive ? 'bg-red-500 text-white' : 'bg-amber-400 text-black'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-display font-black text-xl tracking-tight mb-2 uppercase italic">
              {title}
            </h3>
            
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              {message}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl border-4 border-black bg-white text-black font-black uppercase tracking-wider text-xs hover:bg-neutral-50 active:translate-y-px shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                }}
                className={`flex-1 py-3 rounded-xl border-4 border-black text-white font-black uppercase tracking-wider text-xs active:translate-y-px shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer ${
                  isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-neutral-900'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle, Info, X, Bell } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "mom";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: -15 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1, 
                rotateX: 0,
                transition: { type: "spring", stiffness: 350, damping: 25 }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.8, 
                y: -20, 
                transition: { duration: 0.2 }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pointer-events-auto origin-bottom"
            >
              <div className={`
                flex items-start gap-3 p-4 rounded-2xl shadow-lg border-4 border-black bg-white text-black
                backdrop-blur-md relative overflow-hidden transition-all duration-300
                ${toast.type === "success" ? "shadow-[4px_4px_0px_0px_#22c55e]" : ""}
                ${toast.type === "error" ? "shadow-[4px_4px_0px_0px_#ef4444]" : ""}
                ${toast.type === "info" ? "shadow-[4px_4px_0px_0px_#000000]" : ""}
                ${toast.type === "mom" ? "shadow-[4px_4px_0px_0px_#f97316] bg-amber-50" : ""}
              `}>
                {/* Visual bubble effect in corner */}
                <div className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-black/5 blur-sm" />

                <div className="mt-0.5 shrink-0">
                  {toast.type === "success" && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
                  {toast.type === "info" && <Info className="w-5 h-5 text-black" />}
                  {toast.type === "mom" && <Bell className="w-5 h-5 text-amber-600 animate-bounce" />}
                </div>

                <div className="flex-1 text-sm font-medium pr-4 leading-relaxed font-sans">
                  {toast.type === "mom" && (
                    <span className="block text-xs font-bold text-amber-800 tracking-wider font-display mb-0.5">
                      👩 MOM SAYS:
                    </span>
                  )}
                  {toast.message}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="absolute right-3 top-3 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

'use client';

import { CheckCircle2 } from 'lucide-react';

interface ToastNotificationProps {
  message: string | null;
}

export function ToastNotification({ message }: ToastNotificationProps) {
  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-black text-white font-bold px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-bounce">
      <CheckCircle2 className="w-5 h-5 text-gray-900" />
      <span>{message}</span>
    </div>
  );
}

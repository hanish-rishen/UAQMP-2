'use client';

import { useEffect } from 'react';
import SliderSpinner from './SliderSpinner';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  loading?: boolean;
}

export default function SlidePanel({ isOpen, onClose, children, loading = false }: SlidePanelProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 w-1/4 min-w-[400px] bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto z-50 border-l border-gray-200 dark:border-gray-700 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="p-6 pt-16">
        {loading ? <SliderSpinner /> : children}
      </div>
    </div>
  );
}

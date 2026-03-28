'use client';

import { useState } from 'react';
import { Clip } from '@prisma/client';

type ClipStatus = 'pending' | 'generating_image' | 'generating_video' | 'done' | 'error';

interface ClipCardProps {
  clip: Clip;
}

const statusConfig: Record<
  ClipStatus,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    badge: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    icon: <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />,
  },
  generating_image: {
    label: 'Generating Image',
    badge: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
    icon: <SpinnerIcon />,
  },
  generating_video: {
    label: 'Generating Video',
    badge: 'text-indigo-300 bg-indigo-400/10 border-indigo-400/20',
    icon: <SpinnerIcon />,
  },
  done: {
    label: 'Complete',
    badge: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    label: 'Failed',
    badge: 'text-red-300 bg-red-400/10 border-red-400/20',
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

export default function ClipCard({ clip }: ClipCardProps) {
  const [showPrompts, setShowPrompts] = useState(false);
  const status = clip.status as ClipStatus;
  const cfg = statusConfig[status] ?? statusConfig['pending'];
  const isProcessing = status === 'generating_image' || status === 'generating_video';

  return (
    <div className={`glass-card rounded-xl overflow-hidden transition-all duration-200 ${
      isProcessing ? 'border-indigo-500/20' : ''
    }`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-gray-400">
              {clip.stageIndex + 1}
            </div>
            <p className="text-white font-medium text-sm">Stage {clip.stageIndex + 1}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{clip.stageDescription}</p>
      </div>

      {/* Processing animation */}
      {isProcessing && (
        <div className="px-4 pb-3">
          <div className="relative h-1 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 rounded-full animate-indeterminate"
              style={{ width: '60%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1.5">
            {status === 'generating_image' ? 'Generating starting frame...' : 'Creating video with Kling AI...'}
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && clip.errorMessage && (
        <div className="mx-4 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-300 text-xs font-mono break-all leading-relaxed">
            {clip.errorMessage}
          </p>
        </div>
      )}

      {/* Video player */}
      {status === 'done' && clip.videoPath && (
        <div className="mx-4 mb-3">
          <video
            controls
            className="w-full rounded-lg max-h-48 bg-black"
            src={`/api/clips/${clip.id}/video`}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Prompts toggle */}
      <div className="border-t border-white/[0.04] px-4 py-2.5">
        <button
          onClick={() => setShowPrompts((p) => !p)}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform duration-150 ${showPrompts ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showPrompts ? 'Hide prompts' : 'Show prompts'}
        </button>

        {showPrompts && (
          <div className="mt-3 space-y-2">
            <PromptBlock label="Image Prompt" text={clip.imagePrompt} />
            <PromptBlock label="Video Prompt" text={clip.klingPrompt} />
          </div>
        )}
      </div>

    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function PromptBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-gray-500 text-xs font-mono bg-black/30 rounded-lg p-2.5 break-words leading-relaxed">
        {text}
      </p>
    </div>
  );
}

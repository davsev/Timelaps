'use client';

import { useState } from 'react';
import { IdeaTemplate, ProjectType } from '@/lib/templates';

interface IdeaSelectorProps {
  ideas: IdeaTemplate[];
  onSelect: (ideaId: string) => void;
  onClose: () => void;
  loading?: boolean;
}

const typeConfig: Record<ProjectType, { icon: string; color: string; bg: string }> = {
  exterior_construction: {
    icon: '🏗️',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  interior_renovation: {
    icon: '🛋️',
    color: 'text-teal-400',
    bg: 'bg-teal-400/10',
  },
  generic_transformation: {
    icon: '✨',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
};

const typeLabel: Record<ProjectType, string> = {
  exterior_construction: 'Exterior Construction',
  interior_renovation: 'Interior Renovation',
  generic_transformation: 'Transformation',
};

export default function IdeaSelector({
  ideas,
  onSelect,
  onClose,
  loading = false,
}: IdeaSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-white text-lg font-bold">Choose a Project Template</h2>
            <p className="text-gray-500 text-sm mt-0.5">Select a timelapse type to get started</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ideas list */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {ideas.map((idea) => {
            const cfg = typeConfig[idea.type] ?? typeConfig.generic_transformation;
            const isSelected = selectedId === idea.id;
            return (
              <button
                key={idea.id}
                onClick={() => setSelectedId(idea.id)}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                  isSelected
                    ? 'border-indigo-500/60 bg-indigo-500/[0.08] shadow-glow-indigo'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${cfg.bg}`}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-semibold text-sm">{idea.title}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {typeLabel[idea.type]}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{idea.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      <span>Style: <span className="text-gray-500">{idea.style}</span></span>
                      <span>·</span>
                      <span>Ratio: <span className="text-gray-500">{idea.aspectRatio}</span></span>
                    </div>
                  </div>

                  {/* Selected indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
          <p className="text-gray-600 text-xs">
            {selectedId ? '1 template selected' : 'Select a template to continue'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedId || loading}
              className="px-6 py-2 rounded-lg bg-accent-gradient text-white font-semibold hover:opacity-90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loading && <Spinner />}
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

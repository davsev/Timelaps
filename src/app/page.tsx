'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@prisma/client';
import { IdeaTemplate } from '@/lib/templates';
import ProjectList from '@/components/ProjectList';
import IdeaSelector from '@/components/IdeaSelector';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<IdeaTemplate[]>([]);
  const [showIdeas, setShowIdeas] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      setLoadingProjects(true);
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  }

  async function handleOpenIdeas() {
    setError(null);
    setLoadingIdeas(true);
    try {
      const res = await fetch('/api/ideas');
      if (!res.ok) throw new Error('Failed to load ideas');
      const data = await res.json();
      setIdeas(data);
      setShowIdeas(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ideas');
    } finally {
      setLoadingIdeas(false);
    }
  }

  async function handleSelectIdea(ideaId: string) {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to create project');
      }
      const project = await res.json();
      setShowIdeas(false);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setCreating(false);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="mb-12 text-center py-12">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-indigo-300 text-sm font-medium">AI-Powered Video Generation</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
          <span className="gradient-text">TimeLaps</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
          Generate stunning architectural construction timelapse videos automatically.
          One click to go from idea to finished video.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleOpenIdeas}
            disabled={loadingIdeas || creating}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white bg-accent-gradient hover:opacity-90 transition-all duration-200 shadow-glow-indigo disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {loadingIdeas ? (
              <>
                <Spinner className="w-5 h-5" />
                Loading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Timelapse
              </>
            )}
          </button>
        </div>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {['Kling AI Video', 'FFmpeg Rendering', 'Auto Progression', 'Multi-Platform'].map((feature) => (
            <span key={feature} className="text-xs text-gray-500 bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1">
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      {projects.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-gray-500 text-sm font-medium">Your Projects</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {loadingProjects ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Spinner className="w-8 h-8 mr-3" />
          <span>Loading projects...</span>
        </div>
      ) : (
        <ProjectList projects={projects} onCreateNew={handleOpenIdeas} />
      )}

      {showIdeas && (
        <IdeaSelector
          ideas={ideas}
          onSelect={handleSelectIdea}
          onClose={() => {
            if (!creating) setShowIdeas(false);
          }}
          loading={creating}
        />
      )}
    </div>
  );
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clip, Project } from '@prisma/client';
import ProjectDetail from '@/components/ProjectDetail';

type ProjectWithClips = Project & {
  clips: Clip[];
  finalVideoExists: boolean;
};

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectWithClips | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingVideos, setGeneratingVideos] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchProject();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function startPolling() {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => fetchProject(true), 3000);
  }

  function shouldPoll(clips: Clip[]): boolean {
    return clips.some(
      (c) =>
        c.imageStatus === 'generating' ||
        c.status === 'generating_video'
    );
  }

  async function fetchProject(silent = false) {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) {
        if (res.status === 404) { router.push('/'); return; }
        throw new Error('Failed to load project');
      }
      const data: ProjectWithClips = await res.json();
      setProject(data);
      setError(null);
      if (shouldPoll(data.clips)) startPolling();
      else stopPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function handleGenerateImages() {
    setGeneratingImages(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/projects/${id}/generate-images`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to start image generation');
      }
      await fetchProject(true);
      startPolling();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setGeneratingImages(false);
    }
  }

  async function handleGenerateVideos() {
    setGeneratingVideos(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/projects/${id}/generate-videos`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to start video generation');
      }
      await fetchProject(true);
      startPolling();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to generate videos');
    } finally {
      setGeneratingVideos(false);
    }
  }

  async function handleRenderTimelapse() {
    setRendering(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/projects/${id}/render`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to render timelapse');
      }
      await fetchProject(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to render timelapse');
    } finally {
      setRendering(false);
    }
  }

  async function handleRetryImage(clipId: string) {
    setActionError(null);
    try {
      await fetch(`/api/clips/${clipId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'image' }),
      });
      await fetchProject(true);
      startPolling();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Retry failed');
    }
  }

  async function handleRetryVideo(clipId: string) {
    setActionError(null);
    try {
      await fetch(`/api/clips/${clipId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'video' }),
      });
      await fetchProject(true);
      startPolling();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Retry failed');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <svg className="animate-spin h-8 w-8 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading project…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error || 'Project not found'}</p>
        <button onClick={() => router.push('/')} className="text-blue-400 hover:text-blue-300 underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </button>
      </div>

      <ProjectDetail
        project={project}
        clips={project.clips}
        onGenerateImages={handleGenerateImages}
        onGenerateVideos={handleGenerateVideos}
        onRenderTimelapse={handleRenderTimelapse}
        onRetryImage={handleRetryImage}
        onRetryVideo={handleRetryVideo}
        generatingImages={generatingImages}
        generatingVideos={generatingVideos}
        rendering={rendering}
        actionError={actionError}
      />
    </div>
  );
}

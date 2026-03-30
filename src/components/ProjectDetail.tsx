'use client';

import { Clip, Project } from '@prisma/client';
import { stageDefinitions, ProjectType } from '@/lib/templates';

interface ProjectDetailProps {
  project: Project & { finalVideoExists: boolean };
  clips: Clip[];
  onGenerateImages: () => void;
  onGenerateVideos: () => void;
  onRenderTimelapse: () => void;
  onRetryImage: (clipId: string) => void;
  onRetryVideo: (clipId: string) => void;
  generatingImages: boolean;
  generatingVideos: boolean;
  rendering: boolean;
  actionError: string | null;
}

export default function ProjectDetail({
  project,
  clips,
  onGenerateImages,
  onGenerateVideos,
  onRenderTimelapse,
  onRetryImage,
  onRetryVideo,
  generatingImages,
  generatingVideos,
  rendering,
  actionError,
}: ProjectDetailProps) {
  const stages = stageDefinitions[project.type as ProjectType] ?? stageDefinitions.generic_transformation;
  const totalStages = stages.length;

  const allImagesGenerated = clips.length === totalStages && clips.every((c) => c.imageStatus === 'done');
  const anyImageError = clips.some((c) => c.imageStatus === 'error');
  const imagesBusy = clips.some((c) => c.imageStatus === 'generating');

  const videoClips = clips.filter((c) => c.stageIndex > 0);
  const allVideosGenerated = videoClips.length === totalStages - 1 && videoClips.every((c) => c.status === 'done');
  const anyVideoError = videoClips.some((c) => c.status === 'error');
  const videosBusy = videoClips.some((c) => c.status === 'generating_video');

  const canGenerateImages = !imagesBusy && !allImagesGenerated;
  const canGenerateVideos = allImagesGenerated && !videosBusy && !allVideosGenerated;
  const canRender = videoClips.some((c) => c.status === 'done') && !rendering;

  const doneImages = clips.filter((c) => c.imageStatus === 'done').length;
  const doneVideos = videoClips.filter((c) => c.status === 'done').length;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Project header */}
      <div className="glass-card rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-1">{project.name}</h1>
        <p className="text-gray-400 text-sm">{project.description}</p>
        <div className="flex gap-2 mt-3 text-xs">
          <span className="bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg text-gray-500">{project.aspectRatio}</span>
          <span className="bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg text-gray-500">{project.style}</span>
        </div>
      </div>

      {actionError && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-red-300 text-sm">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {actionError}
        </div>
      )}

      {/* ── Phase 1: Images ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-white font-semibold text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center">1</span>
              Stage Images
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">AI generates each stage of the renovation</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">{doneImages}/{totalStages} done</span>
            <button
              onClick={onGenerateImages}
              disabled={!canGenerateImages || generatingImages}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gradient text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-indigo"
            >
              {(generatingImages || imagesBusy) && <Spinner />}
              {imagesBusy ? 'Generating images…' : allImagesGenerated ? '✅ All images done' : 'Generate All Images'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {stages.map((stage, i) => {
            const clip = clips.find((c) => c.stageIndex === i);
            return (
              <StageImageCard
                key={i}
                stageIndex={i}
                description={stage.description}
                clip={clip}
                onRetry={onRetryImage}
              />
            );
          })}
        </div>
      </section>

      {/* ── Phase 2: Videos ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-white font-semibold text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold flex items-center justify-center">2</span>
              Transition Videos
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">Kling AI animates workers transforming each stage</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">{doneVideos}/{totalStages - 1} done</span>
            <button
              onClick={onGenerateVideos}
              disabled={!canGenerateVideos || generatingVideos}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {(generatingVideos || videosBusy) && <Spinner />}
              {videosBusy
                ? 'Generating videos…'
                : !allImagesGenerated
                ? '🔒 Generate images first'
                : allVideosGenerated
                ? '✅ All videos done'
                : 'Generate All Videos'}
            </button>
          </div>
        </div>

        {anyVideoError && (
          <div className="mb-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-xs">
            <svg className="w-4 h-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            A video failed. Click Retry on the failed card below to try again.
          </div>
        )}

        <div className="space-y-3">
          {stages.slice(1).map((stage, i) => {
            const stageIndex = i + 1;
            const clip = clips.find((c) => c.stageIndex === stageIndex);
            const prevClip = clips.find((c) => c.stageIndex === stageIndex - 1);
            return (
              <VideoClipCard
                key={stageIndex}
                stageIndex={stageIndex}
                description={stage.description}
                videoPrompt={stage.videoPrompt ?? ''}
                clip={clip}
                prevClip={prevClip}
                onRetry={onRetryVideo}
              />
            );
          })}
        </div>
      </section>

      {/* ── Phase 3: Final render ───────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-white font-semibold text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center">3</span>
              Final Timelapse
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">Concatenate all videos into one MP4</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRenderTimelapse}
              disabled={!canRender}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {rendering && <Spinner />}
              {rendering ? 'Rendering…' : 'Render Final Video'}
            </button>
            {project.finalVideoExists && (
              <a
                href={`/api/projects/${project.id}/final-video`}
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-sm font-semibold transition-all"
              >
                Download MP4
              </a>
            )}
          </div>
        </div>

        {project.finalVideoExists && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <video
              controls
              className="w-full max-h-[500px] bg-black"
              src={`/api/projects/${project.id}/final-video`}
            />
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Stage image card ─────────────────────────────────────────────────────────

function StageImageCard({
  stageIndex,
  description,
  clip,
  onRetry,
}: {
  stageIndex: number;
  description: string;
  clip?: Clip;
  onRetry: (id: string) => void;
}) {
  const status = clip?.imageStatus ?? 'pending';
  const isGenerating = status === 'generating';
  const isDone = status === 'done';
  const isError = status === 'error';

  return (
    <div
      data-stage-index={stageIndex}
      className="glass-card rounded-xl overflow-hidden flex flex-col"
    >
      {/* Image area */}
      <div className="aspect-[9/16] bg-black/40 relative flex items-center justify-center">
        {isDone && clip?.startImagePath ? (
          <img
            src={`/api/clips/${clip.id}/image`}
            alt={`Stage ${stageIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-2 text-indigo-400">
            <Spinner className="w-6 h-6" />
            <span className="text-xs">Generating…</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 text-red-400 p-3 text-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs">Failed</span>
          </div>
        ) : (
          <div className="text-gray-700 text-xs text-center px-2">
            <span className="text-2xl block mb-1">🖼</span>
            Stage {stageIndex + 1}
          </div>
        )}
      </div>

      {/* Label */}
      <div className="p-2">
        <p className="text-gray-400 text-xs leading-snug line-clamp-2">{description}</p>
        {isError && clip && (
          <button
            onClick={() => onRetry(clip.id)}
            className="mt-1.5 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <RetryIcon /> Retry
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Video clip card ──────────────────────────────────────────────────────────

function VideoClipCard({
  stageIndex,
  description,
  videoPrompt,
  clip,
  prevClip,
  onRetry,
}: {
  stageIndex: number;
  description: string;
  videoPrompt: string;
  clip?: Clip;
  prevClip?: Clip;
  onRetry: (id: string) => void;
}) {
  const status = clip?.status ?? 'pending';
  const isGenerating = status === 'generating_video';
  const isDone = status === 'done';
  const isError = status === 'error';
  const prevImageReady = prevClip?.imageStatus === 'done';
  const thisImageReady = clip?.imageStatus === 'done';

  return (
    <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row gap-4">
      {/* Stage label */}
      <div className="flex-shrink-0 flex items-center gap-3 sm:w-52">
        <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-gray-400">
          {stageIndex}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium leading-snug">{description}</p>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Video player or state */}
      <div className="flex-1">
        {isDone && clip?.videoPath ? (
          <video
            controls
            className="w-full rounded-lg max-h-40 bg-black"
            src={`/api/clips/${clip.id}/video`}
            preload="metadata"
          />
        ) : isGenerating ? (
          <div className="flex items-center gap-2 text-indigo-400 text-sm">
            <Spinner /> Generating video with Kling AI…
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-red-300 text-xs font-mono bg-red-500/10 rounded-lg p-2 break-all">
              {clip?.errorMessage ?? 'Unknown error'}
            </p>
            {clip && (
              <button
                onClick={() => onRetry(clip.id)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
              >
                <RetryIcon /> Retry video generation
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-600 text-xs italic">
            {!prevImageReady || !thisImageReady
              ? 'Waiting for stage images to be generated…'
              : 'Ready — click Generate All Videos to start'}
          </p>
        )}
      </div>

      {/* Video prompt preview */}
      <details className="sm:w-64 text-xs text-gray-600 cursor-pointer">
        <summary className="text-gray-500 hover:text-gray-400 select-none">Show prompt</summary>
        <p className="mt-1.5 text-gray-600 leading-relaxed">{videoPrompt}</p>
      </details>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type VideoStatus = 'pending' | 'generating_video' | 'done' | 'error' | 'no_video';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Waiting', cls: 'text-gray-500 bg-gray-500/10 border-gray-500/20' },
    generating_video: { label: 'Generating', cls: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' },
    done: { label: 'Complete', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
    error: { label: 'Failed', cls: 'text-red-300 bg-red-500/10 border-red-500/20' },
    no_video: { label: 'Start frame', cls: 'text-gray-500 bg-gray-500/10 border-gray-500/20' },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${c.cls} mt-0.5`}>
      {c.label}
    </span>
  );
}

function RetryIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
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

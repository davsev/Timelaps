'use client';

import { Clip, Project } from '@prisma/client';
import { stageDescriptions, ProjectType } from '@/lib/templates';
import ClipCard from './ClipCard';

interface ProjectDetailProps {
  project: Project & { finalVideoExists: boolean };
  clips: Clip[];
  onGenerateNext: () => void;
  onRenderTimelapse: () => void;
  generating: boolean;
  rendering: boolean;
}

const typeConfig: Record<ProjectType, { label: string; icon: string; color: string }> = {
  exterior_construction: { label: 'Exterior Construction', icon: '🏗️', color: 'text-amber-400' },
  interior_renovation: { label: 'Interior Renovation', icon: '🛋️', color: 'text-teal-400' },
  generic_transformation: { label: 'Transformation', icon: '✨', color: 'text-violet-400' },
};

export default function ProjectDetail({
  project,
  clips,
  onGenerateNext,
  onRenderTimelapse,
  generating,
  rendering,
}: ProjectDetailProps) {
  const stages = stageDescriptions[project.type as ProjectType] ?? [];
  const totalStages = stages.length;
  const doneClips = clips.filter((c) => c.status === 'done');
  const hasActiveClip = clips.some(
    (c) => c.status === 'pending' || c.status === 'generating_image' || c.status === 'generating_video'
  );
  const allStagesGenerated = clips.length >= totalStages;
  const canGenerateNext = !hasActiveClip && !allStagesGenerated;
  const canRender = doneClips.length > 0 && !rendering;
  const progressPct = totalStages > 0 ? (doneClips.length / totalStages) * 100 : 0;
  const typeInfo = typeConfig[project.type as ProjectType] ?? typeConfig.generic_transformation;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Project Info Card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{typeInfo.icon}</span>
              <span className={`text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1.5 leading-tight">{project.name}</h1>
            <p className="text-gray-400 text-sm leading-relaxed">{project.description}</p>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                {project.aspectRatio}
              </span>
              <span className="text-gray-600 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                {project.style}
              </span>
            </div>
            <span className="text-gray-700 font-mono text-xs">seed {project.seed}</span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500 font-medium">Generation Progress</span>
            <span className="text-gray-400 font-semibold">
              {doneClips.length} / {totalStages} stages
            </span>
          </div>
          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              }}
            />
          </div>
          {hasActiveClip && (
            <p className="text-xs text-indigo-400 mt-1.5 flex items-center gap-1.5">
              <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generation in progress...
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onGenerateNext}
          disabled={!canGenerateNext || generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-gradient text-white font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-indigo text-sm"
        >
          {generating && <Spinner />}
          {hasActiveClip
            ? '⏳ Generating...'
            : allStagesGenerated
            ? '✅ All Stages Done'
            : `Generate Stage ${clips.length + 1}`}
        </button>

        <button
          onClick={onRenderTimelapse}
          disabled={!canRender}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          {rendering && <Spinner />}
          {rendering ? 'Rendering...' : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Render Full Timelapse
            </>
          )}
        </button>

        {project.finalVideoExists && (
          <a
            href={`/api/projects/${project.id}/final-video`}
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Final Video
          </a>
        )}
      </div>

      {/* Final Video Player */}
      {project.finalVideoExists && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-white font-semibold text-sm">Final Timelapse</h2>
          </div>
          <div className="p-4">
            <video
              controls
              className="w-full rounded-xl bg-black max-h-[500px]"
              src={`/api/projects/${project.id}/final-video`}
              poster=""
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Clips Grid */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-white font-semibold text-base">
            Clips
          </h2>
          <span className="text-xs text-gray-600 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
            {clips.length}/{totalStages} stages
          </span>
        </div>

        {clips.length === 0 ? (
          <div className="glass-card rounded-xl py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 mb-4">
              <svg className="animate-spin w-6 h-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Generating first stage clip...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        )}
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

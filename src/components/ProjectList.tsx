'use client';

import Link from 'next/link';
import { Project } from '@prisma/client';
import { ProjectType } from '@/lib/templates';

interface ProjectListProps {
  projects: Project[];
  onCreateNew?: () => void;
}

const typeConfig: Record<ProjectType, { label: string; icon: string; color: string }> = {
  exterior_construction: {
    label: 'Exterior Construction',
    icon: '🏗️',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  interior_renovation: {
    label: 'Interior Renovation',
    icon: '🛋️',
    color: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  },
  generic_transformation: {
    label: 'Transformation',
    icon: '✨',
    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  },
};

export default function ProjectList({ projects, onCreateNew }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-5">
          <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 10l4.553-2.069A1 1 0 0121 8.876V15a1 1 0 01-1.553.832L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">No projects yet</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Create your first AI-powered architectural timelapse in seconds.
        </p>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-accent-gradient hover:opacity-90 transition-opacity text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create First Project
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const typeInfo = typeConfig[project.type as ProjectType] ?? typeConfig.generic_transformation;
        return (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group block glass-card rounded-xl p-5 hover:border-white/[0.14] transition-all duration-200 hover:shadow-card hover:-translate-y-0.5"
          >
            {/* Type badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${typeInfo.color}`}>
                <span>{typeInfo.icon}</span>
                {typeInfo.label}
              </span>
              <span className="text-gray-600 text-xs">
                {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-white font-semibold text-base mb-1.5 group-hover:text-indigo-300 transition-colors leading-snug">
              {project.name}
            </h3>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
              {project.description}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-md">{project.aspectRatio}</span>
                <span className="text-gray-600">{project.style}</span>
              </div>
              <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                View
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

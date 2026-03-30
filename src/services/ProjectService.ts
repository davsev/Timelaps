import { Project } from '@prisma/client';
import { db } from '@/lib/db';
import {
  ideaTemplates,
  buildMasterPrompt,
  getIdeaById,
  IdeaTemplate,
} from '@/lib/templates';

export type ProjectWithClips = Awaited<ReturnType<ProjectService['getProject']>>;

class ProjectService {
  /**
   * Returns all hard-coded project idea templates
   */
  getIdeas(): IdeaTemplate[] {
    return ideaTemplates;
  }

  /**
   * Creates a project from a selected idea template, then triggers first clip
   */
  async createProject(ideaId: string): Promise<Project> {
    const idea = getIdeaById(ideaId);
    if (!idea) {
      throw new Error(`Idea template not found: ${ideaId}`);
    }

    const seed = Math.floor(Math.random() * 1_000_000);
    const masterPrompt = buildMasterPrompt(idea.type, idea.style, idea.description);

    const project = await db.project.create({
      data: {
        name: idea.title,
        description: idea.description,
        type: idea.type,
        style: idea.style,
        aspectRatio: idea.aspectRatio,
        masterPrompt,
        seed,
      },
    });

    return project;
  }

  /**
   * Get a project with all its clips ordered by stageIndex
   */
  async getProject(id: string) {
    const project = await db.project.findUnique({
      where: { id },
      include: {
        clips: {
          orderBy: { stageIndex: 'asc' },
        },
      },
    });

    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    return project;
  }

  /**
   * Get all projects, newest first
   */
  async listProjects(): Promise<Project[]> {
    return db.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const projectService = new ProjectService();

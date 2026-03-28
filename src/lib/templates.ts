export type ProjectType =
  | 'exterior_construction'
  | 'interior_renovation'
  | 'generic_transformation';

export interface IdeaTemplate {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  style: string;
  aspectRatio: string;
  baseMasterPrompt: string;
}

export const ideaTemplates: IdeaTemplate[] = [
  {
    id: 'modern-villa',
    title: 'Modern Villa Construction',
    description: 'Construction timelapse of a modern two-story villa in a suburban neighborhood',
    type: 'exterior_construction',
    style: 'modern minimalist',
    aspectRatio: '9:16',
    baseMasterPrompt:
      'Ultra photorealistic architectural visualization of a modern two-story villa construction in {style} style, professional architectural photography, 4K quality, photorealistic lighting',
  },
  {
    id: 'loft-renovation',
    title: 'Loft Renovation',
    description:
      'Loft interior renovation from concrete shell to fully furnished industrial-style apartment',
    type: 'interior_renovation',
    style: 'industrial loft',
    aspectRatio: '9:16',
    baseMasterPrompt:
      'Ultra photorealistic architectural visualization of a loft interior renovation in {style} style, professional interior photography, 4K quality, photorealistic lighting',
  },
  {
    id: 'office-redesign',
    title: 'Office Lobby Redesign',
    description: 'Office lobby redesign: from old corporate look to modern minimal design',
    type: 'interior_renovation',
    style: 'modern corporate',
    aspectRatio: '9:16',
    baseMasterPrompt:
      'Ultra photorealistic architectural visualization of an office lobby redesign in {style} style, professional architectural photography, 4K quality, photorealistic lighting',
  },
  {
    id: 'brutalist-tower',
    title: 'Brutalist Residential Tower',
    description: 'Construction of a brutalist residential tower in an urban setting',
    type: 'exterior_construction',
    style: 'brutalist',
    aspectRatio: '9:16',
    baseMasterPrompt:
      'Ultra photorealistic architectural visualization of a brutalist residential tower construction in {style} style, professional architectural photography, 4K quality, photorealistic lighting',
  },
  {
    id: 'scandinavian-house',
    title: 'Scandinavian Wooden House',
    description: 'Scandinavian wooden house construction from foundation to completion',
    type: 'exterior_construction',
    style: 'Scandinavian minimalist',
    aspectRatio: '9:16',
    baseMasterPrompt:
      'Ultra photorealistic architectural visualization of a Scandinavian wooden house construction in {style} style, professional architectural photography, 4K quality, photorealistic lighting',
  },
];

export const stageDescriptions: Record<ProjectType, string[]> = {
  exterior_construction: [
    'Empty plot with surveying equipment',
    'Foundation and footings poured',
    'Structural frame rising from ground',
    'Walls closed, roof structure complete',
    'Exterior cladding and windows installed',
    'Landscaping and final exterior details complete',
  ],
  interior_renovation: [
    'Bare concrete shell with exposed infrastructure',
    'Walls plastered and rough electrical/plumbing installed',
    'Flooring installed and partition walls complete',
    'Paint, ceiling lights, and fixtures installed',
    'Furniture and decor — fully furnished and styled',
  ],
  generic_transformation: [
    'Initial bare state, empty space',
    'Structural changes underway',
    'Surface treatments and finishes applied',
    'Final details and furnishings complete',
  ],
};

export function buildMasterPrompt(
  type: ProjectType,
  style: string,
  description: string
): string {
  return `Ultra photorealistic architectural visualization of ${description} in ${style} style, professional architectural photography, 4K quality, photorealistic lighting`;
}

export function buildImagePrompt(masterPrompt: string, stageDescription: string): string {
  return `${masterPrompt}, showing ${stageDescription}, daylight, cinematic composition`;
}

export function buildKlingPrompt(
  description: string,
  style: string,
  prevStage: string,
  currentStage: string
): string {
  return `Cinematic timelapse of ${description} in ${style} style, locked-off camera, smooth transition from '${prevStage}' to '${currentStage}', ultra realistic, smooth motion, professional architectural visualization`;
}

export function getIdeaById(id: string): IdeaTemplate | undefined {
  return ideaTemplates.find((t) => t.id === id);
}

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

export interface StageDefinition {
  /** Short label shown in the UI */
  description: string;
  /** Full text-to-image prompt for stage 0 (bare state) */
  imagePrompt: string;
  /**
   * For stages 1+: instruction passed to img2img describing WHAT TO ADD
   * to the previous image. Null for stage 0 (uses text2img).
   */
  imageDiff: string | null;
  /**
   * Kling video prompt describing the WORKERS and their ACTION during
   * the transition from the previous stage to this one.
   * Null for stage 0 (no incoming video).
   */
  videoPrompt: string | null;
}

// ─── Idea templates (project presets) ────────────────────────────────────────

export const ideaTemplates: IdeaTemplate[] = [
  {
    id: 'modern-villa',
    title: 'Modern Villa Construction',
    description: 'Construction timelapse of a modern two-story villa in a suburban neighborhood',
    type: 'exterior_construction',
    style: 'modern minimalist',
    aspectRatio: '9:16',
    baseMasterPrompt:
      'Ultra photorealistic architectural visualization of a modern two-story villa construction in modern minimalist style, professional architectural photography, 4K quality, natural daylight',
  },
  {
    id: 'loft-renovation',
    title: 'Loft Interior Renovation',
    description: 'Loft interior renovation from bare concrete shell to a fully furnished space',
    type: 'interior_renovation',
    style: 'industrial loft',
    aspectRatio: '9:16',
    baseMasterPrompt:
      'Ultra photorealistic interior photography of a loft renovation in industrial loft style, locked-off wide-angle camera, consistent viewpoint, 4K quality, natural daylight through large windows',
  },
  {
    id: 'office-redesign',
    title: 'Office Lobby Redesign',
    description: 'Office lobby from old corporate look to modern minimal design',
    type: 'interior_renovation',
    style: 'modern corporate',
    aspectRatio: '9:16',
    baseMasterPrompt:
      'Ultra photorealistic interior photography of an office lobby redesign in modern corporate style, locked-off wide-angle camera, consistent viewpoint, 4K quality, artificial lighting',
  },
  {
    id: 'brutalist-tower',
    title: 'Brutalist Residential Tower',
    description: 'Construction of a brutalist residential tower in an urban setting',
    type: 'exterior_construction',
    style: 'brutalist',
    aspectRatio: '9:16',
    baseMasterPrompt:
      'Ultra photorealistic architectural visualization of a brutalist residential tower construction in brutalist style, professional architectural photography, 4K quality, overcast daylight',
  },
  {
    id: 'scandinavian-house',
    title: 'Scandinavian Wooden House',
    description: 'Scandinavian wooden house construction from foundation to completion',
    type: 'exterior_construction',
    style: 'Scandinavian minimalist',
    aspectRatio: '9:16',
    baseMasterPrompt:
      'Ultra photorealistic architectural visualization of a Scandinavian wooden house construction in Scandinavian minimalist style, professional architectural photography, 4K quality, soft daylight',
  },
];

// ─── Stage definitions per project type ──────────────────────────────────────

export const stageDefinitions: Record<ProjectType, StageDefinition[]> = {
  interior_renovation: [
    {
      description: 'Bare empty room — raw concrete walls and floor, no furniture',
      imagePrompt:
        'Ultra photorealistic interior photograph of a completely bare empty room. Raw concrete walls, bare concrete floor, no furniture, no decoration. Industrial ceiling with exposed concrete and minimal pipes. Large window letting in soft natural daylight. Wide-angle locked-off camera. 8K quality.',
      imageDiff: null,
      videoPrompt: null,
    },
    {
      description: 'Workers lay decorative floor stones and add plants',
      imagePrompt: '',
      imageDiff:
        'The same room but the concrete floor is now covered with large flat natural stone tiles arranged in a geometric pattern. Several large tropical potted plants are placed in the corners. The walls remain bare concrete. Clean, modern zen aesthetic.',
      videoPrompt:
        'Timelapse: two male workers wearing work clothes enter from behind the camera carrying heavy flat natural stones and large tropical potted plants. They methodically lay the stones across the floor in a geometric pattern, grouting between them. They position tall tropical plants in each corner. Workers enter and exit through the camera side multiple times bringing more materials. Ends with workers walking out through the camera. Ultra-fast timelapse speed, smooth motion, professional videography.',
    },
    {
      description: 'Epoxy coating poured and spread over the stone floor',
      imagePrompt: '',
      imageDiff:
        'The same room with the stone floor but now the floor has a thick glossy transparent epoxy coating over the stones, creating a mirror-like reflective surface that shows the stone pattern beneath. The plants remain. Wet glossy look.',
      videoPrompt:
        'Timelapse: two workers in white protective suits and respirator masks enter from behind the camera carrying large buckets of liquid epoxy resin. They pour the clear liquid epoxy across the stone floor and spread it with long rollers and squeegees, creating a perfectly smooth glossy surface. They work quickly and methodically. Workers exit through the camera side. Ultra-fast timelapse speed, smooth motion.',
    },
    {
      description: 'Decorative wooden wall panels and artwork installed',
      imagePrompt: '',
      imageDiff:
        'The same room with the glossy epoxy stone floor and plants but now the concrete walls are covered with warm natural wood cladding panels. Large framed abstract artwork is hung on the main wall. Recessed LED strip lighting is integrated at the ceiling and floor edges, casting a warm glow.',
      videoPrompt:
        'Timelapse: three workers enter from behind the camera, two carrying large wooden wall panels and one carrying a power drill. They measure, cut and mount the wood cladding across all walls. Another worker installs LED strip lighting channels at the ceiling edges. They hang large framed artwork on the main feature wall. Workers frequently enter and exit through the camera side with materials and tools. Ultra-fast timelapse, smooth professional motion.',
    },
    {
      description: 'Furniture placed and final interior styling complete',
      imagePrompt: '',
      imageDiff:
        'The same room now fully furnished. A large sectional sofa and coffee table are centred on the epoxy stone floor. A designer rug lies under the furniture. Decorative cushions and throws are arranged. Pendant lights hang from the ceiling. Small side tables with lamps and art objects complete the space. Fully styled luxury interior.',
      videoPrompt:
        'Timelapse: a team of four movers enter from behind the camera carrying a large modular sofa in sections, a glass coffee table, rolled-up designer rugs, and decorative objects. Two interior designers direct the arrangement, adjusting furniture positions, placing cushions and objects with precision. A worker installs pendant light fixtures from a ladder. The team makes multiple trips in and out through the camera side. Final shot: the beautifully styled room, all workers gone. Ultra-fast timelapse, professional smooth motion.',
    },
  ],

  exterior_construction: [
    {
      description: 'Empty plot — bare land with surveying equipment',
      imagePrompt:
        'Ultra photorealistic photograph of an empty suburban plot of land. Flat graded earth, surveying stakes with strings marking the foundation outline. Surveying tripod and equipment visible. Clear blue sky, warm daylight. Wide-angle locked-off camera from street level. 8K quality.',
      imageDiff: null,
      videoPrompt: null,
    },
    {
      description: 'Foundation trenches dug and concrete footings poured',
      imagePrompt: '',
      imageDiff:
        'The same plot but now the foundation trenches have been excavated and filled with fresh concrete footings. Rebar protrudes from the concrete. Wooden formwork boards around the perimeter. Construction machinery tracks visible in the mud.',
      videoPrompt:
        'Timelapse: a small yellow excavator enters from behind the camera and digs foundation trenches around the marked perimeter. Workers in hard hats and vests follow, placing rebar cages into the trenches. A concrete mixer truck enters, backs up and pours concrete. Workers spread and level the concrete. Machinery and workers exit through the camera side. Ultra-fast timelapse.',
    },
    {
      description: 'Structural steel frame rising from the foundation',
      imagePrompt: '',
      imageDiff:
        'The same plot with the concrete foundation but now a steel structural frame is rising. Steel columns bolted to anchor plates, horizontal beams connecting them. The skeleton of two floors is visible. Construction crane partially visible.',
      videoPrompt:
        'Timelapse: a mobile crane enters from behind the camera and lifts heavy steel columns and beams into position. Workers in hard hats guide the steel into place and bolt connections with impact wrenches. The structural frame grows floor by floor. Workers move quickly throughout. Equipment enters and exits through the camera direction. Ultra-fast timelapse.',
    },
    {
      description: 'Walls closed with exterior cladding going up',
      imagePrompt: '',
      imageDiff:
        'The same steel frame now clad with wall panels and modern exterior cladding. Large floor-to-ceiling windows inserted in openings. The roof structure is complete with roofing membrane. The building form is now recognisable.',
      videoPrompt:
        'Timelapse: workers carry large wall panels and glass window units from the camera side and install them into the steel frame openings. A scissor lift moves along the facade as workers fix cladding at height. Roofers work on the flat roof above. Multiple deliveries of materials arrive from behind the camera. Ultra-fast timelapse.',
    },
    {
      description: 'Landscaping, paving and final exterior complete',
      imagePrompt: '',
      imageDiff:
        'The same building now fully complete with all exterior finishing. Clean modern facade, large windows, front path and driveway paved. Green lawn installed. Ornamental trees and shrubs planted. Exterior lighting fixtures mounted. Completed modern villa.',
      videoPrompt:
        'Timelapse: landscaping crew enters from behind the camera with a sod-laying machine, rolls of lawn turf, and ornamental plants. They pave the driveway, lay the lawn, plant trees and shrubs. An electrician mounts exterior lighting. Painters do final touch-ups on the facade. Workers make many trips in and out through the camera side. Final reveal: the completed building. Ultra-fast timelapse.',
    },
  ],

  generic_transformation: [
    {
      description: 'Initial bare state — empty space',
      imagePrompt:
        'Ultra photorealistic photograph of a completely bare empty space. Clean concrete surfaces, natural daylight. Wide-angle locked-off camera. 8K quality.',
      imageDiff: null,
      videoPrompt: null,
    },
    {
      description: 'Structural changes and base work underway',
      imagePrompt: '',
      imageDiff:
        'The same space but with structural modifications in progress. New partition walls framed out, subfloor work done, rough infrastructure installed.',
      videoPrompt:
        'Timelapse: construction workers enter from behind the camera carrying lumber, tools and materials. They frame walls, install subfloor, and rough in infrastructure. Workers enter and exit through the camera side with materials. Ultra-fast timelapse.',
    },
    {
      description: 'Surface finishes and cladding applied',
      imagePrompt: '',
      imageDiff:
        'The same space with all surfaces finished. Walls plastered and painted, flooring installed, ceiling finished with lighting.',
      videoPrompt:
        'Timelapse: workers enter from behind the camera applying plaster to walls, laying flooring tiles, and installing ceiling panels and lights. Paint rollers and tools in use throughout. Workers enter and exit through the camera side. Ultra-fast timelapse.',
    },
    {
      description: 'Furniture and final decor — fully complete',
      imagePrompt: '',
      imageDiff:
        'The same space now completely furnished and styled. Furniture arranged, decorative objects placed, full ambient lighting on.',
      videoPrompt:
        'Timelapse: movers and interior designers enter from behind the camera carrying furniture pieces and decorative items. They arrange the space methodically. Final adjustments made. Workers exit through the camera side. Fully styled final reveal. Ultra-fast timelapse.',
    },
  ],
};

// ─── Legacy alias (used in existing code) ────────────────────────────────────
export const stageDescriptions: Record<ProjectType, string[]> = Object.fromEntries(
  Object.entries(stageDefinitions).map(([type, stages]) => [
    type,
    stages.map((s) => s.description),
  ])
) as Record<ProjectType, string[]>;

// ─── Prompt builders ──────────────────────────────────────────────────────────

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

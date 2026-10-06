import { ProjectData } from '@/types';

const store = new Map<string, ProjectData>();

export function saveProject(data: Omit<ProjectData, 'id' | 'createdAt'>): ProjectData {
  const id = crypto.randomUUID();
  const project: ProjectData = {
    id,
    canvasJson: data.canvasJson,
    shape: data.shape,
    createdAt: new Date().toISOString(),
  };
  store.set(id, project);
  return project;
}

export function getProject(id: string): ProjectData | null {
  return store.get(id) ?? null;
}
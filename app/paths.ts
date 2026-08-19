export type AppView =
  | 'list'
  | 'characters'
  | 'edit'
  | 'library'
  | 'inspiration'
  | 'admin'
  | 'history'
  | 'playground';

export const PATHS = {
  list: '/',
  characters: '/characters',
  library: '/library',
  inspiration: '/inspiration',
  history: '/history',
  playground: '/lab',
  admin: '/settings',
} as const;

export function editPath(id: string): string {
  return `/chains/${encodeURIComponent(id)}`;
}

export function pathFor(view: AppView, id?: string): string {
  if (view === 'edit') return id ? editPath(id) : PATHS.list;
  return PATHS[view];
}

export function parseAppPath(pathname: string): { view: AppView; id?: string } {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { view: 'list' };
  if (path === '/characters') return { view: 'characters' };
  if (path === '/library') return { view: 'library' };
  if (path === '/inspiration') return { view: 'inspiration' };
  if (path === '/history') return { view: 'history' };
  if (path === '/lab' || path === '/playground') return { view: 'playground' };
  if (path === '/settings' || path === '/admin') return { view: 'admin' };
  const edit = path.match(/^\/chains\/([^/]+)$/);
  if (edit) return { view: 'edit', id: decodeURIComponent(edit[1]) };
  return { view: 'list' };
}

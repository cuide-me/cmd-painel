export const ADMIN_PERMISSIONS = [
  'dashboard.read',
  'finance.read',
  'finance.write',
  'jobs.read',
  'alerts.read',
  'tickets.read',
  'users.read',
  'metrics.write',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminRole = 'admin' | 'operations' | 'support' | 'finance' | 'viewer';

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  admin: ADMIN_PERMISSIONS,
  operations: ['dashboard.read', 'jobs.read', 'alerts.read', 'tickets.read', 'users.read'],
  support: ['dashboard.read', 'alerts.read', 'tickets.read', 'users.read'],
  finance: ['dashboard.read', 'finance.read', 'finance.write', 'users.read'],
  viewer: ['dashboard.read'],
};

export function getAdminRole(claims: Record<string, unknown>): AdminRole | null {
  if (claims.admin === true || claims.role === 'admin') return 'admin';

  const role = claims.role;
  return role === 'operations' || role === 'support' || role === 'finance' || role === 'viewer'
    ? role
    : null;
}

export function hasAdminPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
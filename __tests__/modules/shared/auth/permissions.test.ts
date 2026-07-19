import { ADMIN_PERMISSIONS, getAdminRole, hasAdminPermission } from '@/modules/shared/auth/permissions';

describe('admin permissions', () => {
  it('keeps all permissions available to the compatible admin role', () => {
    expect(getAdminRole({ admin: true })).toBe('admin');
    expect(getAdminRole({ role: 'admin' })).toBe('admin');

    ADMIN_PERMISSIONS.forEach(permission => {
      expect(hasAdminPermission('admin', permission)).toBe(true);
    });
  });

  it('recognizes only supported non-admin roles', () => {
    expect(getAdminRole({ role: 'operations' })).toBe('operations');
    expect(getAdminRole({ role: 'support' })).toBe('support');
    expect(getAdminRole({ role: 'finance' })).toBe('finance');
    expect(getAdminRole({ role: 'viewer' })).toBe('viewer');
    expect(getAdminRole({ role: 'owner' })).toBeNull();
    expect(getAdminRole({})).toBeNull();
  });

  it('does not grant write access to non-admin roles', () => {
    expect(hasAdminPermission('operations', 'jobs.read')).toBe(true);
    expect(hasAdminPermission('support', 'tickets.read')).toBe(true);
    expect(hasAdminPermission('finance', 'users.read')).toBe(true);
    expect(hasAdminPermission('finance', 'finance.read')).toBe(true);
    expect(hasAdminPermission('viewer', 'dashboard.read')).toBe(true);

    expect(hasAdminPermission('operations', 'metrics.write')).toBe(false);
    expect(hasAdminPermission('support', 'jobs.read')).toBe(false);
    expect(hasAdminPermission('finance', 'tickets.read')).toBe(false);
    expect(hasAdminPermission('viewer', 'finance.read')).toBe(false);
    expect(hasAdminPermission('viewer', 'users.read')).toBe(false);
  });
});
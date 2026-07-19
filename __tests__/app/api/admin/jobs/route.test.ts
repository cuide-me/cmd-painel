import { NextRequest, NextResponse } from 'next/server';

const requireAdminPermission = jest.fn();
const getFirebaseAdmin = jest.fn();
const listJobs = jest.fn();

jest.mock('@/lib/server/auth', () => ({
  requireAdminPermission,
}));

jest.mock('@/lib/server/firebaseAdmin', () => ({
  getFirebaseAdmin,
}));

jest.mock('@/services/admin/jobs', () => ({
  listJobs,
}));

import { GET } from '@/app/api/admin/jobs/route';

function jobsRequest(query = '') {
  return new NextRequest(`http://localhost/api/admin/jobs${query}`);
}

describe('GET /api/admin/jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the authorization response without loading jobs', async () => {
    requireAdminPermission.mockResolvedValue({
      error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    });

    const response = await GET(jobsRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'unauthorized' });
    expect(getFirebaseAdmin).not.toHaveBeenCalled();
    expect(listJobs).not.toHaveBeenCalled();
  });

  it('keeps the existing filters when forwarding an authorized request to the service', async () => {
    requireAdminPermission.mockResolvedValue({
      uid: 'admin-panel-user',
      role: 'admin',
      decodedToken: { uid: 'admin-panel-user', admin: true },
    });
    listJobs.mockResolvedValue({ items: [], summary: {}, suggestions: {} });

    const response = await GET(jobsRequest('?pageSize=50&status=active&q=joana&region=Zona%20Sul&bairro=Moema&specialty=enfermagem&criticalOnly=yes&agingMinHours=72'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [], summary: {}, suggestions: {} });
    expect(getFirebaseAdmin).toHaveBeenCalledTimes(1);
    expect(listJobs).toHaveBeenCalledWith({
      pageSize: 50,
      statusFilter: 'active',
      searchTerm: 'joana',
      regionFilter: 'Zona Sul',
      bairroFilter: 'Moema',
      specialtyFilter: 'enfermagem',
      criticalOnly: true,
      agingMinHours: 72,
    });
  });
});
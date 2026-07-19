import { StatCard } from '@/components/admin/AdminLayout';

interface UsersSummaryProps {
  total: number;
  professionals: number;
  families: number;
  verified: number;
  completeProfiles: number;
}

export function UsersSummary({
  total,
  professionals,
  families,
  verified,
  completeProfiles,
}: UsersSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <StatCard label="Total Usuarios" value={total} icon="👤" />
      <StatCard label="Profissionais" value={professionals} icon="👨‍⚕️" />
      <StatCard label="Familias" value={families} icon="👨‍👩‍👧‍👦" />
      <StatCard label="Verificados" value={verified} icon="✅" />
      <StatCard label="Perfil 100%" value={completeProfiles} icon="💯" />
    </div>
  );
}
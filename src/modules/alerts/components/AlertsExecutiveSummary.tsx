interface AlertSummaryCardProps {
  label: string;
  value: string | number;
  tone: 'neutral' | 'critical' | 'warning' | 'info';
  helper: string;
}

export function AlertSummaryCard({ label, value, tone, helper }: AlertSummaryCardProps) {
  const toneClass =
    tone === 'critical'
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : tone === 'info'
          ? 'border-sky-200 bg-sky-50 text-sky-700'
          : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <article className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs">{helper}</p>
    </article>
  );
}

interface AlertsExecutiveSummaryProps {
  openAlerts: number;
  criticalAlerts: number;
  cancellationAndRefundAlerts: number;
  liquidityAlerts: number;
}

export function AlertsExecutiveSummary({
  openAlerts,
  criticalAlerts,
  cancellationAndRefundAlerts,
  liquidityAlerts,
}: AlertsExecutiveSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AlertSummaryCard label="Abertos" value={openAlerts} tone="critical" helper="Excecoes operacionais ainda sem resolucao." />
      <AlertSummaryCard label="Criticos" value={criticalAlerts} tone="critical" helper="Itens com impacto mais alto e resposta prioritaria." />
      <AlertSummaryCard label="Cancelamento e reembolso" value={cancellationAndRefundAlerts} tone="warning" helper="Sinais diretos de friccao, quebra de confianca ou perda financeira." />
      <AlertSummaryCard label="Sem proposta e liquidez" value={liquidityAlerts} tone="info" helper="Fila, cobertura insuficiente e gargalo de matching." />
    </div>
  );
}
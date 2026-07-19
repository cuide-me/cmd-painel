export function UnavailableFinancialPanel({ title, reason, requirements }: { title: string; reason: string; requirements: string[] }) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-base font-semibold text-amber-950">{title} indisponível com segurança</h2>
      <p className="mt-2 text-sm text-amber-900">{reason}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
        {requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
      </ul>
    </section>
  );
}
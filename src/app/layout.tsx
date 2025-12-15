import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Torre de Controle | Cuide-me',
  description: 'Painel administrativo executivo da plataforma Cuide-me',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

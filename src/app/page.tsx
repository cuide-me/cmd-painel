import { redirect } from 'next/navigation';

/**
 * Root page - Redirects to admin panel
 */
export default function HomePage() {
  redirect('/admin');
}

import { redirect } from 'next/navigation';

export default function CookiePreferencesPage() {
  redirect('/privacy?tab=cookies');
}

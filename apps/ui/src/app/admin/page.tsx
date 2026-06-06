import { redirect } from 'next/navigation';

export default function SystemAdminPage() {
  redirect('/admin/groups');
}

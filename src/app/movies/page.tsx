import { redirect } from 'next/navigation';

export default function MoviesPage() {
  // Seamlessly route to the unified Cinema hub with Movies category active
  redirect('/cinema?category=movies');
}

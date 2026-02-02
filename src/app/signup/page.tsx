// src/app/signup/page.tsx
import { redirect } from 'next/navigation';

export default function SignupPage() {
  redirect('/?auth=signup');
}
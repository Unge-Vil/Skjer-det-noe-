import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getUser();
  if (user) redirect(next?.startsWith("/oauth/authorize?") ? next : "/admin");

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

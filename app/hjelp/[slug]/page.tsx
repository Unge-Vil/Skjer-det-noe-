import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  redirect("https://unge-vil.gitbook.io/skjer-det-noe/help-center/");
}
import { redirect } from "next/navigation";

export default function KommuneVolunteerPage() {
  redirect("/kommune/innhold?kind=volunteer");
}

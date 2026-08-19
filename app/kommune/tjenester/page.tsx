import { redirect } from "next/navigation";

export default function KommuneServicesPage() {
  redirect("/kommune/innhold?kind=service");
}

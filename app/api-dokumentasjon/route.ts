import { ApiReference } from "@scalar/nextjs-api-reference";

export const dynamic = "force-dynamic";

export const GET = ApiReference({
  url: "/api/openapi.json",
  pageTitle: "API-dokumentasjon – Skjer det noe?",
  theme: "default",
  hideModels: false,
});
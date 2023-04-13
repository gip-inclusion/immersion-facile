import { StandardPageSlugs } from "src/app/routes/route-params";
import cguContent from "./cgu";
import accessibilityContent from "./declaration-accessibilite";
import legalsContent from "./mentions-legales";
import policiesContent from "./politique-de-confidentialite";
import siteMapContent from "./siteMap";

type StandardPageContent = {
  title: string;
  content: string;
};

const mappedContents: Record<StandardPageSlugs, StandardPageContent> = {
  cgu: cguContent,
  "mentions-legales": legalsContent,
  "politique-de-confidentialite": policiesContent,
  "declaration-accessibilite": accessibilityContent,
  "plan-du-site": siteMapContent,
};

export const getStandardContents = (path: StandardPageSlugs) =>
  mappedContents[path];

import { StandardPageSlugs } from "src/app/routes/routeParams/standardPage";
import accessibilityContent from "./accessibilite";
import budgetContent from "./budget";
import cguContent from "./cgu";
import legalsContent from "./mentions-legales";
import obligationsContent from "./obligations-des-parties";
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
  accessibilite: accessibilityContent,
  "plan-du-site": siteMapContent,
  "obligations-des-parties": obligationsContent,
  budget: budgetContent,
};

export const getStandardContents = (path: StandardPageSlugs) =>
  mappedContents[path];

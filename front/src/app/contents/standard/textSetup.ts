import type { MainWrapperProps } from "react-design-system";
import type { StandardPageSlugs } from "src/app/routes/routeParams/standardPage";
import accessibilityContent from "./accessibilite";
import budgetContent from "./budget";
import cguContent from "./cgu";
import legalsContent from "./mentions-legales";
import obligationsContent from "./obligations-des-parties";
import policiesContent from "./politique-de-confidentialite";
import siteMapContent from "./siteMap";

export type StandardPageContent = {
  title: string;
  content: string;
  layout?: MainWrapperProps["layout"];
};

export type VersionnedStandardContent = {
  latest: StandardPageContent;
} & Record<string, StandardPageContent>;

const mappedContents: Record<StandardPageSlugs, VersionnedStandardContent> = {
  cgu: cguContent,
  "mentions-legales": legalsContent,
  "politique-de-confidentialite": policiesContent,
  accessibilite: accessibilityContent,
  "plan-du-site": siteMapContent,
  "obligations-des-parties": obligationsContent,
  budget: budgetContent,
};

export const getStandardContents = (
  path: StandardPageSlugs,
  version?: string,
): { page: StandardPageContent; version: string; allVersions: string[] } => {
  const allVersions = Object.keys(mappedContents[path]);

  if (version) {
    const page = mappedContents[path][version];
    return {
      page: page ?? mappedContents[path].latest,
      version: page ? version : "latest",
      allVersions,
    };
  }

  return {
    page: mappedContents[path].latest,
    version: "latest",
    allVersions,
  };
};

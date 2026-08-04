import type { ReactElement } from "react";
import type { MainWrapperProps } from "react-design-system";
import type { StandardPageSlugs } from "shared";
import { accessibility } from "./accessibilite";
import budgetContent from "./budget";
import cguContent from "./cgu";
import legalsContent from "./mentions-legales";
import obligationsContent from "./obligations-des-parties";
import policiesContent from "./politique-de-confidentialite";
import siteMapContent from "./siteMap";

export type StandardPageContent = {
  title: string;
  content: () => ReactElement;
  options?: {
    layout?: MainWrapperProps["layout"];
  };
};

export type VersionnedStandardContent = {
  latest: StandardPageContent;
} & Record<string, StandardPageContent>;

const mappedContents: Record<
  StandardPageSlugs,
  VersionnedStandardContent | StandardPageContent
> = {
  cgu: cguContent,
  "mentions-legales": legalsContent,
  "politique-de-confidentialite": policiesContent,
  accessibilite: accessibility,
  "plan-du-site": siteMapContent,
  "obligations-des-parties": obligationsContent,
  budget: budgetContent,
};

export const getStandardContents = (
  path: StandardPageSlugs,
  version?: string,
):
  | { page: StandardPageContent; version: string; allVersions: string[] }
  | { page: StandardPageContent } => {
  const allVersions = Object.keys(mappedContents[path]);
  const content = mappedContents[path];

  if (!("latest" in content)) return { page: content };

  const contentVersion = version ?? "latest";

  return {
    page: content[contentVersion],
    version: contentVersion,
    allVersions,
  };
};

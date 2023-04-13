import React, { ReactNode } from "react";

import { SkipLink, SkipLinks } from "react-design-system";

import { ImmersionFooter } from "./ImmersionFooter";
import { ImmersionHeader } from "./ImmersionHeader";

const skipLinks: SkipLink[] = [
  {
    label: "Contenu principal",
    anchor: "main-content",
  },
  {
    label: "Aide et contact",
    anchor: "over-footer",
  },
  {
    label: "Pied de page",
    anchor: "main-footer",
  },
];
type HeaderFooterLayoutProps = {
  children: ReactNode;
};

export const HeaderFooterLayout = ({ children }: HeaderFooterLayoutProps) => (
  <>
    <SkipLinks links={skipLinks}></SkipLinks>
    <ImmersionHeader />
    {children}
    <ImmersionFooter />
  </>
);

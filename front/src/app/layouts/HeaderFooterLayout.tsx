import React, { ReactNode } from "react";
import { ImmersionFooter } from "src/app/components/ImmersionFooter";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";

type LayoutProps = {
  children: ReactNode;
};

export const HeaderFooterLayout = ({ children }: LayoutProps) => (
  <>
    <ImmersionMarianneHeader />
    {children}
    <ImmersionFooter />
  </>
);

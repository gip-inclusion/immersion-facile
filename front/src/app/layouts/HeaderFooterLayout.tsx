import React, { ReactNode } from "react";
import { ImmersionFooter } from "src/app/components/ImmersionFooter";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";

type HeaderFooterLayoutProps = {
  children: ReactNode;
};

export const HeaderFooterLayout = ({ children }: HeaderFooterLayoutProps) => (
  <>
    <ImmersionMarianneHeader />
    {children}
    <ImmersionFooter />
  </>
);

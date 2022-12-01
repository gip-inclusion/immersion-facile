import React, { ReactNode } from "react";
import { MainWrapper } from "react-design-system/immersionFacile";

type ConventionFormContainerLayoutProps = {
  children: ReactNode;
};

export const ConventionFormContainerLayout = ({
  children,
}: ConventionFormContainerLayoutProps) => (
  <>
    <MainWrapper layout={"default"}>{children}</MainWrapper>
  </>
);

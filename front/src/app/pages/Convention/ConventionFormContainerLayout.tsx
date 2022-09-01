import React, { ReactNode } from "react";
import { MainWrapper } from "src/../../libs/react-design-system";

type ConventionFormContainerLayoutProps = {
  children: ReactNode;
};

export const ConventionFormContainerLayout = ({
  children,
}: ConventionFormContainerLayoutProps) => (
  <>
    <MainWrapper className="fr-container">{children}</MainWrapper>
  </>
);

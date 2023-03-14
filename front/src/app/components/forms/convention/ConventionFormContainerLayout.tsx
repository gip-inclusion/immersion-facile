import React, { ReactNode } from "react";
import { MainWrapper, PageHeader } from "react-design-system";

type ConventionFormContainerLayoutProps = {
  children: ReactNode;
};

export const ConventionFormContainerLayout = ({
  children,
}: ConventionFormContainerLayoutProps) => (
  <>
    <MainWrapper
      layout={"default"}
      pageHeader={
        <PageHeader
          centered
          title={"Formulaire pour conventionner une période d'immersion"}
          theme="candidate"
        />
      }
    >
      {children}
    </MainWrapper>
  </>
);

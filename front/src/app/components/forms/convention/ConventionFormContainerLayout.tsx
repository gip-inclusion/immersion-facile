import React, { ReactNode } from "react";
import { MainWrapper, PageHeader } from "react-design-system/immersionFacile";

type ConventionFormContainerLayoutProps = {
  children: ReactNode;
  title: string;
};

export const ConventionFormContainerLayout = ({
  title,
  children,
}: ConventionFormContainerLayoutProps) => (
  <>
    <MainWrapper
      layout={"boxed"}
      pageHeader={<PageHeader centered title={title} theme="candidate" />}
    >
      {children}
    </MainWrapper>
  </>
);

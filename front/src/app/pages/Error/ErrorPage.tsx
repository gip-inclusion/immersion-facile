import React from "react";
import { ContainerLayout } from "src/app/layouts/ContainerLayout";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";

type ErrorPageProperties = {
  children?: React.ReactNode;
};

export const ErrorPage = ({
  children,
}: ErrorPageProperties): React.ReactElement => (
  <HeaderFooterLayout>
    <ContainerLayout>{children}</ContainerLayout>
  </HeaderFooterLayout>
);

import React from "react";
import { ManagedErrorKind } from "shared";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { ErrorPageContent } from "./ErrorPageContent";

type ErrorPageProperties = {
  type?: ManagedErrorKind;
  message?: string;
  title?: string;
};

export const ErrorPage = ({
  type,
  message,
  title,
}: ErrorPageProperties): React.ReactElement => (
  <HeaderFooterLayout>
    <MainWrapper layout="default" vSpacing={0}>
      <ErrorPageContent type={type} message={message} title={title} />
    </MainWrapper>
  </HeaderFooterLayout>
);

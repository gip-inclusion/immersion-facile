import React from "react";
import { MainWrapper } from "src/../../libs/react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { HTTPFrontErrorType } from "src/app/contents/error/types";
import { ErrorPageContent } from "./ErrorPageContent";

type ErrorPageProperties = {
  children?: React.ReactNode;
  type?: HTTPFrontErrorType;
};

export const ErrorPage = ({
  children,
  type,
}: ErrorPageProperties): React.ReactElement => (
  <HeaderFooterLayout>
    <MainWrapper layout="default" vSpacing={0}>
      {type ? <ErrorPageContent type={type} /> : children}
    </MainWrapper>
  </HeaderFooterLayout>
);

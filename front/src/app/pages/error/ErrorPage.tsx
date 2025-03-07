import React from "react";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { FrontErrorProps } from "src/app/contents/error/types";
import { FrontSpecificError } from "src/app/pages/error/front-errors";
import { ErrorPageContent } from "./ErrorPageContent";

type ErrorPageProperties = {
  error: FrontSpecificError | Error;
};

const getPageContentProps = (
  error: FrontSpecificError | Error,
): FrontErrorProps => {
  if (error instanceof FrontSpecificError) return error.props;

  return {
    title: "Erreur inattendue",
    description: error.message,
    buttons: [],
  };
};

export const ErrorPage = ({
  error,
}: ErrorPageProperties): React.ReactElement => {
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={0}>
        <ErrorPageContent {...getPageContentProps(error)} />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

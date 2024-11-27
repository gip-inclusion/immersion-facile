import React from "react";
import { MainWrapper } from "react-design-system";
import { ManagedErrorKind, expiredMagicLinkErrorMessage } from "shared";
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
}: ErrorPageProperties): React.ReactElement => {
  const shouldShowRefreshEditEstablishmentLink = !!message?.includes(
    expiredMagicLinkErrorMessage,
  );
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={0}>
        <ErrorPageContent
          type={type}
          message={message}
          title={title}
          shouldShowRefreshEditEstablishmentLink={
            shouldShowRefreshEditEstablishmentLink
          }
        />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

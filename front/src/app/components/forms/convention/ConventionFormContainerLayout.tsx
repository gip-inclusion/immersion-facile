import React, { ReactNode } from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { InternshipKind } from "shared";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";

type ConventionFormContainerLayoutProps = {
  children: ReactNode;
  internshipKind: InternshipKind;
};

export const ConventionFormContainerLayout = ({
  children,
  internshipKind,
}: ConventionFormContainerLayoutProps) => {
  const t = useConventionTexts(internshipKind);
  return (
    <>
      <MainWrapper
        layout={"default"}
        pageHeader={
          <PageHeader
            centered
            title={t.intro.conventionTitle}
            theme="candidate"
          />
        }
      >
        {children}
      </MainWrapper>
    </>
  );
};

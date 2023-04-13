import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Route } from "type-route";

import { MainWrapper } from "react-design-system";

import { renderContent } from "html-templates/src/components/email";

import { getStandardContents } from "src/app/contents/standard/textSetup";
import { StandardPageSlugs } from "src/app/routes/route-params";
import { routes } from "src/app/routes/routes";

import { HeaderFooterLayout } from "./HeaderFooterLayout";

type StandardLayoutProps = {
  route: Route<typeof routes.standard>;
};

export const StandardLayout = ({ route }: StandardLayoutProps) => {
  const contents = getStandardContents(
    route.params.pagePath as StandardPageSlugs,
  );
  const { title, content } = contents;
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <h1 className={fr.cx("fr-h2")}>{title}</h1>
        <div
          dangerouslySetInnerHTML={{
            __html: renderContent(content, false) || "",
          }}
        ></div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

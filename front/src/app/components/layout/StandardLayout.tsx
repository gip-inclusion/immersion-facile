import { fr } from "@codegouvfr/react-dsfr";
import { renderContent } from "html-templates/src/components/email";

import { MainWrapper } from "react-design-system";
import { getStandardContents } from "src/app/contents/standard/textSetup";
import type { StandardPageSlugs } from "src/app/routes/routeParams/standardPage";
import type { routes } from "src/app/routes/routes";
import type { Route } from "type-route";
import { HeaderFooterLayout } from "./HeaderFooterLayout";

type StandardLayoutProps = {
  route: Route<typeof routes.standard>;
};

export const StandardLayout = ({ route }: StandardLayoutProps) => {
  const contents = getStandardContents(
    route.params.pagePath as StandardPageSlugs,
  );
  const { title, content, layout } = contents;
  return (
    <HeaderFooterLayout>
      <MainWrapper layout={layout ?? "boxed"}>
        <h1 className={fr.cx("fr-h2")}>{title}</h1>
        <div
          dangerouslySetInnerHTML={{
            __html: renderContent(content, { wrapInTable: false }) || "",
          }}
        />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

import { fr } from "@codegouvfr/react-dsfr";
import { format } from "date-fns";
import { MainWrapper } from "react-design-system";
import { frontRoutes, type StandardPageSlugs } from "shared";
import { getStandardContents } from "src/app/contents/standard/textSetup";
import type { Route } from "type-route";
import { HeaderFooterLayout } from "./HeaderFooterLayout";

type StandardLayoutPageProps = {
  route: Route<typeof frontRoutes.standard>;
};

export const StandardLayoutPage = ({ route }: StandardLayoutPageProps) => {
  const { page, version, allVersions } = getStandardContents(
    route.params.pagePath as StandardPageSlugs,
    route.params.version,
  );
  const { title, content: Content, options } = page;

  return (
    <HeaderFooterLayout>
      <MainWrapper layout={options?.layout ?? "boxed"}>
        <h1 className={fr.cx("fr-h2")}>
          {title} (
          {version === "latest" ? "dernière version" : `version du ${version}`})
        </h1>
        <Content />
        {allVersions.length > 1 ? (
          <>
            <h2 className={fr.cx("fr-h3")}>Versions</h2>
            <ul>
              {allVersions.map((version) => (
                <li key={version}>
                  <a
                    {...frontRoutes.standard({
                      pagePath: route.params.pagePath,
                      version,
                    }).link}
                    className={fr.cx("fr-link")}
                  >
                    {version === "latest"
                      ? "Version actuelle"
                      : `Version du ${format(new Date(version), "dd/MM/yyyy")}`}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

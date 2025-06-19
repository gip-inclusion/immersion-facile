import { Helmet } from "react-helmet-async";
import {
  defaultMetaContents,
  defaultPageMetaContents,
  groupMetaContent,
  type MetaContentType,
  standardMetaContent,
} from "src/app/contents/meta/metaContents";
import type { StandardPageSlugs } from "src/app/routes/routeParams/standardPage";
import { type routes, useRoute } from "src/app/routes/routes";
import type { Route } from "type-route";

export const DefaultMetaContent = (): JSX.Element => {
  const route = useRoute();
  const contents = getMetaContents(route);

  return (
    <Helmet>
      <title>
        {contents
          ? `${contents.title} - PMSMP: Immersion Facile`
          : defaultMetaContents.title}
      </title>
      <meta
        name="description"
        content={
          contents ? contents.description : defaultMetaContents.description
        }
      />
    </Helmet>
  );
};

const getMetaContents = (
  route: Route<typeof routes>,
): MetaContentType | undefined => {
  if (route.name) {
    if (route.name === "standard") {
      return standardMetaContent[route.params.pagePath as StandardPageSlugs];
    }
    if (route.name === "group") {
      return groupMetaContent(route.params.groupSlug);
    }

    return defaultPageMetaContents[route.name];
  }
};

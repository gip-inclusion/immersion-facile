import React from "react";
import { routes, useRoute } from "src/app/routes/routes";
import { Route } from "type-route";
import { StandardPageSlugs } from "src/app/routes/route-params";
import { Helmet, HelmetProvider } from "react-helmet-async";
import {
  adminMetaContent,
  MetaContentType,
  metaContents,
  standardMetaContent,
  defaultMetaContents,
} from "src/app/contents/meta/metaContents";

export const MetaContent = (): JSX.Element => {
  const route = useRoute();
  const contents = getMetaContents(route);

  return (
    <HelmetProvider>
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
    </HelmetProvider>
  );
};

const getMetaContents = (
  route: Route<typeof routes>,
): MetaContentType | undefined => {
  if (route.name) {
    if (route.name === "standard") {
      return standardMetaContent[route.params.pagePath as StandardPageSlugs];
    }
    if (route.name === "adminTab") {
      return adminMetaContent[route.params.tab];
    }
    return metaContents[route.name];
  }
};

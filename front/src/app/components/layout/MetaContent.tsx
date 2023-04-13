import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Route } from "type-route";
import {
  adminMetaContent,
  defaultMetaContents,
  groupMetaContent,
  metaContents,
  MetaContentType,
  standardMetaContent,
} from "src/app/contents/meta/metaContents";
import {
  AuthorizedGroupSlugs,
  StandardPageSlugs,
} from "src/app/routes/route-params";
import { routes, useRoute } from "src/app/routes/routes";

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
    if (route.name === "group") {
      return groupMetaContent(route.params.groupName as AuthorizedGroupSlugs);
    }
    if (route.name === "adminTab") {
      return adminMetaContent[route.params.tab];
    }
    return metaContents[route.name];
  }
};

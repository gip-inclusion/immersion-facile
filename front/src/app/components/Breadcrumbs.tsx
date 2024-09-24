import { fr } from "@codegouvfr/react-dsfr";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { slice } from "ramda";
import React from "react";
import { errors } from "shared";
import { getBreadcrumbs } from "src/app/contents/breadcrumbs/breadcrumbs";
import { useRoute } from "../routes/routes";

export const Breadcrumbs = () => {
  const { name: currentRouteName } = useRoute();
  if (!currentRouteName) return null;
  const segments = getBreadcrumbs({
    currentRouteKey: currentRouteName,
  });
  if (segments.length === 1)
    throw errors.breadcrumbs.notFound({ currentRouteName });
  const ancestors = slice(0, -1, segments);
  return (
    <div className={fr.cx("fr-container", "fr-mt-4w")}>
      <Breadcrumb
        segments={ancestors}
        currentPageLabel={segments[segments.length - 1].label}
      />
    </div>
  );
};

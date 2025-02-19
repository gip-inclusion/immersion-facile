import React from "react";
import { isManagedError } from "shared";
import { contentsMapper } from "src/app/contents/error/textSetup";
import { FrontSpecificError } from "src/app/pages/error/front-errors";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { ErrorPage } from "./ErrorPage";

export type ErrorRedirectRoute = Route<typeof routes.errorRedirect>;

interface ErrorRedirectProps {
  route: ErrorRedirectRoute;
}

export const ErrorRedirectPage = ({
  route,
}: ErrorRedirectProps): JSX.Element => {
  const type = isManagedError(route.params.kind)
    ? route.params.kind
    : undefined;
  const { title, message } = propertiesFromUrl(route);
  const frontError = type
    ? new FrontSpecificError(
        contentsMapper(
          () => {},
          title ?? "Une erreur est survenue",
          message ?? "Une erreur inattendue est survenue",
        )[type],
      )
    : null;

  return <ErrorPage error={frontError ?? new Error("Aucun truc bidule")} />;
};

type RedirectErrorProps = {
  message: string;
  title: string;
};

const propertiesFromUrl = (route: ErrorRedirectRoute): RedirectErrorProps => ({
  message: route.params.message ?? "Une erreur inattendue est survenue",
  title: route.params.title ?? "Une erreur est survenue",
});

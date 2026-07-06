import { establishmentRoutes, type SiretDto } from "shared";

const makeApiPath = (
  routeUrl: string,
  params: Record<string, string>,
): string => {
  const path = Object.entries(params).reduce(
    (url, [key, value]) => url.replace(`:${key}`, value),
    routeUrl,
  );
  return `/api${path}`;
};

export const getFormEstablishmentApiPath = (siret: SiretDto): string =>
  makeApiPath(establishmentRoutes.getFormEstablishment.url, { siret });

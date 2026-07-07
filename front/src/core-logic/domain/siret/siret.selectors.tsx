import { createSelector } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { frontRoutes, type GetSiretInfoError } from "shared";
import type { InvalidSiretError } from "src/core-logic/domain/siret/siret.slice";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const siretState = createRootSelector(({ siret }) => siret);

const currentSiret = createSelector(
  siretState,
  ({ currentSiret }) => currentSiret,
);

const establishmentInfos = createSelector(
  siretState,
  ({ establishment }) => establishment,
);

const countryCode = createSelector(
  siretState,
  ({ countryCode }) => countryCode,
);

const isFetching = createSelector(siretState, ({ isSearching }) => isSearching);

const shouldFetchEvenIfAlreadySaved = createSelector(
  siretState,
  ({ shouldFetchEvenIfAlreadySaved }) => shouldFetchEvenIfAlreadySaved,
);

const siretRawError = createSelector(siretState, ({ error }) => error);

const siretErrorToDisplay = createSelector(
  siretRawError,
  (error): ReactNode | null => {
    if (!error) return null;
    return errorTranslations[error] ?? error;
  },
);

const isSiretAlreadySaved = createSelector(
  siretState,
  ({ error }) => error === "Establishment with this siret is already in our DB",
);

const errorTranslations: Partial<
  Record<GetSiretInfoError | InvalidSiretError, ReactNode>
> = {
  "Missing establishment on SIRENE API.":
    "Nous n'avons pas trouvé d'établissement correspondant à votre SIRET.",
  "SIRENE API not available.":
    "Le service de vérification du SIRET est indisponible.",
  "SIRET must be 14 digits": "Le SIRET doit être composé de 14 chiffres",
  "Establishment with this siret is already in our DB": (
    <span>
      Cet établissement est déjà référencé. Veuillez faire une{" "}
      <a
        href={frontRoutes.myAccountEstablishmentRegistration().href}
        rel="noreferrer"
      >
        demande de rattachement
      </a>{" "}
      afin d'obtenir les droits de gestion nécessaires.
    </span>
  ),
  "Too many requests on SIRENE API.":
    "Le service de vérification du SIRET a reçu trop d'appels.",
};

export const siretSelectors = {
  isSiretAlreadySaved,
  siretErrorToDisplay,
  siretRawError,
  currentSiret,
  establishmentInfos,
  isFetching,
  shouldFetchEvenIfAlreadySaved,
  countryCode,
};

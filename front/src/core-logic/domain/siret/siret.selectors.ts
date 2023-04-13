import { createSelector } from "@reduxjs/toolkit";

import { GetSiretInfoError } from "shared";

import { InvalidSiretError } from "src/core-logic/domain/siret/siret.slice";
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

const isFetching = createSelector(siretState, ({ isSearching }) => isSearching);

const shouldFetchEvenIfAlreadySaved = createSelector(
  siretState,
  ({ shouldFetchEvenIfAlreadySaved }) => shouldFetchEvenIfAlreadySaved,
);

const siretRawError = createSelector(siretState, ({ error }) => error);

const siretErrorToDisplay = createSelector(
  siretRawError,
  (error): string | null => {
    if (!error) return null;
    return errorTranslations[error] ?? error;
  },
);

const isSiretAlreadySaved = createSelector(
  siretState,
  ({ error }) => error === "Establishment with this siret is already in our DB",
);

const errorTranslations: Partial<
  Record<GetSiretInfoError | InvalidSiretError, string>
> = {
  "Missing establishment on SIRENE API.":
    "Nous n'avons pas trouvé d'établissement correspondant à votre SIRET.",
  "SIRENE API not available.":
    "Le service de vérification du SIRET est indisponible.",
  "SIRET must be 14 digits": "Le SIRET doit être composé de 14 chiffres",
  "Establishment with this siret is already in our DB":
    "Cet établissement est déjà référencé",
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
};

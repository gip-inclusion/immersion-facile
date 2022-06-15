import { createSelector } from "@reduxjs/toolkit";
import { prop } from "ramda";
import { InvalidSiretError } from "src/core-logic/domain/siret/siret.slice";
import { GetSiretInfoError } from "src/core-logic/ports/SiretGatewayThroughBack";
import { createRootSelector } from "src/core-logic/storeConfig/store";

const siretState = createRootSelector(prop("siret"));

const currentSiret = createSelector(siretState, prop("currentSiret"));

const siretError = createSelector(siretState, ({ error }): string | null => {
  if (!error) return null;
  return errorTranslations[error] ?? error;
});

const isSiretAlreadySaved = createSelector(
  siretState,
  ({ error }) => error === "Establishment with this siret is already in our DB",
);

export const siretSelectors = {
  isSiretAlreadySaved,
  siretError,
  currentSiret,
  siretState,
};

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

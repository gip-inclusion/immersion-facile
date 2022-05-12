import { createSelector } from "@reduxjs/toolkit";
import { InvalidSiretError } from "src/core-logic/domain/siret/siret.slice";
import { GetSiretInfoError } from "src/core-logic/ports/SiretGatewayThroughBack";
import { createRootSelector } from "src/core-logic/storeConfig/store";

export const siretStateSelector = createRootSelector(
  ({ siret: { error, ...rest } }) => rest,
);

export const currentSiretSelector = createSelector(
  siretStateSelector,
  (state) => state.currentSiret,
);

export const siretErrorSelector = createRootSelector((state) =>
  state.siret.error ? errorTranslations[state.siret.error] : null,
);

const errorTranslations: Record<GetSiretInfoError | InvalidSiretError, string> =
  {
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

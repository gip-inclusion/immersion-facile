import React from "react";
import { SiretFetcherInput } from "./SiretFetcherInput";

export const SiretModalContent = () => (
  <>
    <p>
      Pour enregistrer ou modifier votre entreprise déjà référencée, veuillez
      entrer votre SIRET
    </p>
    <SiretFetcherInput placeholder="Entrez le Siret de votre entreprise" />
  </>
);

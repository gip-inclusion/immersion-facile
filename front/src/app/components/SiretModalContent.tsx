import React, { useEffect } from "react";
import { useEstablishmentSiret } from "src/app/hooks/siret.hooks";
import { SiretFetcherInput } from "./SiretFetcherInput";

export const SiretModalContent = () => {
  const { clearSiret } = useEstablishmentSiret({
    shouldFetchEvenIfAlreadySaved: false,
  });
  useEffect(() => {
    clearSiret();
  }, []);

  return (
    <>
      <p>
        Pour enregistrer ou modifier votre entreprise déjà référencée, veuillez
        entrer votre SIRET
      </p>
      <SiretFetcherInput
        placeholder="Entrez le Siret de votre entreprise"
        shouldFetchEvenIfAlreadySaved={false}
      />
    </>
  );
};

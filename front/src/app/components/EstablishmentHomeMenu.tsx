import React, { useEffect } from "react";

import { ButtonHome, Link } from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import { Section } from "src/app/components/Section";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";
import { EstablishmentSubTitle } from "../pages/home/components/EstablishmentSubTitle";
import { EstablishmentTitle } from "../pages/home/components/EstablishmentTitle";
import { routes } from "../routing/routes";
import { useEstablishmentSiret } from "src/hooks/siret.hooks";
import { SiretFetcherInput } from "src/app/components/SiretFetcherInput";

export const EstablishmentHomeMenu = () => {
  const shouldFetchEvenIfAlreadySaved = false;
  const { isReadyForRequestOrRedirection, clearSiret, modifyLinkWasSent } =
    useEstablishmentSiret({
      shouldFetchEvenIfAlreadySaved,
    });
  const dispatch = useDispatch();

  useEffect(clearSiret, []);
  const styleType = "establishment";

  return (
    <Section type={styleType} className="max-h-[300px]">
      <div className="flex flex-col">
        <EstablishmentTitle type={styleType} text="ENTREPRISE" />
        {!modifyLinkWasSent && (
          <EstablishmentSubTitle
            type={styleType}
            text="Vos équipes souhaitent accueillir en immersion professionnelle ?"
          />
        )}
      </div>
      <div className="flex flex-col w-full h-full items-center justify-center">
        {!isReadyForRequestOrRedirection ? (
          <ul className="fr-btns-group">
            <li>
              <ButtonHome
                onClick={() => {
                  dispatch(establishmentSlice.actions.gotReady());
                }}
              >
                Référencer votre entreprise
              </ButtonHome>
            </li>
            <li>
              <ButtonHome
                type="establishment-secondary"
                onClick={() => {
                  dispatch(establishmentSlice.actions.gotReady());
                }}
              >
                Modifier votre entreprise
              </ButtonHome>
            </li>
          </ul>
        ) : (
          <SiretFetcherInput
            shouldFetchEvenIfAlreadySaved={shouldFetchEvenIfAlreadySaved}
            placeholder={"SIRET de votre entreprise"}
          />
        )}
      </div>
      {!modifyLinkWasSent && (
        <div className="pb-4">
          <Link
            text="En savoir plus"
            url={routes.landingEstablishment().link}
          />
        </div>
      )}
    </Section>
  );
};

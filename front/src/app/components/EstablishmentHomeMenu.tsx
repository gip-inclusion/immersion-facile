import SendRoundedIcon from "@mui/icons-material/SendRounded";
import React, { useEffect } from "react";
import {
  ButtonHome,
  ImmersionTextField,
  Link,
} from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import { Section } from "src/app/components/Section";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { useSendModifyEstablishmentLink } from "src/hooks/establishment.hooks";
import { useSiretFetcher } from "src/hooks/siret.hooks";
import { EstablishmentSubTitle } from "../pages/home/components/EstablishmentSubTitle";
import { EstablishmentTitle } from "../pages/home/components/EstablishmentTitle";
import { routes } from "../routing/routes";
import { useAppSelector } from "../utils/reduxHooks";

export const EstablishmentHomeMenu = () => {
  const { currentSiret, updateSiret, siretErrorToDisplay } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: false,
  });
  const { sendModifyEstablishmentLink } = useSendModifyEstablishmentLink();
  const dispatch = useDispatch();
  const isSiretAlreadySaved = useAppSelector(
    siretSelectors.isSiretAlreadySaved,
  );
  const modifyLinkWasSent = useAppSelector(
    establishmentSelectors.wasModifyLinkSent,
  );
  const isReadyForRequestOrRedirection = useAppSelector(
    establishmentSelectors.isReadyForLinkRequestOrRedirection,
  );
  const clearSiret = () => updateSiret("");

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
          <>
            <ImmersionTextField
              className="w-2/3"
              name="siret"
              value={currentSiret}
              placeholder="SIRET de votre entreprise"
              error={isSiretAlreadySaved ? "" : siretErrorToDisplay}
              onChange={(e) => updateSiret(e.target.value)}
            />
            {isSiretAlreadySaved && !modifyLinkWasSent && (
              <ModifyEstablishmentRequestForMailUpdate
                onClick={() => sendModifyEstablishmentLink(currentSiret)}
              />
            )}
            {modifyLinkWasSent && <ModifyEstablishmentRequestNotification />}
          </>
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

const ModifyEstablishmentRequestNotification = () => (
  <>
    <SendRoundedIcon
      className="py-1"
      sx={{ color: "#3458a2", fontSize: "xx-large" }}
    />
    <EstablishmentSubTitle type="establishment" text="Demande envoyée" />
    <p className="text-immersionBlue-dark  text-center text-xs py-2">
      Un e-mail a été envoyé au référent de cet établissement avec un lien
      permettant la mise à jour des informations. Le lien est valable 24h.
    </p>
  </>
);

type ModifyEstablishmentRequestForMailUpdateProps = {
  onClick: () => void;
};

const ModifyEstablishmentRequestForMailUpdate = ({
  onClick,
}: ModifyEstablishmentRequestForMailUpdateProps) => (
  <>
    <span className="text-immersionBlue-dark  text-center text-xs pb-2">
      Nous avons bien trouvé votre établissement dans notre base de donnée.
    </span>
    <ButtonHome type="establishment-secondary" onClick={onClick}>
      Recevoir le mail de modification
    </ButtonHome>
  </>
);

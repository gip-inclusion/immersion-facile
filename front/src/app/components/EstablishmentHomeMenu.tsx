import SendRoundedIcon from "@mui/icons-material/SendRounded";
import React, { useState } from "react";
import { HomeButton, Link } from "react-design-system/immersionFacile";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";
import { isSiretAlreadySavedSelector } from "src/core-logic/domain/siret/siret.selectors";
import { useSendModifyEstablishmentLink } from "src/hooks/establishment.hooks";
import { useSiretFetcher } from "src/hooks/siret.hooks";
import { ImmersionTextField } from "src/uiComponents/form/ImmersionTextField";
import { EstablishmentSubTitle } from "../pages/home/components/EstablishmentSubTitle";
import { EstablishmentTitle } from "../pages/home/components/EstablishmentTitle";
import { routes } from "../routing/routes";
import { useAppSelector } from "../utils/reduxHooks";
export const EstablishmentHomeMenu = () => {
  const { currentSiret, updateSiret, siretError } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: false,
  });
  const { sendModifyEstablishmentLink } = useSendModifyEstablishmentLink();
  const isSiretAlreadySaved = useAppSelector(isSiretAlreadySavedSelector);
  const modifyLinkWasSent = useAppSelector(
    establishmentSelectors.wasModifyLinkSent,
  );

  const [startEstablishmentPath, startEstablishmentPathUpdate] =
    useState<boolean>(false);

  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-blue-200 rounded px-4 p-1 m-2 w-48 bg-blue-50  `}
      style={{ width: "400px", height: "250px" }}
    >
      <div className="flex flex-col">
        <EstablishmentTitle type={"establishment"} text="ENTREPRISE" />
        {!modifyLinkWasSent && (
          <EstablishmentSubTitle
            type={"establishment"}
            text="Vos équipes souhaitent accueillir en immersion professionnelle ?"
          />
        )}
      </div>
      <div className="flex flex-col w-full h-full items-center justify-center">
        {!startEstablishmentPath ? (
          <>
            <HomeButton onClick={() => startEstablishmentPathUpdate(true)}>
              Référencer votre entreprise
            </HomeButton>
            <HomeButton
              type="secondary"
              onClick={() => startEstablishmentPathUpdate(true)}
            >
              Modifier votre entreprise
            </HomeButton>
          </>
        ) : (
          <>
            <ImmersionTextField
              className="w-2/3"
              name="siret"
              value={currentSiret}
              placeholder="SIRET de votre entreprise"
              error={isSiretAlreadySaved ? "" : siretError}
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
        <Link text="En savoir plus" url={routes.landingEstablishment().link} />
      )}
    </div>
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
      permettant la mise à jour des informations.
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
    <HomeButton type="secondary" onClick={onClick}>
      Recevoir le mail de modification
    </HomeButton>
  </>
);

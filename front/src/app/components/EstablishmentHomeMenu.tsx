import SendRoundedIcon from "@mui/icons-material/SendRounded";
import React, { useEffect, useState } from "react";
import { ClientApplication } from "src/clientApplication/ClientApplication";
import { EstablishementCallToAction } from "src/core-logic/domain/establishments/EstablishementCallToAction";
import { ModifyEstablishmentEvent } from "src/core-logic/events/modifyEstablishment.ts/ModifyEstablishmentEvent";
import { VerifySiretEvent } from "src/core-logic/events/verifySiret/VerifySiretEvent";
import { establishementCallToActionObservable$ } from "src/infra/gateway/EstablishmentUiGateway.ts/ReactEstablishmentUiGateway";
import { SiretDto } from "src/shared/siret";
import { ButtonLink, HomeButton } from "src/uiComponents/Button";
import { ImmersionTextField } from "src/uiComponents/form/ImmersionTextField";
import { Link } from "src/uiComponents/Link";
import {
  EstablishmentSubTitle,
  EstablishmentTitle,
} from "src/uiComponents/Title";
import { useObservable } from "src/useObservable";
import { routes } from "../routing/routes";

interface EstablishmentHomeMenuProperties {
  clientApplication: ClientApplication;
}

export const EstablishmentHomeMenu = ({
  clientApplication,
}: EstablishmentHomeMenuProperties) => {
  useEffect(() => {
    siret === "" && clientApplication.onEvent(new VerifySiretEvent(siret));
  });
  const callToAction: EstablishementCallToAction = useObservable(
    establishementCallToActionObservable$,
    EstablishementCallToAction.NOTHING,
  );
  const [startEstablishmentPath, startEstablishmentPathUpdate] =
    useState<boolean>(false);
  const [siret, siretUpdate] = useState<SiretDto>("");
  const [inputTimeout, inputTimeoutUpdate] = useState<
    NodeJS.Timeout | undefined
  >(undefined);
  const badSiretError = (callToAction: EstablishementCallToAction) =>
    callToAction == EstablishementCallToAction.BAD_SIRET
      ? "Votre SIRET doît contenir 14 chiffres"
      : undefined;
  return (
    <div
      className={`border-2 border-blue-200 px-4 p-1 m-2 w-48 bg-blue-50 flex flex-col items-center justify-center `}
      style={{ width: "400px", height: "250px" }}
    >
      <div className="flex flex-col">
        <EstablishmentTitle type={"establishment"} text="ENTREPRISE" />
        {callToAction !==
          EstablishementCallToAction.MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION && (
          <EstablishmentSubTitle
            type={"establishment"}
            text="Vos équipes souhaitent accueillir en immersion professionnelle ?"
          />
        )}
      </div>
      <div className="flex flex-col w-full h-full items-center justify-center">
        {!startEstablishmentPath ? (
          <HomeButton
            onClick={() => startEstablishmentPathUpdate(true)}
            children="Référencer ou modifier votre entreprise"
          />
        ) : (
          <>
            {(callToAction === EstablishementCallToAction.NOTHING ||
              callToAction === EstablishementCallToAction.BAD_SIRET) && (
              <ImmersionTextField
                className="w-2/3"
                name="siret"
                value={siret}
                placeholder="SIRET de votre entreprise"
                error={badSiretError(callToAction)}
                onChange={(event) =>
                  onSiretFieldChange(
                    event,
                    clientApplication,
                    siretUpdate,
                    inputTimeout,
                    inputTimeoutUpdate,
                  )
                }
              />
            )}
            {callToAction ===
              EstablishementCallToAction.REGISTER_ESTABLISHEMENT && (
              <ButtonLink
                text={`Valider le SIRET`}
                url={routes.formEstablishment().link}
              />
            )}
            {callToAction ===
              EstablishementCallToAction.MODIFY_ESTABLISHEMENT && (
              <HomeButton
                type="secondary"
                onClick={() =>
                  siret &&
                  clientApplication.onEvent(new ModifyEstablishmentEvent(siret))
                }
                children="Modifier votre entreprise"
              />
            )}
            {callToAction ===
              EstablishementCallToAction.MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION && (
              <ModifyEstablishmentRequestNotification />
            )}
          </>
        )}
      </div>
      {callToAction !==
        EstablishementCallToAction.MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION && (
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
      Un e-mail à été envoyé au référent de cet établissement avec un lien
      permettant la mise à jour des informations.
    </p>
  </>
);

const onSiretFieldChange = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  clientApplication: ClientApplication,
  siretUpdate: React.Dispatch<React.SetStateAction<SiretDto>>,
  timeout: NodeJS.Timeout | undefined,
  timeoutUpdate: React.Dispatch<
    React.SetStateAction<NodeJS.Timeout | undefined>
  >,
) => {
  siretUpdate(event.target.value);
  timeout && clearTimeout(timeout);
  timeoutUpdate(
    setTimeout(
      () => clientApplication.onEvent(new VerifySiretEvent(event.target.value)),
      1000,
    ),
  );
};

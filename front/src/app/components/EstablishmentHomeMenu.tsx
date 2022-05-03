import SendRoundedIcon from "@mui/icons-material/SendRounded";
import React, { useEffect, useState } from "react";
import { ModifyEstablishmentEvent } from "src/domain/events/modifyEstablishment.ts/ModifyEstablishmentEvent";
import { VerifySiretEvent } from "src/domain/events/verifySiret/VerifySiretEvent";
import { establishementCallToActionObservable$ } from "src/infra/gateway/EstablishmentUiGateway/ReactEstablishmentUiGateway";
import { SiretDto } from "src/shared/siret";
import { ButtonLink, HomeButton } from "src/uiComponents/Button";
import { ImmersionTextField } from "src/uiComponents/form/ImmersionTextField";
import { Link } from "src/uiComponents/Link";
import { useObservable } from "src/useObservable";
import { routes } from "../routing/routes";
import { EstablishmentSubTitle } from "../pages/home/components/EstablishmentSubTitle";
import { EstablishmentTitle } from "../pages/home/components/EstablishmentTitle";
import { ClientApplication } from "src/infra/application/ClientApplication";
import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";

interface EstablishmentHomeMenuProperties {
  clientApplication: ClientApplication;
}

const badEstablishmentCallToActionNotifications: Partial<
  Record<EstablishementCallToAction, string>
> = {
  BAD_SIRET: "Votre SIRET doît contenir 14 chiffres",
  CLOSED_ESTABLISHMENT_ON_SIRENE: "Votre établissement est fermé",
  MISSING_ESTABLISHMENT_ON_SIRENE: "Votre établissement n'existe pas",
};

export const EstablishmentHomeMenu = ({
  clientApplication,
}: EstablishmentHomeMenuProperties) => {
  useEffect(() => {
    siret === "" && clientApplication.onEvent(new VerifySiretEvent(siret));
  });
  const callToAction: EstablishementCallToAction = useObservable(
    establishementCallToActionObservable$,
    "NOTHING",
  );
  const [startEstablishmentPath, startEstablishmentPathUpdate] =
    useState<boolean>(false);
  const [siret, siretUpdate] = useState<SiretDto>("");
  const [inputTimeout, inputTimeoutUpdate] = useState<
    NodeJS.Timeout | undefined
  >(undefined);
  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-blue-200 rounded px-4 p-1 m-2 w-48 bg-blue-50  `}
      style={{ width: "400px", height: "250px" }}
    >
      <div className="flex flex-col">
        <EstablishmentTitle type={"establishment"} text="ENTREPRISE" />
        {callToAction !== "MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION" && (
          <EstablishmentSubTitle
            type={"establishment"}
            text="Vos équipes souhaitent accueillir en immersion professionnelle ?"
          />
        )}
      </div>
      <div className="flex flex-col w-full h-full items-center justify-center">
        {!startEstablishmentPath ? (
          <>
            <HomeButton
              onClick={() => startEstablishmentPathUpdate(true)}
              children="Référencer votre entreprise"
            />
            <HomeButton
              type="secondary"
              onClick={() => startEstablishmentPathUpdate(true)}
              children="Modifier votre entreprise"
            />
          </>
        ) : (
          <>
            {isNothingOrErrorCallToAction(callToAction) && (
              <ImmersionTextField
                className="w-2/3"
                name="siret"
                value={siret}
                placeholder="SIRET de votre entreprise"
                error={badEstablishmentCallToActionNotifications[callToAction]}
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
            {callToAction === "REGISTER_ESTABLISHEMENT" && (
              <ButtonLink
                text={`Référencer votre entreprise`}
                url={routes.formEstablishment({ siret }).link}
              />
            )}
            {callToAction === "MODIFY_ESTABLISHEMENT" &&
              modifyEstablishmentRequestForMailUpdate({
                siret,
                clientApplication,
              })}
            {callToAction === "MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION" && (
              <ModifyEstablishmentRequestNotification />
            )}
          </>
        )}
      </div>
      {callToAction !== "MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION" && (
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

type ModifyEstablishmentRequestForMailUpdateProps = {
  siret: SiretDto;
  clientApplication: ClientApplication;
};

const modifyEstablishmentRequestForMailUpdate = ({
  siret,
  clientApplication,
}: ModifyEstablishmentRequestForMailUpdateProps) => (
  <>
    <p className="text-immersionBlue-dark  text-center text-xs py-2">
      Nous avons bien trouvé votre établissement dans notre base de donnée.
    </p>
    <HomeButton
      type="secondary"
      onClick={() =>
        siret && clientApplication.onEvent(new ModifyEstablishmentEvent(siret))
      }
    >
      Recevoir le mail de modification
    </HomeButton>
  </>
);

function isNothingOrErrorCallToAction(
  callToAction: EstablishementCallToAction,
) {
  return (
    callToAction === "NOTHING" ||
    callToAction === "BAD_SIRET" ||
    callToAction === "CLOSED_ESTABLISHMENT_ON_SIRENE" ||
    callToAction === "MISSING_ESTABLISHMENT_ON_SIRENE"
  );
}

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import React, { useEffect, useState } from "react";
import { ModifyEstablishmentEvent } from "src/domain/events/modifyEstablishment.ts/ModifyEstablishmentEvent";
import { VerifySiretEvent } from "src/domain/events/verifySiret/VerifySiretEvent";
import { EstablishementCallToAction } from "src/domain/valueObjects/EstablishementCallToAction";
import { ClientApplication } from "src/infra/application/ClientApplication";
import { SiretDto } from "shared/src/siret";
import { HomeButton } from "src/uiComponents/Button";
import { ImmersionTextField } from "src/uiComponents/form/ImmersionTextField";
import { Link } from "src/uiComponents/Link";
import { EstablishmentSubTitle } from "../pages/home/components/EstablishmentSubTitle";
import { EstablishmentTitle } from "../pages/home/components/EstablishmentTitle";
import { routes } from "../routing/routes";
import { useAppSelector } from "../utils/reduxHooks";

interface EstablishmentHomeMenuProperties {
  clientApplication: ClientApplication;
}

const badEstablishmentCallToActionNotifications: Partial<
  Record<EstablishementCallToAction, string>
> = {
  ERROR_BAD_SIRET: "Votre SIRET doit contenir 14 chiffres.",
  ERROR_CLOSED_ESTABLISHMENT_ON_SIRENE: "Votre établissement est fermé.",
  ERROR_MISSING_ESTABLISHMENT_ON_SIRENE: "Votre établissement n'existe pas.",
  ERROR_TOO_MANY_REQUESTS_ON_SIRET_API:
    "Le service de vérification du SIRET a reçu trop d'appels.",
  ERROR_SIRENE_API_UNAVAILABLE:
    "Le service de vérification du SIRET est indisponible.",
  ERROR_UNEXPECTED_ERROR:
    "Erreur inattendue avec le service de vérification du SIRET.",
};

type Timeout = ReturnType<typeof setTimeout>;

export const EstablishmentHomeMenu = ({
  clientApplication,
}: EstablishmentHomeMenuProperties) => {
  const [siret, siretUpdate] = useState<SiretDto>("");
  const callToActionSlice = useAppSelector(
    (state) => state.homeEstablishmentSlice,
  );
  const [startEstablishmentPath, startEstablishmentPathUpdate] =
    useState<boolean>(false);
  const [inputTimeout, inputTimeoutUpdate] = useState<Timeout | undefined>(
    undefined,
  );
  useEffect(() => {
    siret === "" && clientApplication.onEvent(new VerifySiretEvent(siret));
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-blue-200 rounded px-4 p-1 m-2 w-48 bg-blue-50  `}
      style={{ width: "400px", height: "250px" }}
    >
      <div className="flex flex-col">
        <EstablishmentTitle type={"establishment"} text="ENTREPRISE" />
        {callToActionSlice.status !==
          "MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION" && (
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
            {isNothingOrErrorCallToAction(callToActionSlice.status) && (
              <ImmersionTextField
                className="w-2/3"
                name="siret"
                value={siret}
                placeholder="SIRET de votre entreprise"
                error={
                  badEstablishmentCallToActionNotifications[
                    callToActionSlice.status
                  ]
                }
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
            {callToActionSlice.status === "MODIFY_ESTABLISHEMENT" &&
              modifyEstablishmentRequestForMailUpdate({
                siret,
                clientApplication,
              })}
            {callToActionSlice.status ===
              "MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION" && (
              <ModifyEstablishmentRequestNotification />
            )}
          </>
        )}
      </div>
      {callToActionSlice.status !==
        "MODIFY_ESTABLISHEMENT_REQUEST_NOTIFICATION" && (
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
  timeout: Timeout | undefined,
  timeoutUpdate: React.Dispatch<React.SetStateAction<Timeout | undefined>>,
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

const isNothingOrErrorCallToAction = (
  callToAction: EstablishementCallToAction,
) =>
  callToAction === "NOTHING" ||
  callToAction === "ERROR_BAD_SIRET" ||
  callToAction === "ERROR_CLOSED_ESTABLISHMENT_ON_SIRENE" ||
  callToAction === "ERROR_MISSING_ESTABLISHMENT_ON_SIRENE" ||
  callToAction === "ERROR_SIRENE_API_UNAVAILABLE" ||
  callToAction === "ERROR_TOO_MANY_REQUESTS_ON_SIRET_API" ||
  callToAction === "ERROR_UNEXPECTED_ERROR";

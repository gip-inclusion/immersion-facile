import { useEstablishmentSiret } from "src/app/hooks/siret.hooks";
import { ButtonHome, ImmersionTextField } from "react-design-system";
import React from "react";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { EstablishmentSubTitle } from "src/app/components/EstablishmentSubTitle";

type SiretFetcherInputProps = {
  placeholder: string;
  label?: string;
  shouldFetchEvenIfAlreadySaved: boolean;
};

export const SiretFetcherInput = ({
  placeholder,
  label,
  shouldFetchEvenIfAlreadySaved,
}: SiretFetcherInputProps) => {
  const {
    currentSiret,
    siretErrorToDisplay,
    isSiretAlreadySaved,
    updateSiret,
    modifyLinkWasSent,
    sendModifyEstablishmentLink,
  } = useEstablishmentSiret({
    shouldFetchEvenIfAlreadySaved,
  });
  const shouldShowInputError = !isSiretAlreadySaved && currentSiret !== "";
  return (
    <>
      <ImmersionTextField
        className="w-3/4"
        id="siret-fetcher-input"
        name="siret"
        label={label}
        value={currentSiret}
        placeholder={placeholder}
        error={shouldShowInputError ? siretErrorToDisplay : ""}
        onChange={(e) => updateSiret(e.target.value)}
      />
      {isSiretAlreadySaved && !modifyLinkWasSent && (
        <ModifyEstablishmentRequestForMailUpdate
          onClick={() => sendModifyEstablishmentLink(currentSiret)}
        />
      )}
      {modifyLinkWasSent && <ModifyEstablishmentRequestNotification />}
    </>
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

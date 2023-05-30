import React from "react";
import { useForm } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ContactEstablishmentByMailDto,
  contactEstablishmentByMailSchema,
  domElementIds,
  RomeDto,
  SiretDto,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { immersionSearchGateway } from "src/config/dependencies";
import { EmailValidationInput } from "../forms/commons/EmailValidationInput";

type ContactByEmailProps = {
  siret: SiretDto;
  offer: RomeDto;
  onSuccess: () => void;
};

const initialMessage =
  "Bonjour, \n\n\
J’ai trouvé votre entreprise sur 'Immersion Facilitée.'\n\
Je souhaiterais passer quelques jours dans votre entreprise en immersion professionnelle auprès de vos salariés pour découvrir ce métier.\n\
  \n\
Pourriez-vous me contacter par mail pour me proposer un rendez-vous ? \n\
Je pourrais alors vous expliquer directement mon projet. \n\
  \n\
En vous remerciant,";

export const ContactByEmail = ({
  siret,
  offer,
  onSuccess,
}: ContactByEmailProps) => {
  const initialValues: ContactEstablishmentByMailDto = {
    siret,
    offer,
    contactMode: "EMAIL",
    potentialBeneficiaryFirstName: "",
    potentialBeneficiaryLastName: "",
    potentialBeneficiaryEmail: "",
    message: initialMessage,
  };

  const methods = useForm<ContactEstablishmentByMailDto>({
    resolver: zodResolver(contactEstablishmentByMailSchema),
    mode: "onTouched",
    defaultValues: initialValues,
  });
  const {
    register,
    handleSubmit,
    formState,
    formState: { isSubmitting },
  } = methods;

  const getFieldError = makeFieldError(formState);

  const onFormValid = async (values: ContactEstablishmentByMailDto) => {
    await immersionSearchGateway.contactEstablishment(values);
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit(onFormValid)}>
      <>
        <p className={fr.cx("fr-pb-3w")}>
          Cette entreprise a choisi d'être contactée par mail. Veuillez
          compléter ce formulaire qui sera transmis à l'entreprise.
        </p>
        <EmailValidationInput
          label="Votre email *"
          nativeInputProps={{
            ...register("potentialBeneficiaryEmail"),
            type: "email",
          }}
          {...getFieldError("potentialBeneficiaryEmail")}
        />
        <Input
          label="Votre prénom *"
          nativeInputProps={register("potentialBeneficiaryFirstName")}
          {...getFieldError("potentialBeneficiaryFirstName")}
        />
        <Input
          label="Votre nom *"
          nativeInputProps={register("potentialBeneficiaryLastName")}
          {...getFieldError("potentialBeneficiaryLastName")}
        />
        <Input
          label="Votre message *"
          textArea
          nativeTextAreaProps={{
            ...register("message"),
            rows: 6,
          }}
          {...getFieldError("message")}
        />

        <Button
          priority="secondary"
          type="submit"
          disabled={isSubmitting}
          nativeButtonProps={{
            id: domElementIds.search.contactByMailButton,
          }}
        >
          Envoyer
        </Button>
      </>
    </form>
  );
};

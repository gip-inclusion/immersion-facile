import { useForm, type FormState, type FieldValues } from "react-hook-form";
import React from "react";
import { ModalTitle } from "react-design-system";
import {
  ContactEstablishmentByMailDto,
  contactEstablishmentByMailSchema,
  RomeDto,
  SiretDto,
} from "shared";
import { immersionSearchGateway } from "src/config/dependencies";
import { zodResolver } from "@hookform/resolvers/zod";
import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";

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

const makeFieldError =
  <Context extends FieldValues>(context: FormState<Context>) =>
  (
    name: keyof Context,
  ): {
    state: "error" | "default";
    stateRelatedMessage: string | undefined;
  } | null =>
    name in context.errors
      ? {
          state: "error" as const,
          stateRelatedMessage: context.errors[name]?.message as string,
        }
      : null;

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
        <ModalTitle>Contacter l'entreprise</ModalTitle>

        <p className={fr.cx("fr-pb-3w")}>
          Cette entreprise a choisi d'être contactée par mail. Veuillez
          compléter ce formulaire qui sera transmis à l'entreprise.
        </p>
        <Input
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
            id: "im-contact-establishment__contact-email-button",
          }}
        >
          Envoyer
        </Button>
      </>
    </form>
  );
};

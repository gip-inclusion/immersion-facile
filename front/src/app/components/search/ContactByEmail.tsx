import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ContactEstablishmentByMailDto,
  contactEstablishmentByMailSchema,
  domElementIds,
  ImmersionObjective,
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
  onClose: () => void;
};

const initialMessage = `Bonjour, \n\n\
J’ai trouvé votre entreprise sur le site https://immersion-facile.beta.gouv.fr\n\
***Rédigez ici votre email de motivation en suivant nos conseils.***\n\
  \n\
Pourriez-vous me contacter par mail ou par téléphone pour me proposer un rendez-vous ? \n\
Je pourrais alors vous expliquer directement mon projet. \n\
  \n\
En vous remerciant,`;

export const ContactByEmail = ({
  siret,
  offer,
  onSuccess,
  onClose,
}: ContactByEmailProps) => {
  const initialValues: ContactEstablishmentByMailDto = {
    siret,
    offer,
    contactMode: "EMAIL",
    potentialBeneficiaryFirstName: "",
    potentialBeneficiaryLastName: "",
    potentialBeneficiaryEmail: "",
    message: initialMessage,
    immersionObjective: "",
    potentialBeneficiaryLinkedinOrCv: "",
    potentialBeneficiaryPhone: "",
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
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormValid)}>
        <>
          <p>
            Cette entreprise a choisi d'être contactée par mail. Veuillez
            compléter ce formulaire qui sera transmis à l'entreprise.
          </p>
          <hr />
          <Alert
            severity="info"
            small
            description={
              <div>
                Besoin d’aide ? {""}
                <a href="https://aide.immersion-facile.beta.gouv.fr/fr/article/choisir-lobjet-et-rediger-un-email-de-motivation-pour-decrocher-une-immersion-xytzii/">
                  Nos conseils pour choisir l’objet et rédiger un bon email de
                  motivation.
                </a>
              </div>
            }
            className={fr.cx("fr-mt-1w")}
          />

          <h2 className={fr.cx("fr-h6", "fr-pt-3w")}>
            Votre email de motivation
          </h2>

          <Select
            label={
              "Objet de la période de mise en situation en milieu professionnel *"
            }
            options={immersionObjectiveListOfOptions}
            placeholder={"Sélectionnez un objet"}
            nativeSelectProps={{
              ...register("immersionObjective"),
            }}
            {...getFieldError("immersionObjective")}
          />

          <Input
            label="Votre message à l’entreprise *"
            textArea
            nativeTextAreaProps={{
              ...register("message"),
              rows: 6,
            }}
            {...getFieldError("message")}
          />
          <h2 className={fr.cx("fr-h6")}>Vos informations</h2>

          <Input
            label="Prénom *"
            nativeInputProps={register("potentialBeneficiaryFirstName")}
            {...getFieldError("potentialBeneficiaryFirstName")}
          />
          <Input
            label="Nom *"
            nativeInputProps={register("potentialBeneficiaryLastName")}
            {...getFieldError("potentialBeneficiaryLastName")}
          />
          <EmailValidationInput
            label="Email *"
            nativeInputProps={{
              ...register("potentialBeneficiaryEmail"),
              type: "email",
            }}
            {...getFieldError("potentialBeneficiaryEmail")}
          />

          <Input
            label="Téléphone *"
            nativeInputProps={{
              ...register("potentialBeneficiaryPhone"),
              type: "phone",
            }}
            {...getFieldError("potentialBeneficiaryPhone")}
          />

          <Input
            label="Page LinkedIn ou CV en ligne (facultatif)"
            nativeInputProps={{
              ...register("potentialBeneficiaryLinkedinOrCv"),
            }}
          />

          <ButtonsGroup
            className={fr.cx()}
            alignment="right"
            inlineLayoutWhen="always"
            buttons={[
              {
                type: "button",
                priority: "secondary",
                onClick: onClose,
                nativeButtonProps: {
                  id: domElementIds.search.contactByMailCloseButton,
                },
                children: "Annuler et revenir à la recherche",
              },
              {
                type: "submit",
                priority: "primary",
                disabled: isSubmitting,
                nativeButtonProps: {
                  id: domElementIds.search.contactByMailButton,
                },
                children: "Envoyer",
              },
            ]}
          />
        </>
      </form>
    </FormProvider>
  );
};

const immersionObjective: ImmersionObjective[] = [
  "Confirmer un projet professionnel",
  "Découvrir un métier ou un secteur d'activité",
  "Initier une démarche de recrutement",
];

export const immersionObjectiveListOfOptions = immersionObjective.map(
  (immersionObjective) => ({
    value: immersionObjective,
    label: immersionObjective,
  }),
);

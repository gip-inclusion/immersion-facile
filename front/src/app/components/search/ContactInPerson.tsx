import { Form, Formik } from "formik";
import React, { useState } from "react";
import { Button, ModalTitle } from "react-design-system";
import {
  ContactEstablishmentInPersonDto,
  contactEstablishmentInPersonSchema,
  RomeDto,
  SiretDto,
} from "shared";
import { immersionSearchGateway } from "src/config/dependencies";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";

type ContactInPersonProps = {
  siret: SiretDto;
  offer: RomeDto;
  onSuccess: () => void;
};

const getName = (v: keyof ContactEstablishmentInPersonDto) => v;

export const ContactInPerson = ({
  siret,
  offer,
  onSuccess,
}: ContactInPersonProps) => {
  const initialValues: ContactEstablishmentInPersonDto = {
    siret,
    offer,
    contactMode: "IN_PERSON",
    potentialBeneficiaryFirstName: "",
    potentialBeneficiaryLastName: "",
    potentialBeneficiaryEmail: "",
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(
        contactEstablishmentInPersonSchema,
      )}
      onSubmit={async (values) => {
        setIsSubmitting(true);
        await immersionSearchGateway.contactEstablishment(values);
        setIsSubmitting(false);
        onSuccess();
      }}
    >
      {({ errors, submitCount }) => (
        <Form>
          <>
            <ModalTitle>Contacter l'entreprise</ModalTitle>
            <p className={"fr-my-2w"}>
              Cette entreprise souhaite que vous vous présentiez directement
              pour candidater.
            </p>
            <p className={"fr-my-2w"}>
              Merci de nous indiquer vos coordonnées. Vous recevrez par e-mail
              le nom de la personne à contacter ainsi que des conseils pour
              présenter votre demande d’immersion. Ces informations sont
              personnelles et confidentielles. Elles ne peuvent pas être
              communiquées à d’autres personnes.
            </p>
            <p className={"fr-my-2w"}>Merci !</p>
            <TextInput
              label="Votre email *"
              name={getName("potentialBeneficiaryEmail")}
            />
            <TextInput
              label="Votre prénom *"
              name={getName("potentialBeneficiaryFirstName")}
            />
            <TextInput
              label="Votre nom *"
              name={getName("potentialBeneficiaryLastName")}
            />
            {submitCount !== 0 &&
              Object.values(errors).length > 0 &&
              //eslint-disable-next-line no-console
              console.log("onSubmit Error", { errors })}
            <Button
              level="secondary"
              type="submit"
              disable={isSubmitting}
              id="im-contact-establishment__contact-in-person-button"
            >
              Envoyer
            </Button>
          </>
        </Form>
      )}
    </Formik>
  );
};

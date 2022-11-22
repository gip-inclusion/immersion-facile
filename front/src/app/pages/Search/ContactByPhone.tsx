import { Form, Formik } from "formik";
import React, { useState } from "react";
import { Button } from "react-design-system/immersionFacile";
import {
  ContactEstablishmentByPhoneDto,
  contactEstablishmentByPhoneSchema,
  RomeDto,
  SiretDto,
} from "shared";
import { immersionSearchGateway } from "src/app/config/dependencies";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";

type ContactByPhoneProps = {
  siret: SiretDto;
  offer: RomeDto;
  onSuccess: () => void;
};

const getName = (v: keyof ContactEstablishmentByPhoneDto) => v;

export const ContactByPhone = ({
  siret,
  offer,
  onSuccess,
}: ContactByPhoneProps) => {
  const initialValues: ContactEstablishmentByPhoneDto = {
    siret,
    offer,
    contactMode: "PHONE",
    potentialBeneficiaryFirstName: "",
    potentialBeneficiaryLastName: "",
    potentialBeneficiaryEmail: "",
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(
        contactEstablishmentByPhoneSchema,
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
          <p className={"fr-my-2w"}>
            Cette entreprise souhaite être contactée par téléphone. Merci de
            nous indiquer vos coordonnées.
          </p>
          <p className={"fr-my-2w"}>
            Nous allons vous transmettre par e-mail le nom de la personne à
            contacter, son numéro de téléphone ainsi que des conseils pour
            présenter votre demande d’immersion.
          </p>
          <p className={"fr-my-2w"}>
            Ces informations sont personnelles et confidentielles. Elles ne
            peuvent pas être communiquées à d’autres personnes. Merci !
          </p>
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
            id="im-contact-establishment__contact-phone-button"
          >
            Envoyer
          </Button>
        </Form>
      )}
    </Formik>
  );
};

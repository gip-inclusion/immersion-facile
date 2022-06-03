import { Form, Formik } from "formik";
import React, { useState } from "react";
import { immersionSearchGateway } from "src/app/config/dependencies";
import {
  ContactEstablishmentByPhoneDto,
  contactEstablishmentByPhoneSchema,
} from "shared/src/contactEstablishment";
import { SiretDto } from "shared/src/siret";
import { Button } from "react-design-system/src/immersionFacile/components/buttons/Button";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";

type ContactByPhoneProps = {
  siret: SiretDto;
  romeLabel: string;
  onSuccess: () => void;
};

const getName = (v: keyof ContactEstablishmentByPhoneDto) => v;

export const ContactByPhone = ({
  siret,
  romeLabel,
  onSuccess,
}: ContactByPhoneProps) => {
  const initialValues: ContactEstablishmentByPhoneDto = {
    siret,
    romeLabel,
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
          <p>
            Cette entreprise souhaite être contactée par téléphone. Merci de
            nous indiquer vos coordonnées.
          </p>
          <br />
          <p>
            Nous allons vous transmettre par e-mail le nom de la personne à
            contacter, son numéro de téléphone ainsi que des conseils pour
            présenter votre demande d’immersion.
          </p>
          <br />
          <p>
            Ces informations sont personnelles et confidentielles. Elles ne
            peuvent pas être communiquées à d’autres personnes. Merci !
          </p>
          <br />
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
          <Button level="secondary" type="submit" disable={isSubmitting}>
            Envoyer
          </Button>
        </Form>
      )}
    </Formik>
  );
};

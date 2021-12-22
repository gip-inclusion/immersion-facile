import { Form, Formik } from "formik";
import React, { useState } from "react";
import { immersionSearchGateway } from "src/app/dependencies";
import { Button } from "src/components/Button";
import { TextInput } from "src/components/form/TextInput";
import { toFormikValidationSchema } from "src/components/form/zodValidate";
import {
  ContactEstablishmentByMailDto,
  contactEstablishmentByMailSchema,
} from "src/shared/contactEstablishment";

type ContactByEmailProps = {
  immersionOfferId: string;
  onSuccess: () => void;
};

const getName = (v: keyof ContactEstablishmentByMailDto) => v;

export const ContactByEmail = ({
  immersionOfferId,
  onSuccess,
}: ContactByEmailProps) => {
  const initialValues: ContactEstablishmentByMailDto = {
    immersionOfferId,
    contactMode: "EMAIL",
    potentialBeneficiaryFirstName: "",
    potentialBeneficiaryLastName: "",
    potentialBeneficiaryEmail: "",
    message: "",
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(
        contactEstablishmentByMailSchema,
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
          <TextInput
            label="Votre message *"
            name={getName("message")}
            type="text"
            multiline
          />
          {submitCount !== 0 &&
            Object.values(errors).length > 0 &&
            console.log({ errors })}
          <Button level="secondary" type="submit" disable={isSubmitting}>
            Envoyer
          </Button>
        </Form>
      )}
    </Formik>
  );
};

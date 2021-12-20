import { Form, Formik } from "formik";
import React, { useState } from "react";
import { immersionSearchGateway } from "src/app/dependencies";
import { Button } from "src/components/Button";
import { TextInput } from "src/components/form/TextInput";
import { toFormikValidationSchema } from "src/components/form/zodValidate";
import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "src/shared/contactEstablishment";

type ContactByPhoneProps = {
  immersionOfferId: string;
  onSuccess: () => void;
};

export const ContactByPhone = ({
  immersionOfferId,
  onSuccess,
}: ContactByPhoneProps) => {
  const initialValues: ContactEstablishmentRequestDto = {
    immersionOfferId,
    contactMode: "PHONE",
    senderEmail: "",
    senderName: "",
    message: "",
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(
        contactEstablishmentRequestSchema,
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
            label="Veuillez laisser votre email pour recevoir le numéro de téléphone de l'entreprise *"
            name="senderEmail"
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

import { Form, Formik, useField } from "formik";
import React, { useState } from "react";
import { Button, ModalTitle } from "react-design-system";
import {
  ContactEstablishmentByMailDto,
  contactEstablishmentByMailSchema,
  RomeDto,
  SiretDto,
} from "shared";
import { immersionSearchGateway } from "src/config/dependencies";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";

type ContactByEmailProps = {
  siret: SiretDto;
  offer: RomeDto;
  onSuccess: () => void;
};

const getName = (v: keyof ContactEstablishmentByMailDto) => v;

const initialMessage =
  "Bonjour, \n\
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
          <>
            <ModalTitle>Contacter l'entreprise</ModalTitle>

            <p className={fr.cx("fr-pb-3w")}>
              Cette entreprise a choisi d'être contactée par mail. Veuillez
              compléter ce formulaire qui sera transmis à l'entreprise.
            </p>
            <FormikInput
              label="Votre email *"
              name={getName("potentialBeneficiaryEmail")}
            />
            <FormikInput
              label="Votre prénom *"
              name={getName("potentialBeneficiaryFirstName")}
            />
            <FormikInput
              label="Votre nom *"
              name={getName("potentialBeneficiaryLastName")}
            />

            <FormikTextArea
              label="Votre message *"
              name={getName("message")}
              rows={6}
            />

            {submitCount !== 0 &&
              Object.values(errors).length > 0 &&
              //eslint-disable-next-line no-console
              console.log("onSubmit error", { errors })}
            <Button
              level="secondary"
              type="submit"
              disable={isSubmitting}
              id="im-contact-establishment__contact-email-button"
            >
              Envoyer
            </Button>
          </>
        </Form>
      )}
    </Formik>
  );
};

type FormikInputProps = {
  name: string;
  label: string;
};
const FormikInput = ({ name, label }: FormikInputProps) => {
  const [field] = useField<string>({ name });

  return <Input label={label} nativeInputProps={field} />;
};

type FormikTextAreaProps = {
  name: string;
  label: string;
  rows?: number;
};
const FormikTextArea = ({ name, label, rows }: FormikTextAreaProps) => {
  const [field] = useField<string>({ name });

  return (
    <Input label={label} nativeTextAreaProps={{ ...field, rows }} textArea />
  );
};

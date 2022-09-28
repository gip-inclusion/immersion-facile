import { Form, Formik } from "formik";
import React, { useState } from "react";
import { immersionSearchGateway } from "src/app/config/dependencies";
import {
  ContactEstablishmentByMailDto,
  contactEstablishmentByMailSchema,
} from "shared";
import { SiretDto } from "shared";
import { Button } from "react-design-system/immersionFacile";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";

type ContactByEmailProps = {
  siret: SiretDto;
  romeLabel: string;
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
  romeLabel,
  onSuccess,
}: ContactByEmailProps) => {
  const initialValues: ContactEstablishmentByMailDto = {
    siret,
    romeLabel,
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
          <p className="pb-6">
            Cette entreprise a choisi d'être contactée par mail. Veuillez
            compléter ce formulaire qui sera transmis à l'entreprise.
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
          <TextInput
            label="Votre message *"
            name={getName("message")}
            type="text"
            multiline
          />
          {submitCount !== 0 &&
            Object.values(errors).length > 0 &&
            //eslint-disable-next-line no-console
            console.log("onSubmit error", { errors })}
          <Button level="secondary" type="submit" disable={isSubmitting}>
            Envoyer
          </Button>
        </Form>
      )}
    </Formik>
  );
};

import React from "react";
import { Form, Formik, useField } from "formik";
import { Button } from "@mui/material";
import { TextInput } from "../../components/form/TextInput";
import { immersionApplicationGateway } from "../dependencies";
import { toFormikValidationSchema } from "../../components/form/zodValidate";
import { shareLinkByEmailSchema } from "../../shared/ShareLinkByEmailDTO";

type ShareFormProps = {
  onSuccess: () => void;
  onError: () => void;
};

export const ShareForm = ({ onSuccess, onError }: ShareFormProps) => {
  const submit = async (values: { email: string; details: string }) => {
    const result = await immersionApplicationGateway.shareLinkByEmail({
      ...values,
      immersionApplicationLink: window.location.href,
    });
    result ? onSuccess() : onError();
  };

  const [mentorEmail] = useField<string>({ name: "mentorEmail" });
  const [firstName] = useField<string>({ name: "firstName" });
  const [lastName] = useField<string>({ name: "lastName" });

  console.log(firstName);
  console.log(lastName);

  return (
    <Formik
      initialValues={{
        email: mentorEmail.value,
        details: `${firstName.value || "Prénom"} ${
          lastName.value || "Nom"
        } vous invite à prendre connaissance de cette demande de convention d’immersion déjà partiellement remplie afin que vous la complétiez.  Merci !`,
        immersionApplicationLink: window.location.href,
      }}
      validationSchema={toFormikValidationSchema(shareLinkByEmailSchema)}
      onSubmit={submit}
    >
      {() => (
        <Form>
          <input type="hidden" name="immersionApplicationLink" />
          <TextInput
            label="Adresse mail à qui partager la demande"
            name="email"
            type="email"
            placeholder="nom@exemple.com"
          />
          <TextInput
            label="Votre message (pour expliquer ce qui reste à compléter)"
            name="details"
            multiline={true}
          />
          <Button type={"submit"}>Envoyer</Button>
        </Form>
      )}
    </Formik>
  );
};

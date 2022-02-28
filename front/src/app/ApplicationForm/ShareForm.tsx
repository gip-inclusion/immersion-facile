import React from "react";
import { Form, Formik, useField } from "formik";
import { Button } from "@mui/material";
import { TextInput } from "../../components/form/TextInput";
import { immersionApplicationGateway } from "../dependencies";
import { toFormikValidationSchema } from "../../components/form/zodValidate";
import { z } from "zod";

type ShareFormProps = {
  onSuccess: () => void;
  onError: () => void;
};

export const ShareForm = ({ onSuccess, onError }: ShareFormProps) => {
  const submit = async ({
    email,
    details,
  }: {
    email: string;
    details: string;
  }) => {
    const result = await immersionApplicationGateway.shareByEmail(
      email,
      details,
      window.location.href,
    );
    result ? onSuccess() : onError();
  };

  const [field] = useField<string>({ name: "mentorEmail" });

  return (
    <Formik
      initialValues={{
        email: field.value,
        details: "",
      }}
      validationSchema={toFormikValidationSchema(
        z.object({
          email: z.string().email(),
          details: z.string().optional(),
        }),
      )}
      onSubmit={submit}
    >
      {() => (
        <Form>
          <TextInput
            label="A quel email voulez-vous partager ?"
            name="email"
            type="email"
            placeholder="nom@exemple.com"
          />
          <TextInput
            label="Message à rajouter au corps du mail"
            name="details"
            multiline={true}
          />
          <Button type={"submit"}>Envoyer</Button>
        </Form>
      )}
    </Formik>
  );
};

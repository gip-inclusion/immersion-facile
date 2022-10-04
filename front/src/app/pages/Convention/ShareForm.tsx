import { Button } from "@mui/material";
import { Form, Formik, useField } from "formik";
import React from "react";
import {
  getConventionFieldName,
  ShareLinkByEmailDto,
  shareLinkByEmailSchema,
} from "shared";
import { conventionGateway } from "src/app/config/dependencies";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";

type ShareFormProps = {
  onSuccess: () => void;
  onError: () => void;
};

const makeInitialValues = ({
  firstName,
  lastName,
  establishmentRepresentativeEmail,
  link,
}: {
  firstName: string;
  lastName: string;
  establishmentRepresentativeEmail: string;
  link: string;
}): Required<ShareLinkByEmailDto> => ({
  email: establishmentRepresentativeEmail,
  conventionLink: link,
  details: `${firstName || "Prénom"} ${
    lastName || "Nom"
  } vous invite à prendre connaissance de cette demande de convention d’immersion déjà partiellement remplie afin que vous la complétiez.  Merci !`,
});

const getName = (name: keyof ShareLinkByEmailDto) => name;

export const ShareForm = ({ onSuccess, onError }: ShareFormProps) => {
  const submit = async (values: { email: string; details: string }) => {
    const result = await conventionGateway.shareLinkByEmail({
      ...values,
      conventionLink: window.location.href,
    });
    result ? onSuccess() : onError();
  };

  const [establishmentRepresentativeEmail] = useField<string>({
    name: getConventionFieldName(
      "signatories.establishmentRepresentative.email",
    ),
  });
  const [firstName] = useField<string>({
    name: getConventionFieldName("signatories.beneficiary.firstName"),
  });
  const [lastName] = useField<string>({
    name: getConventionFieldName("signatories.beneficiary.lastName"),
  });

  return (
    <Formik
      initialValues={makeInitialValues({
        establishmentRepresentativeEmail:
          establishmentRepresentativeEmail.value,
        firstName: firstName.value,
        lastName: lastName.value,
        link: window.location.href,
      })}
      validationSchema={toFormikValidationSchema(shareLinkByEmailSchema)}
      onSubmit={submit}
    >
      {() => (
        <Form>
          <input type="hidden" name={getName("conventionLink")} />
          <TextInput
            label="Adresse mail à qui partager la demande"
            name={getName("email")}
            type="email"
            placeholder="nom@exemple.com"
          />
          <TextInput
            label="Votre message (pour expliquer ce qui reste à compléter)"
            name={getName("details")}
            multiline={true}
          />
          <Button type={"submit"}>Envoyer</Button>
        </Form>
      )}
    </Formik>
  );
};

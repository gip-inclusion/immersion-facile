import { Form, Formik, useField } from "formik";
import React from "react";
import {
  getConventionFieldName,
  InternshipKind,
  ShareLinkByEmailDto,
  shareLinkByEmailSchema,
} from "shared";
import { conventionGateway } from "src/config/dependencies";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { Button } from "@codegouvfr/react-dsfr/Button";

type ShareFormProps = {
  onSuccess: () => void;
  onError: () => void;
};

const makeInitialValues = ({
  firstName,
  lastName,
  establishmentRepresentativeEmail,
  link,
  internshipKind,
}: {
  firstName: string;
  lastName: string;
  establishmentRepresentativeEmail: string;
  link: string;
  internshipKind: InternshipKind;
}): Required<ShareLinkByEmailDto> => ({
  internshipKind,
  email: establishmentRepresentativeEmail,
  conventionLink: link,
  details: `${firstName || "Prénom"} ${
    lastName || "Nom"
  } vous invite à prendre connaissance de cette demande de convention d’immersion déjà partiellement remplie afin que vous la complétiez.  Merci !`,
});

const getName = (name: keyof ShareLinkByEmailDto) => name;

export const ShareForm = ({ onSuccess, onError }: ShareFormProps) => {
  const submit = async (values: {
    email: string;
    details: string;
    internshipKind: InternshipKind;
  }) => {
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
  const [internshipKind] = useField<InternshipKind>({
    name: getConventionFieldName("internshipKind"),
  });

  return (
    <Formik
      initialValues={makeInitialValues({
        internshipKind: internshipKind.value,
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
          <Button type="submit" title="Envoyer">
            Envoyer
          </Button>
        </Form>
      )}
    </Formik>
  );
};

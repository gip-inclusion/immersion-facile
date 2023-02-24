import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorNotifications } from "react-design-system";
import {
  AgencyDto,
  AgencyKind,
  CreateAgencyDto,
  createAgencySchema,
  toDotNotation,
} from "shared";
import {
  AgencyFormCommonFields,
  AgencyLogoUpload,
} from "src/app/components/forms/agency/AgencyFormCommonFields";
import { agencySubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { formAgencyFieldsLabels } from "src/app/contents/forms/agency/formAgency";
import {
  formErrorsToFlatErrors,
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { agencyGateway } from "src/config/dependencies";
import { AgencySubmitFeedback } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";

type CreateAgencyInitialValues = Omit<CreateAgencyDto, "kind"> & {
  kind: AgencyKind | "";
};

export const AddAgencyForm = (): JSX.Element => {
  const [submitFeedback, setSubmitFeedback] = useState<AgencySubmitFeedback>({
    kind: "idle",
  });
  const { getFormErrors } = useFormContents(formAgencyFieldsLabels);
  const methods = useForm<CreateAgencyInitialValues>({
    resolver: zodResolver(createAgencySchema),
    mode: "onTouched",
    defaultValues: initialValues(uuidV4()),
  });

  const { handleSubmit, formState, register } = methods;
  const getFieldError = makeFieldError(formState);

  const onFormValid: SubmitHandler<CreateAgencyInitialValues> = (values) => {
    if (values.kind === "") throw new Error("Agency kind is empty");
    return agencyGateway
      .addAgency({
        ...values,
        kind: values.kind,
        questionnaireUrl:
          values.kind === "pole-emploi" ? "" : values.questionnaireUrl,
      })
      .then(() => setSubmitFeedback({ kind: "agencyAdded" }))
      .catch((e) => {
        //eslint-disable-next-line  no-console
        console.log("AddAgencyPage", e);
        setSubmitFeedback(e);
      });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormValid)}>
        <AgencyFormCommonFields />
        <AgencyLogoUpload />
        <Input
          label="Siret de l'agence"
          nativeInputProps={{
            ...register("agencySiret"),
            placeholder: "n° de siret",
          }}
          {...getFieldError("agencySiret")}
        />
        <ErrorNotifications
          labels={getFormErrors()}
          errors={toDotNotation(formErrorsToFlatErrors(formState.errors))}
          visible={
            formState.submitCount !== 0 &&
            Object.values(formState.errors).length > 0
          }
        />
        <SubmitFeedbackNotification
          submitFeedback={submitFeedback}
          messageByKind={agencySubmitMessageByKind}
        />
        <Button
          type="submit"
          disabled={formState.isSubmitting || submitFeedback.kind !== "idle"}
          nativeButtonProps={{
            id: "im-form-add-agency__submit-button",
          }}
        >
          Soumettre
        </Button>
      </form>
    </FormProvider>
  );
};

const initialValues: (id: AgencyDto["id"]) => CreateAgencyInitialValues = (
  id,
) => ({
  id,
  kind: "",
  name: "",
  address: {
    streetNumberAndAddress: "",
    postcode: "",
    city: "",
    departmentCode: "",
  },
  position: {
    lat: 0,
    lon: 0,
  },
  counsellorEmails: [],
  validatorEmails: [],
  questionnaireUrl: "",
  logoUrl: undefined,
  signature: "",
  agencySiret: "",
});

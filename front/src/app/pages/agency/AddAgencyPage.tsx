import { useState } from "react";
import * as React from "react";
import {
  ErrorNotifications,
  MainWrapper,
  PageHeader,
} from "react-design-system";
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
} from "src/app/components/agency/AgencyFormCommonFields";
import { agencySubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { agencyGateway } from "src/config/dependencies";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { AgencySubmitFeedback } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";
import { v4 as uuidV4 } from "uuid";
import {
  formErrorsToFlatErrors,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { formAgencyFieldsLabels } from "src/app/contents/forms/agency/formAgency";
import { Button } from "@codegouvfr/react-dsfr/Button";

import { SubmitHandler, useForm, FormProvider } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

export type CreateAgencyInitialValues = Omit<CreateAgencyDto, "kind"> & {
  kind: AgencyKind | "";
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
});

export const AddAgencyPage = () => {
  const [submitFeedback, setSubmitFeedback] = useState<AgencySubmitFeedback>({
    kind: "idle",
  });
  const { getFormErrors } = useFormContents(formAgencyFieldsLabels);

  const methods = useForm<CreateAgencyInitialValues>({
    resolver: zodResolver(createAgencySchema),
    mode: "onTouched",
    defaultValues: initialValues(uuidV4()),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors, submitCount },
  } = methods;

  // const getFieldError = makeFieldError(formState);
  //

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
    <HeaderFooterLayout>
      <MainWrapper
        layout="boxed"
        pageHeader={
          <PageHeader
            title="Ajout d'organisme encadrant les PMSMP"
            centered
            theme="agency"
          />
        }
      >
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onFormValid)}>
            <AgencyFormCommonFields />
            <AgencyLogoUpload />

            <ErrorNotifications
              labels={getFormErrors()}
              errors={toDotNotation(formErrorsToFlatErrors(errors))}
              visible={submitCount !== 0 && Object.values(errors).length > 0}
            />
            <SubmitFeedbackNotification
              submitFeedback={submitFeedback}
              messageByKind={agencySubmitMessageByKind}
            />
            <Button
              type="submit"
              disabled={isSubmitting || submitFeedback.kind !== "idle"}
              nativeButtonProps={{
                id: "im-form-add-agency__submit-button",
              }}
            >
              Soumettre
            </Button>
          </form>
        </FormProvider>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

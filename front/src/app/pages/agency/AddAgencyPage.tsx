import { Form, Formik } from "formik";
import * as React from "react";
import { useState } from "react";
import {
  Button,
  ErrorNotifications,
  MainWrapper,
  Title,
} from "react-design-system/immersionFacile";
import { AgencyDto, CreateAgencyDto, createAgencySchema } from "shared";
import {
  AgencyFormCommonFields,
  AgencyLogoUpload,
} from "src/app/components/agency/AgencyFormCommonFields";
import { agencySubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { agencyGateway } from "src/config/dependencies";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { AgencySubmitFeedback } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { v4 as uuidV4 } from "uuid";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { formAgencyFieldsLabels } from "src/app/contents/forms/agency/formAgency";

const initialValues: (id: AgencyDto["id"]) => CreateAgencyDto = (id) => ({
  id,
  kind: "pole-emploi",
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
  const { formErrorLabels } = useFormContents(formAgencyFieldsLabels);
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <Title heading={1}>Ajout d'organisme encadrant les PMSMP</Title>
        <Formik
          initialValues={initialValues(uuidV4())}
          validationSchema={toFormikValidationSchema(createAgencySchema)}
          onSubmit={(values) =>
            agencyGateway
              .addAgency({
                ...values,
                questionnaireUrl:
                  values.kind === "pole-emploi" ? "" : values.questionnaireUrl,
              })
              .then(() => setSubmitFeedback({ kind: "agencyAdded" }))
              .catch((e) => {
                //eslint-disable-next-line  no-console
                console.log("AddAgencyPage", e);
                setSubmitFeedback(e);
              })
          }
        >
          {({ isSubmitting, errors, submitCount }) => (
            <Form>
              <AgencyFormCommonFields />
              <AgencyLogoUpload />
              <ErrorNotifications
                labels={formErrorLabels}
                errors={errors as Record<string, string>}
                visible={submitCount !== 0 && Object.values(errors).length > 0}
              />
              <SubmitFeedbackNotification
                submitFeedback={submitFeedback}
                messageByKind={agencySubmitMessageByKind}
              />
              <div className="fr-mt-4w">
                <Button
                  type="submit"
                  disable={isSubmitting || submitFeedback.kind !== "idle"}
                  id={`im-form-add-agency__submit-button`}
                >
                  Soumettre
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

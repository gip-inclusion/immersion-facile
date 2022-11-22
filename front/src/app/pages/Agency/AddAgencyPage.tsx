import { Form, Formik } from "formik";
import { keys } from "ramda";
import * as React from "react";
import { useState } from "react";
import {
  Button,
  MainWrapper,
  Title,
} from "react-design-system/immersionFacile";
import { CreateAgencyDto, createAgencySchema } from "shared";
import {
  AgencyFormCommonFields,
  AgencyLogoUpload,
} from "src/app/components/agency/AgencyFormCommonFields";
import { agencySubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { agencyGateway } from "src/app/config/dependencies";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { AgencySubmitFeedback } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { v4 as uuidV4 } from "uuid";

const initialValues: CreateAgencyDto = {
  id: uuidV4(),
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
};

export const AddAgencyPage = () => {
  const [submitFeedback, setSubmitFeedback] = useState<AgencySubmitFeedback>({
    kind: "idle",
  });

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <Title>Ajout d'organisme encadrant les PMSMP</Title>
        <Formik
          initialValues={initialValues}
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
            <Form className="m-5 max-w-6xl">
              <div>
                <AgencyFormCommonFields />
                <AgencyLogoUpload />
              </div>
              <div className="fr-mt-4w">
                <Button
                  type="submit"
                  disable={isSubmitting || submitFeedback.kind !== "idle"}
                  id={`im-form-add-agency__submit-button`}
                >
                  Soumettre
                </Button>
              </div>

              <SubmitFeedbackNotification
                submitFeedback={submitFeedback}
                messageByKind={agencySubmitMessageByKind}
              />

              {submitCount !== 0 && Object.values(errors).length > 0 && (
                <div style={{ color: "red" }}>
                  Veuillez corriger les champs erronés :
                  <ul>
                    {keys(errors).map((field) => {
                      const err = errors[field];
                      return typeof err === "string" ? (
                        <li key={field}>
                          {field}: {err}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
            </Form>
          )}
        </Formik>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

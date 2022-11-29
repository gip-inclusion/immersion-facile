import { Form, Formik } from "formik";
import React from "react";
import {
  Button,
  DsfrTitle,
  ErrorNotifications,
} from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import {
  AgencyDto,
  agencySchema,
  AgencyStatus,
  allAgencyStatuses,
  zEmail,
} from "shared";
import {
  AgencyFormCommonFields,
  AgencyLogoUpload,
  makeTypedSetField,
} from "src/app/components/agency/AgencyFormCommonFields";
import { agencySubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { formAgencyErrorLabels } from "src/app/pages/Agency/content/formAgency";
import { useAppSelector } from "src/app/utils/reduxHooks";
import "src/assets/admin.css";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminSlice } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";
import { FillableList } from "src/uiComponents/form/FillableList";
import { SimpleSelect } from "src/uiComponents/form/SimpleSelect";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { AgencyAutocomplete } from "./AgencyAutocomplete";

export const EditAgency = () => (
  <>
    <DsfrTitle level={5} text="Editer une agence" className="fr-mt-4w" />
    <div
      className="w-2/3 p-5"
      style={{
        backgroundColor: "#E5E5F4",
      }}
    >
      <AgencyAutocomplete
        title="Je sélectionne une agence"
        placeholder={"Ex : Agence de Berry"}
      />
    </div>
    <EditAgencyForm />
  </>
);

const getName = (name: keyof AgencyDto) => name;

const agencyStatusToLabel: Record<AgencyStatus, string> = {
  active: "Active",
  closed: "Fermée",
  needsReview: "En attende d'activation",
  "from-api-PE": "Import Api",
};

const statusListOfOptions = allAgencyStatuses.map((agencyStatus) => ({
  value: agencyStatus,
  label: agencyStatusToLabel[agencyStatus],
}));

const EditAgencyForm = () => {
  const dispatch = useDispatch();
  const feedback = useAppSelector(agencyAdminSelectors.feedback);
  const agency = useAppSelector(agencyAdminSelectors.agency);

  if (!agency) return null;
  return (
    <div>
      <Formik
        initialValues={agency}
        validationSchema={toFormikValidationSchema(agencySchema)}
        onSubmit={(values, { setSubmitting }) => {
          dispatch(agencyAdminSlice.actions.updateAgencyRequested(values));
          setSubmitting(false);
        }}
      >
        {({ isSubmitting, setFieldValue, values, errors, submitCount }) => {
          const typedSetField = makeTypedSetField<AgencyDto>(setFieldValue);

          return (
            <Form className="m-5 max-w-6xl">
              <div>
                <AgencyFormCommonFields addressInitialValue={agency.address} />
                <FillableList
                  name="agency-admin-emails"
                  label="⚠️Emails administrateur de l'agence ⚠️"
                  description="Ces emails auront le droit d'accéder aux tableaux de bord et d'éditer les informations et accès du personnel de l'agence"
                  placeholder="admin.agence@mail.com"
                  valuesInList={values.adminEmails}
                  setValues={typedSetField("adminEmails")}
                  validationSchema={zEmail}
                />

                <SimpleSelect
                  id="agency-status"
                  label="⚠️Statut de l'agence ⚠️"
                  name={getName("status")}
                  options={statusListOfOptions}
                />

                <TextInput
                  name={getName("agencySiret")}
                  label="⚠️Siret de l'agence ⚠️"
                  placeholder="n° de siret"
                />

                <TextInput
                  name={getName("codeSafir")}
                  label="⚠️Code Safir de l'agence ⚠️"
                  placeholder="n° de siret"
                />

                <AgencyLogoUpload />
              </div>
              <ErrorNotifications
                labels={formAgencyErrorLabels}
                errors={errors as Record<string, string>}
                visible={submitCount !== 0 && Object.values(errors).length > 0}
              />
              <SubmitFeedbackNotification
                submitFeedback={feedback}
                messageByKind={agencySubmitMessageByKind}
              />
              <div className="fr-mt-4w">
                <Button
                  type="submit"
                  disable={isSubmitting || feedback.kind !== "idle"}
                  id={`im-form-edit-agency__submit-button`}
                >
                  Mettre à jour
                </Button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

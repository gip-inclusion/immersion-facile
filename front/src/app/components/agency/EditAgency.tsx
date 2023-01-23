import { Form, Formik } from "formik";
import React from "react";
import { Button, DsfrTitle, ErrorNotifications } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  AgencyDto,
  agencySchema,
  AgencyStatus,
  allAgencyStatuses,
  toDotNotation,
  zEmail,
} from "shared";
import {
  AgencyFormCommonFields,
  AgencyLogoUpload,
  makeTypedSetField,
} from "src/app/components/agency/AgencyFormCommonFields";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import "src/assets/admin.css";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminSlice } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";
import { FillableList } from "src/app/components/forms/commons/FillableList";
import { SimpleSelect } from "src/app/components/forms/commons/SimpleSelect";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { AgencyAutocomplete } from "./AgencyAutocomplete";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { formAgencyFieldsLabels } from "src/app/contents/forms/agency/formAgency";
import { fr } from "@codegouvfr/react-dsfr";

export const EditAgency = () => (
  <>
    <DsfrTitle
      level={5}
      text="Editer une agence"
      className={fr.cx("fr-mt-4w")}
    />
    <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card")}>
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
  rejected: "Rejetée",
  needsReview: "En attende d'activation",
  "from-api-PE": "Import Api",
};

const statusListOfOptions = allAgencyStatuses.map((agencyStatus) => ({
  value: agencyStatus,
  label: agencyStatusToLabel[agencyStatus],
}));

const EditAgencyForm = () => {
  const dispatch = useDispatch();
  const agency = useAppSelector(agencyAdminSelectors.agency);
  const feedback = useAppSelector(agencyAdminSelectors.feedback);
  const { getFormErrors } = useFormContents(formAgencyFieldsLabels);

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
            <Form className={fr.cx("fr-my-4w")}>
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
                labels={getFormErrors()}
                errors={toDotNotation(errors)}
                visible={submitCount !== 0 && Object.values(errors).length > 0}
              />

              <div className={fr.cx("fr-mt-4w")}>
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

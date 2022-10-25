import { Form, Formik, FormikHelpers } from "formik";
import { keys } from "ramda";
import React, { useState } from "react";
import { Button, DsfrTitle } from "react-design-system/immersionFacile";
import {
  AgencyDto,
  AgencyKind,
  agencyKindList,
  agencySchema,
  AgencyStatus,
  allAgencyStatuses,
  zEmail,
} from "shared";
import {
  agencySubmitMessageByKind,
  SuccessFeedbackKindAgency,
} from "src/app/components/agency/AgencySubmitFeedback";
import { RadioGroup } from "src/app/components/RadioGroup";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { UploadLogo } from "src/app/components/UploadLogo";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import "src/assets/admin.css";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";
import { AddressAutocomplete } from "src/uiComponents/autocomplete/AddressAutocomplete";
import { FillableList } from "src/uiComponents/form/FillableList";
import { SimpleSelect } from "src/uiComponents/form/SimpleSelect";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { AgencyAutocomplete } from "./AgencyAutocomplete";

export const EditAgency = () => {
  const selectedAgency: AgencyDto | null = useAppSelector(
    agencyAdminSelectors.agency,
  );

  return (
    <>
      <DsfrTitle level={5} text="Editer une agence" />
      <div
        className="w-2/3 p-5"
        style={{
          backgroundColor: "#E5E5F4",
        }}
      >
        <AgencyAutocomplete
          title="Je sélectionne une agence"
          placeholder={"Ex : Agence de Berry"}
          className="searchdropdown-header inputLabel"
        />
      </div>
      {selectedAgency && <EditAgencyForm agency={selectedAgency} />}
    </>
  );
};
type KeysExceptId = Exclude<keyof AgencyDto, "id">;
const getName = (name: keyof AgencyDto) => name;
type MakeTypedSetField = (
  setFieldValue: FormikHelpers<AgencyDto>["setFieldValue"],
) => <K extends KeysExceptId>(
  fieldName: K,
) => (fieldValue: AgencyDto[K]) => void;
const makeTypedSetField: MakeTypedSetField =
  (setFieldValue) => (fieldName) => (fieldValue) =>
    setFieldValue(fieldName, fieldValue);

const agencyKindToLabel: Record<
  Exclude<AgencyKind, "immersion-facile">,
  string
> = {
  "mission-locale": "Mission Locale",
  "pole-emploi": "Pole Emploi",
  "cap-emploi": "Cap Emploi",
  "conseil-departemental": "Conseil Départemental",
  "prepa-apprentissage": "Prépa Apprentissage",
  "structure-IAE": "Structure IAE",
  autre: "Autre",
};

const agencyStatusToLabel: Record<AgencyStatus, string> = {
  active: "Active",
  closed: "Fermée",
  needsReview: "En attende d'activation",
  "from-api-PE": "Import Api",
};

const agencyListOfOptions = agencyKindList.map((agencyKind) => ({
  value: agencyKind,
  label: agencyKindToLabel[agencyKind],
}));

const statusListOfOptions = allAgencyStatuses.map((agencyStatus) => ({
  value: agencyStatus,
  label: agencyStatusToLabel[agencyStatus],
}));

type ValidationSteps = "oneStep" | "twoSteps";

const numberOfStepsOptions: Array<{ label: string; value: ValidationSteps }> = [
  {
    label: "1: La Convention est examinée et validée par la même personne",
    value: "oneStep",
  },
  {
    label:
      "2: La Convention est examinée par une personne puis validée par quelqu’un d’autre",
    value: "twoSteps",
  },
];

const descriptionByValidationSteps: Record<ValidationSteps, string> = {
  oneStep:
    "Les personnes ou emails génériques suivants recevront les demandes de Convention à valider.",
  twoSteps:
    "Les personnes ou emails génériques suivants valideront les conventions préalablement examinées.",
};

const EditAgencyForm = ({ agency }: { agency: AgencyDto }) => {
  const [submitFeedback, _setSubmitFeedback] = useState<
    SubmitFeedBack<SuccessFeedbackKindAgency>
  >({
    kind: "idle",
  });
  const { enableLogoUpload } = useFeatureFlags();
  return (
    <div>
      <Formik
        initialValues={agency}
        validationSchema={toFormikValidationSchema(agencySchema)}
        onSubmit={(values) => {
          // eslint-disable-next-line no-console
          console.log(values);
        }}
      >
        {({ isSubmitting, setFieldValue, values, errors, submitCount }) => {
          const typedSetField = makeTypedSetField(setFieldValue);
          const [validationSteps, setValidationSteps] = useState<
            "oneStep" | "twoSteps"
          >("oneStep");

          return (
            <Form className="m-5 max-w-6xl">
              <div>
                <SimpleSelect
                  id="agency-kind"
                  label="Type d'agence"
                  name={getName("kind")}
                  options={agencyListOfOptions}
                />
                <TextInput
                  name={getName("name")}
                  label="Nom de la structure"
                  placeholder="Agence de Boulogne-Billancourt"
                />
                <AddressAutocomplete
                  label="Adresse de la structure"
                  setFormValue={({ position, address }) => {
                    typedSetField("position")(position);
                    typedSetField("address")(address);
                  }}
                />

                <RadioGroup
                  id="steps-for-validation"
                  currentValue={validationSteps}
                  setCurrentValue={setValidationSteps}
                  groupLabel="Combien d'étapes de validation des immersions y a-t-il ? *"
                  options={numberOfStepsOptions}
                />
                {validationSteps === "twoSteps" && (
                  <FillableList
                    name="counsellor-emails"
                    label="Emails pour examen préalable de la demande de convention"
                    description="Les personnes ou emails génériques suivants recevront en premier les demandes de convention à examiner."
                    placeholder="equipe1@mail.com, conseiller.dupont@mail.com"
                    valuesInList={values.counsellorEmails}
                    setValues={typedSetField("counsellorEmails")}
                    validationSchema={zEmail}
                  />
                )}

                <FillableList
                  name="validator-emails"
                  label="Emails de validation définitive de la demande de convention"
                  description={descriptionByValidationSteps[validationSteps]}
                  placeholder="equipe.validation@mail.com, valideur.dupont@mail.com"
                  valuesInList={values.validatorEmails}
                  setValues={typedSetField("validatorEmails")}
                  validationSchema={zEmail}
                />

                {values.kind !== "pole-emploi" && (
                  <TextInput
                    name={getName("questionnaireUrl")}
                    label="Avez-vous un lien vers le document de support du bilan de fin d’immersion ?"
                    placeholder="https://docs.google.com/document/d/mon-document-pour-bilan"
                  />
                )}

                <TextInput
                  name={getName("signature")}
                  label="Quel texte de signature souhaitez-vous pour les mails automatisés ?"
                  placeholder="L’équipe de l’agence de Boulogne-Billancourt"
                />

                <FillableList
                  name="validator-emails"
                  label="⚠️Emails administrateur de l'agence ⚠️"
                  description="Ces emails auront le droit d'accéder aux tableaux de bord et d'éditer les informations et accès du personnel de l'agence"
                  placeholder="admin.agence@mail.com"
                  valuesInList={values.adminEmails}
                  setValues={typedSetField("adminEmails")}
                  validationSchema={zEmail}
                />

                <SimpleSelect
                  id="agency-status"
                  label="⚠️Status de l'agence ⚠️"
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

                {enableLogoUpload && (
                  <>
                    <UploadLogo
                      setFileUrl={typedSetField("logoUrl")}
                      maxSize_Mo={2}
                      label="Changer le logo"
                      hint="Cela permet de personnaliser les mails automatisés."
                    />
                    {values.logoUrl && (
                      <img
                        src={values.logoUrl}
                        alt="uploaded-logo"
                        width="100px"
                      />
                    )}
                  </>
                )}
              </div>
              <div className="fr-mt-4w">
                <Button
                  type="submit"
                  disable={
                    true && (isSubmitting || submitFeedback.kind !== "idle")
                  }
                >
                  Editer
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
          );
        }}
      </Formik>
    </div>
  );
};

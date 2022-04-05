import { Form, Formik, FormikHelpers } from "formik";
import { keys } from "ramda";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  SubmitFeedback,
  SuccessFeedbackKind,
} from "src/app/components/SubmitFeedback";
import { agencyGateway } from "src/app/config/dependencies";
import { RadioGroup } from "src/app/components/RadioGroup";
import { AddressAutocomplete } from "src/uiComponents/AddressAutocomplete";
import { Button } from "src/uiComponents/Button";
import { FillableList } from "src/uiComponents/form/FillableList";
import { SimpleSelect } from "src/uiComponents/form/SimpleSelect";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { Title } from "src/uiComponents/Title";
import {
  agencyConfigSchema,
  AgencyKind,
  agencyKindList,
  CreateAgencyConfig,
} from "src/shared/agencies";
import { zEmail } from "src/shared/zodUtils";
import { v4 as uuidV4 } from "uuid";

const initialValues: CreateAgencyConfig = {
  id: uuidV4(),
  kind: "pole-emploi",
  name: "",
  address: "",
  position: {
    lat: 0,
    lon: 0,
  },
  counsellorEmails: [],
  validatorEmails: [],
  questionnaireUrl: "",
  signature: "",
};

type KeysExceptId = Exclude<keyof CreateAgencyConfig, "id">;

const getName = (name: keyof CreateAgencyConfig) => name;

// prettier-ignore
type MakeTypedSetField = (setFieldValue: FormikHelpers<CreateAgencyConfig>["setFieldValue"]) => <K extends KeysExceptId>(fieldName: K, fieldValue: CreateAgencyConfig[K]) => void
const makeTypedSetField: MakeTypedSetField =
  (setFieldValue) => (fieldName, fieldValue) =>
    setFieldValue(fieldName, fieldValue);

export const AddAgencyPage = () => {
  const [submitFeedback, setSubmitFeedback] = useState<
    SuccessFeedbackKind | Error | null
  >(null);

  return (
    <HeaderFooterLayout>
      <div className="flex flex-col items-center">
        <Title>Ajout d'organisme encadrant les PMSMP</Title>
        <Formik
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(agencyConfigSchema)}
          onSubmit={(values) =>
            agencyGateway
              .addAgency({
                ...values,
                questionnaireUrl:
                  values.kind === "pole-emploi" ? "" : values.questionnaireUrl,
              })
              .then(() => setSubmitFeedback("agencyAdded"))
              .catch((e) => {
                console.log(e);
                setSubmitFeedback(e);
              })
          }
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
                    setFormValue={({ coordinates, label }) => {
                      typedSetField("position", coordinates);
                      typedSetField("address", label);
                    }}
                  />

                  <RadioGroup
                    id="steps-for-validation"
                    currentValue={validationSteps}
                    setCurrentValue={setValidationSteps}
                    groupLabel="Combien d'étapes de validation des immersions y a-t-il ? *"
                    options={numberOfStepsOptions}
                  />

                  <br />

                  {validationSteps === "twoSteps" && (
                    <FillableList
                      name="counsellor-emails"
                      label="Emails pour examen préalable de la demande de convention"
                      description="Les personnes ou emails génériques suivants recevront en premier les demandes de convention à examiner."
                      placeholder="equipe1@mail.com, conseiller.dupont@mail.com"
                      valuesInList={values.counsellorEmails}
                      setValues={(newValues) => {
                        typedSetField("counsellorEmails", newValues);
                      }}
                      validationSchema={zEmail}
                    />
                  )}

                  <FillableList
                    name="validator-emails"
                    label="Emails de validation définitive de la demande de convention"
                    description={descriptionByValidationSteps[validationSteps]}
                    placeholder="equipe.validation@mail.com, valideur.dupont@mail.com"
                    valuesInList={values.validatorEmails}
                    setValues={(newValues) => {
                      typedSetField("validatorEmails", newValues);
                    }}
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
                </div>
                <br />
                <Button
                  type="submit"
                  disable={isSubmitting || submitFeedback !== null}
                >
                  Soumettre
                </Button>
                <SubmitFeedback submitFeedback={submitFeedback} />

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
    </HeaderFooterLayout>
  );
};

const agencyKindToLabel: Record<AgencyKind, string> = {
  "mission-locale": "Mission Locale",
  "pole-emploi": "Pole Emploi",
  "cap-emploi": "Cap Emploi",
  "conseil-departemental": "Conseil Départemental",
  "prepa-apprentissage": "Prépa Apprentissage",
  "structure-IAE": "Structure IAE",
  autre: "Autre",
};

const agencyListOfOptions = agencyKindList.map((agencyKind) => ({
  value: agencyKind,
  label: agencyKindToLabel[agencyKind],
}));

type ValidationSteps = "oneStep" | "twoSteps";

const numberOfStepsOptions: Array<{ label: string; value: ValidationSteps }> = [
  {
    label: "1: La convention est examinée et validée par la même personne",
    value: "oneStep",
  },
  {
    label:
      "2: La convention est examinée par une personne puis validée par quelqu’un d’autre",
    value: "twoSteps",
  },
];

const descriptionByValidationSteps: Record<ValidationSteps, string> = {
  oneStep:
    "Les personnes ou emails génériques suivants recevront les demandes de convention à valider.",
  twoSteps:
    "Les personnes ou emails génériques suivants valideront les conventions préalablement examinées.",
};

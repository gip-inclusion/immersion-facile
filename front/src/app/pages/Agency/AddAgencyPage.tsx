import { Form, Formik, FormikHelpers } from "formik";
import { keys } from "ramda";
import * as React from "react";
import { useState } from "react";
import { Button, Title } from "react-design-system/immersionFacile";
import {
  AgencyKind,
  agencyKindList,
  CreateAgencyDto,
  createAgencySchema,
  zEmail,
} from "shared";
import {
  agencySubmitMessageByKind,
  SuccessFeedbackKindAgency,
} from "src/app/components/AgencySubmitFeedback";
import { RadioGroup } from "src/app/components/RadioGroup";
import { SubmitFeedback } from "src/app/components/SubmitFeedback";
import { UploadLogo } from "src/app/components/UploadLogo";
import { agencyGateway } from "src/app/config/dependencies";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { AddressAutocomplete } from "src/uiComponents/autocomplete/AddressAutocomplete";
import { FillableList } from "src/uiComponents/form/FillableList";
import { SimpleSelect } from "src/uiComponents/form/SimpleSelect";
import { TextInput } from "src/uiComponents/form/TextInput";
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

type KeysExceptId = Exclude<keyof CreateAgencyDto, "id">;

const getName = (name: keyof CreateAgencyDto) => name;

// prettier-ignore
type MakeTypedSetField = (setFieldValue: FormikHelpers<CreateAgencyDto>["setFieldValue"]) => <K extends KeysExceptId>(fieldName: K) => (fieldValue: CreateAgencyDto[K]) => void
const makeTypedSetField: MakeTypedSetField =
  (setFieldValue) => (fieldName) => (fieldValue) =>
    setFieldValue(fieldName, fieldValue);

export const AddAgencyPage = () => {
  const [submitFeedback, setSubmitFeedback] = useState<
    SuccessFeedbackKindAgency | Error | null
  >(null);
  const { enableLogoUpload } = useFeatureFlags();

  return (
    <HeaderFooterLayout>
      <div className="flex flex-col items-center">
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
              .then(() => setSubmitFeedback("agencyAdded"))
              .catch((e) => {
                //eslint-disable-next-line  no-console
                console.log("AddAgencyPage", e);
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

                  <br />

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
                  {enableLogoUpload && (
                    <>
                      <UploadLogo
                        setFileUrl={typedSetField("logoUrl")}
                        maxSize_Mo={2}
                        label="Vous pouvez également télécharger votre logo."
                        hint="Cela permettra de personnaliser les mails automatisés."
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
                <br />
                <Button
                  type="submit"
                  disable={isSubmitting || submitFeedback !== null}
                >
                  Soumettre
                </Button>
                <SubmitFeedback
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
    </HeaderFooterLayout>
  );
};

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

const agencyListOfOptions = agencyKindList.map((agencyKind) => ({
  value: agencyKind,
  label: agencyKindToLabel[agencyKind],
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

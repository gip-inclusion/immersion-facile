import { Form, Formik } from "formik";
import React, { useState } from "react";
import { BusinessContactList } from "src/app/FormEstablishment/BusinessContactList";
import {
  fieldsToLabel,
  FieldsWithLabel,
} from "src/app/FormEstablishment/fieldsToLabels";
import { ProfessionList } from "src/app/FormEstablishment/ProfessionList";
import { RadioGroupForField } from "src/app/RadioGroup";
import { BoolCheckboxGroup } from "src/components/form/CheckboxGroup";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { toFormikValidationSchema } from "src/components/form/zodValidate";
import {
  ContactMethod,
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "src/shared/FormEstablishmentDto";

type EstablishmentFormProps = {
  initialValues: FormEstablishmentDto;
  saveForm: (establishment: FormEstablishmentDto) => Promise<void>;
  children: React.ReactNode;
};

export const getMandatoryLabelAndName = (field: FieldsWithLabel) => ({
  label: fieldsToLabel[field] + " *",
  name: field,
});

export const getLabelAndName = (field: FieldsWithLabel) => ({
  label: fieldsToLabel[field],
  name: field,
});

export const EstablishmentForm = ({
  initialValues,
  saveForm,
  children,
}: EstablishmentFormProps) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  let errorMessage = submitError?.message;
  if (
    submitError &&
    "response" in submitError &&
    "data" in submitError["response"] &&
    "errors" in submitError["response"]["data"]
  ) {
    errorMessage = submitError["response"]["data"]["errors"];
  }

  return (
    <div
      className="fr-grid-row fr-grid-row--center fr-grid-row--gutters"
      style={{ marginTop: "25px" }}
    >
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(formEstablishmentSchema)}
        onSubmit={async (data, { setSubmitting }) => {
          try {
            setIsSuccess(false);
            setSubmitError(null);

            formEstablishmentSchema.parse(data);

            await saveForm(data);

            setIsSuccess(true);
            setSubmitError(null);
          } catch (e: any) {
            console.log(e);
            setIsSuccess(false);
            setSubmitError(e);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, submitCount, errors }) => (
          <div style={{ margin: "5px 12px", maxWidth: "600px" }}>
            <p>
              Bienvenue sur l'espace de référencement des entreprises
              volontaires pour l'accueil des immersions professionnelles.
            </p>

            <p className="mt-4">
              En référençant votre entreprise vous rejoignez la communauté{" "}
              <a
                href={"https://lesentreprises-sengagent.gouv.fr/"}
                target={"_blank"}
              >
                « Les entreprises s'engagent »
              </a>
              .
            </p>

            <p className="mt-4">
              Ce formulaire vous permet d'indiquer les métiers de votre
              établissement ouverts aux immersions. Si votre entreprise comprend
              plusieurs établissements, il convient de renseigner un formulaire
              pour chaque établissement (Siret différent).
            </p>
            <Form>
              <span className="py-6 block text-lg font-semibold">
                Votre établissement
              </span>
              {children}
              {/* <SiretRelatedInputs /> */}
              <p className="mt-4" />
              <BoolCheckboxGroup
                {...getLabelAndName("isEngagedEnterprise")}
                description=""
                descriptionLink=""
                disabled={false}
              />
              <ProfessionList
                name="professions"
                title={`${fieldsToLabel["professions"]} *`}
              />
              <BusinessContactList />
              <RadioGroupForField
                {...getMandatoryLabelAndName("preferredContactMethods")}
                options={preferredContactMethodOptions}
              />
              {submitCount !== 0 && Object.values(errors).length > 0 && (
                <div style={{ color: "red" }}>
                  {console.log(errors)}
                  Veuillez corriger les champs erronés :
                  <ul>
                    {(Object.keys(errors) as FieldsWithLabel[]).map((field) => {
                      const err = errors[field];
                      return typeof err === "string" ? (
                        <li key={field}>
                          {fieldsToLabel[field] || field}: {err}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
              <br />
              {submitError && (
                <>
                  <ErrorMessage title="Veuillez nous excuser. Un problème est survenu qui a compromis l'enregistrement de vos informations. ">
                    {errorMessage}
                  </ErrorMessage>
                  <br />
                </>
              )}
              {isSuccess && (
                <SuccessMessage title="Succès de l'envoi">
                  Succès. Nous avons bien enregistré les informations concernant
                  votre entreprise.
                </SuccessMessage>
              )}
              {!isSuccess && (
                <button
                  className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
                  type="submit"
                  disabled={isSubmitting}
                >
                  Enregistrer mes informations
                </button>
              )}
            </Form>
            <br />
            <br />
          </div>
        )}
      </Formik>
    </div>
  );
};

const preferredContactMethodOptions: Array<{
  label?: string;
  value: ContactMethod[];
}> = [
  {
    value: ["EMAIL"],
    label:
      "Par mail (la demande passera par un formulaire afin de ne pas exposer l'adresse mail)",
  },
  {
    value: ["PHONE"],
    label:
      "Par téléphone (seuls les candidats identifiés auront accès au numéro de téléphone)",
  },
  {
    value: ["IN_PERSON"],
    label: "Se présenter en personne à votre établissement",
  },
];

import { Form, Formik } from "formik";
import React, { useState } from "react";
import { Notification, Title } from "react-design-system";
import {
  FormEstablishmentDto,
  formEstablishmentSchema,
  immersionFacileContactEmail,
  SiretDto,
} from "shared";
import { BoolCheckboxGroup } from "src/app/components/forms/commons/CheckboxGroup";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { AppellationList } from "./AppellationList";
import { BusinessContact } from "./BusinessContact";
import { fieldsToLabel, FieldsWithLabel } from "./fieldsToLabels";

type EstablishmentFormProps = {
  initialValues: FormEstablishmentDto;
  saveForm: (establishment: FormEstablishmentDto) => Promise<void>;
  isEditing?: boolean;
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

export const EstablishmentFormikForm = ({
  initialValues,
  saveForm,
  children,
  isEditing,
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
          //eslint-disable-next-line no-console
          console.log("onSubmit", e);
          setIsSuccess(false);
          setSubmitError(e);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, submitCount, errors, values }) => (
        <>
          <Title heading={1}>Référencer mon entreprise</Title>
          <p>
            Bienvenue sur l'espace de référencement des entreprises volontaires
            pour l'accueil des immersions professionnelles.
          </p>

          <p>
            En référençant votre entreprise, vous rejoignez la communauté{" "}
            <a
              href={"https://lesentreprises-sengagent.gouv.fr/"}
              target={"_blank"}
            >
              « Les entreprises s'engagent »
            </a>
            .
          </p>
          <p>
            Ce formulaire vous permet d'indiquer les métiers de votre
            établissement ouverts aux immersions. Si votre entreprise comprend
            plusieurs établissements, il convient de renseigner un formulaire
            pour chaque établissement (Siret différent).
          </p>
          <Form>
            <h2 className="fr-text--lead fr-mb-2w">Votre établissement</h2>
            {children}
            <BoolCheckboxGroup
              {...getLabelAndName("isEngagedEnterprise")}
              description=""
              descriptionLink=""
              disabled={false}
            />
            <TextInput {...getLabelAndName("website")} autoComplete="url" />
            <TextInput
              {...getLabelAndName("additionalInformation")}
              multiline={true}
            />
            <AppellationList
              name="appellations"
              title={`${fieldsToLabel["appellations"]} *`}
            />
            <BusinessContact />

            {isEditing && (
              <>
                <BoolCheckboxGroup
                  name="isSearchable"
                  label={`L'entreprise est-elle recherchable par les utilisateurs ? ${
                    values.isSearchable
                      ? "(décochez la case si vous ne  voulez pas être visible sur la recherche)."
                      : "(cochez la case si vous voulez être visible sur la recherche)."
                  } Vous pourrez réactiver la visibilité à tout moment`}
                />
                <p>
                  Vous pouvez demander la suppression définitive de votre
                  entreprise{" "}
                  <a
                    href={"#"}
                    onClick={(event) => {
                      event.preventDefault();
                      window.open(mailtoHref(initialValues.siret));
                    }}
                  >
                    en cliquant ici
                  </a>
                </p>
                <p>
                  Si vous avez besoin d'aide, envoyez-nous un email: <br />
                  {immersionFacileContactEmail}
                </p>
              </>
            )}

            {submitCount !== 0 && Object.values(errors).length > 0 && (
              <div style={{ color: "red" }}>
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
            {submitError && (
              <>
                <Notification
                  type="error"
                  title="Veuillez nous excuser. Un problème est survenu qui a compromis l'enregistrement de vos informations. "
                >
                  {errorMessage}
                </Notification>
              </>
            )}
            {isSuccess && (
              <Notification type="success" title="Succès de l'envoi">
                Succès. Nous avons bien enregistré les informations concernant
                votre entreprise.
              </Notification>
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
        </>
      )}
    </Formik>
  );
};

const lineBreak = "%0D%0A";
const deleteEstablishmentSubject = "Demande de suppression d'entreprise";
const deleteEstablishmentBody = (siret: SiretDto) =>
  `Bonjour,${lineBreak}Je souhaite supprimer les données de mon entreprise dont le numéro de SIRET est ${siret}.${lineBreak}Cordialement.`;
const mailtoHref = (siret: SiretDto) =>
  `mailto:${immersionFacileContactEmail}?subject=${deleteEstablishmentSubject}&body=${deleteEstablishmentBody(
    siret,
  )}`;

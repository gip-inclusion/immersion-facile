import { Form, Formik } from "formik";
import React, { useState } from "react";
import { ErrorNotifications } from "react-design-system";
import Button from "@codegouvfr/react-dsfr/Button";

import {
  FormEstablishmentDto,
  formEstablishmentSchema,
  immersionFacileContactEmail,
  SiretDto,
  toDotNotation,
} from "shared";
import { BoolCheckboxGroup } from "src/app/components/forms/commons/CheckboxGroup";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { AppellationList } from "./AppellationList";
import { BusinessContact } from "./BusinessContact";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { SearchResultPreview } from "./SearchResultPreview";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { Input } from "@codegouvfr/react-dsfr/Input";

type EstablishmentFormProps = {
  initialValues: FormEstablishmentDto;
  saveForm: (establishment: FormEstablishmentDto) => Promise<void>;
  isEditing?: boolean;
  children: React.ReactNode;
};

const getErrorsFromResponseData = (
  error: Error | null,
): error is Error & { response: { data: { errors: string } } } =>
  !!error && !!(error as any)?.response?.data?.errors;

export const EstablishmentFormikForm = ({
  initialValues,
  saveForm,
  children,
  isEditing,
}: EstablishmentFormProps) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const { getFormErrors, getFormFields } = useFormContents(
    formEstablishmentFieldsLabels,
  );
  const formContents = getFormFields();
  let errorMessage = submitError?.message;
  const { enableMaxContactPerWeek } = useFeatureFlags();

  if (getErrorsFromResponseData(submitError)) {
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
      {({ isSubmitting, submitCount, errors, values, handleChange }) => (
        <>
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

          <p className={fr.cx("fr-text--xs")}>
            Tous les champs marqués d'une astérisque (*) sont obligatoires.
          </p>

          <Form>
            <h2 className={fr.cx("fr-text--lead", "fr-mb-2w")}>
              Votre établissement
            </h2>
            {children}
            <BoolCheckboxGroup
              {...formContents.isEngagedEnterprise}
              description=""
              descriptionLink=""
              disabled={false}
            />
            <BoolCheckboxGroup
              {...formContents.fitForDisabledWorkers}
              description=""
              descriptionLink=""
              disabled={false}
            />
            <TextInput {...formContents.website} />
            <TextInput
              {...formContents.additionalInformation}
              multiline={true}
            />
            <h2 className={fr.cx("fr-text--lead", "fr-mb-2w")}>
              Les métiers que vous proposez à l'immersion :
            </h2>
            <AppellationList
              {...formContents.appellations}
              title={formContents.appellations.label}
            />
            <BusinessContact />

            {enableMaxContactPerWeek && (
              <Input
                label={formContents.maxContactPerWeek.label}
                hintText={formContents.maxContactPerWeek.description}
                nativeInputProps={{
                  ...formContents.maxContactPerWeek,
                  type: "number",
                  min: 0,
                  pattern: "\\d*",
                  onChange: handleChange,
                  value: values.maxContactPerWeek,
                }}
              />
            )}

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
                  <a href={mailtoHref(initialValues.siret)}>en cliquant ici</a>
                </p>
                <p>
                  Si vous avez besoin d'aide, envoyez-nous un email: <br />
                  {immersionFacileContactEmail}
                </p>
              </>
            )}
            {Object.values(errors).length === 0 && (
              <SearchResultPreview establishment={values} />
            )}

            <ErrorNotifications
              labels={getFormErrors()}
              errors={toDotNotation(errors)}
              visible={submitCount !== 0 && Object.values(errors).length > 0}
            />
            {submitError && (
              <>
                <Alert
                  severity="error"
                  title="Veuillez nous excuser. Un problème est survenu qui a compromis l'enregistrement de vos informations. "
                  description={errorMessage}
                />
              </>
            )}
            {isSuccess && (
              <Alert
                severity="success"
                title="Succès de l'envoi"
                description="Succès. Nous avons bien enregistré les informations concernant
              votre entreprise."
              />
            )}
            {!isSuccess && (
              <div className={fr.cx("fr-mt-4w")}>
                <Button
                  iconId="fr-icon-checkbox-circle-line"
                  iconPosition="left"
                  type="submit"
                  disabled={isSubmitting}
                >
                  Enregistrer mes informations
                </Button>
              </div>
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

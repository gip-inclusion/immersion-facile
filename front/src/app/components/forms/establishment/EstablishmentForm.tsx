import React, { useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { ErrorNotifications } from "react-design-system";
import {
  AppellationDto,
  defaultMaxContactsPerWeek,
  FormEstablishmentDto,
  formEstablishmentSchema,
  immersionFacileContactEmail,
  noContactPerWeek,
  removeAtIndex,
  SiretDto,
  toDotNotation,
} from "shared";
import { BusinessContact } from "./BusinessContact";
import {
  emptyAppellation,
  MultipleAppellationInput,
} from "./MultipleAppellationInput";
import { SearchResultPreview } from "./SearchResultPreview";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  formErrorsToFlatErrors,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";

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

export const EstablishmentForm = ({
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
  const [isSearchable, setIsSearchable] = useState(
    initialValues.maxContactsPerWeek > noContactPerWeek,
  );
  const formContents = getFormFields();
  let errorMessage = submitError?.message;
  const { enableMaxContactPerWeek } = useFeatureFlags();

  if (getErrorsFromResponseData(submitError)) {
    errorMessage = submitError["response"]["data"]["errors"];
  }
  const methods = useForm<FormEstablishmentDto>({
    defaultValues: initialValues,
    resolver: zodResolver(formEstablishmentSchema),
    mode: "onTouched",
  });
  const {
    handleSubmit,
    register,
    setValue,
    getValues,
    formState: { errors, submitCount, isSubmitting, touchedFields },
  } = methods;

  const onSubmit: SubmitHandler<FormEstablishmentDto> = async (data) => {
    setIsSuccess(false);
    setSubmitError(null);
    return saveForm(data)
      .then(() => {
        setIsSuccess(true);
        setSubmitError(null);
      })
      .catch((error) => {
        //eslint-disable-next-line no-console
        console.error("onSubmit", error);
        setIsSuccess(false);
        setSubmitError(error);
      });
  };
  return (
    <>
      <p>
        Bienvenue sur l'espace de référencement des entreprises volontaires pour
        l'accueil des immersions professionnelles.
      </p>
      <p>
        En référençant votre entreprise, vous rejoignez la communauté{" "}
        <a href={"https://lesentreprises-sengagent.gouv.fr/"} target={"_blank"}>
          « Les entreprises s'engagent »
        </a>
        .
      </p>
      <p>
        Ce formulaire vous permet d'indiquer les métiers de votre établissement
        ouverts aux immersions. Si votre entreprise comprend plusieurs
        établissements, il convient de renseigner un formulaire pour chaque
        établissement (Siret différent).
      </p>
      <p className={fr.cx("fr-text--xs")}>
        Tous les champs marqués d'une astérisque (*) sont obligatoires.
      </p>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className={fr.cx("fr-text--lead", "fr-mb-2w")}>
            Votre établissement
          </h2>
          {children}
          <RadioButtons
            {...formContents["isEngagedEnterprise"]}
            legend={formContents["isEngagedEnterprise"].label}
            options={booleanSelectOptions.map((option) => ({
              ...option,
              nativeInputProps: {
                ...option.nativeInputProps,
                checked:
                  Boolean(option.nativeInputProps.value) ===
                  getValues()["isEngagedEnterprise"],
                onChange: () => {
                  setValue(
                    "isEngagedEnterprise",
                    option.nativeInputProps.value === 1,
                  );
                },
              },
            }))}
            disabled={false}
          />
          <RadioButtons
            {...formContents["fitForDisabledWorkers"]}
            legend={formContents["fitForDisabledWorkers"].label}
            options={booleanSelectOptions.map((option) => ({
              ...option,
              nativeInputProps: {
                ...option.nativeInputProps,
                checked:
                  Boolean(option.nativeInputProps.value) ===
                  getValues()["fitForDisabledWorkers"],
                onChange: () => {
                  setValue(
                    "fitForDisabledWorkers",
                    option.nativeInputProps.value === 1,
                  );
                },
              },
            }))}
            disabled={false}
          />
          <Input
            {...formContents.website}
            nativeInputProps={register("website")}
          />
          <Input
            {...formContents.additionalInformation}
            textArea
            nativeTextAreaProps={register("additionalInformation")}
          />

          <h2 className={fr.cx("fr-text--lead", "fr-mb-2w")}>
            Les métiers que vous proposez à l'immersion :
          </h2>
          <MultipleAppellationInput
            {...formContents.appellations}
            onAppellationAdd={(appellation, index) => {
              const appellationsToUpdate = getValues("appellations");
              appellationsToUpdate[index] = appellation;
              setValue("appellations", appellationsToUpdate);
            }}
            onAppellationDelete={(appellationIndex) => {
              const appellationsToUpdate = getValues("appellations");
              const newAppellations: AppellationDto[] =
                appellationIndex === 0 && appellationsToUpdate.length === 1
                  ? [emptyAppellation]
                  : removeAtIndex(getValues("appellations"), appellationIndex);
              setValue("appellations", newAppellations);
            }}
            currentAppellations={getValues("appellations")}
            error={errors?.appellations?.message}
          />
          <BusinessContact />

          {isEditing && (
            <Checkbox
              hintText={`${
                isSearchable
                  ? "(décochez la case si vous ne voulez pas être visible sur la recherche)."
                  : "(cochez la case si vous voulez être visible sur la recherche)."
              } Vous pourrez réactiver la visibilité à tout moment`}
              legend="L'entreprise est-elle recherchable par les utilisateurs ?"
              options={[
                {
                  label: "Oui",
                  nativeInputProps: {
                    checked: isSearchable,
                    onChange: (e) => {
                      setIsSearchable(e.currentTarget.checked);
                      setValue(
                        "maxContactsPerWeek",
                        e.currentTarget.checked
                          ? defaultMaxContactsPerWeek
                          : noContactPerWeek,
                      );
                    },
                  },
                },
              ]}
            />
          )}

          {enableMaxContactPerWeek && isSearchable && (
            <Input
              label={formContents.maxContactsPerWeek.label}
              hintText={formContents.maxContactsPerWeek.description}
              nativeInputProps={{
                ...formContents.maxContactsPerWeek,
                ...register("maxContactsPerWeek", {
                  valueAsNumber: true,
                }),
                type: "number",
                min: 0,
                pattern: "\\d*",
              }}
            />
          )}

          {isEditing && (
            <>
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
          {keys(errors).length === 0 && keys(touchedFields).length > 0 && (
            <SearchResultPreview establishment={getValues()} />
          )}
          <ErrorNotifications
            labels={getFormErrors()}
            errors={toDotNotation(formErrorsToFlatErrors(errors))}
            visible={submitCount !== 0 && Object.values(errors).length > 0}
          />
          {submitError && (
            <Alert
              severity="error"
              title="Veuillez nous excuser. Un problème est survenu qui a compromis l'enregistrement de vos informations. "
              description={errorMessage}
            />
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
        </form>
      </FormProvider>
    </>
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

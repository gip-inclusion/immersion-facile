import React, { useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import { match } from "ts-pattern";
import { Route } from "type-route";
import {
  AppellationAndRomeDto,
  decodeMagicLinkJwtWithoutSignatureCheck,
  defaultMaxContactsPerWeek,
  domElementIds,
  emptyAppellationAndRome,
  EstablishmentJwtPayload,
  FormEstablishmentDto,
  formEstablishmentSchema,
  FormEstablishmentSource,
  immersionFacileContactEmail,
  noContactPerWeek,
  objectToDependencyList,
  removeAtIndex,
  toDotNotation,
} from "shared";
import { ErrorNotifications, Loader } from "react-design-system";
import { CreationSiretRelatedInputs } from "src/app/components/forms/establishment/CreationSiretRelatedInputs";
import { EditionSiretRelatedInputs } from "src/app/components/forms/establishment/EditionSiretRelatedInputs";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import {
  formEstablishmentFieldsLabels,
  mailtoHref,
} from "src/app/contents/forms/establishment/formEstablishment";
import {
  formErrorsToFlatErrors,
  makeFieldError,
  useFormContents,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useInitialSiret } from "src/app/hooks/siret.hooks";
import { useDebounce } from "src/app/hooks/useDebounce";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import {
  formEstablishmentDtoToFormEstablishmentQueryParams,
  formEstablishmentQueryParamsToFormEstablishmentDto,
} from "src/app/routes/routeParams/formEstablishment";
import { routes, useRoute } from "src/app/routes/routes";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";
import {
  EstablishmentRequestedPayload,
  establishmentSlice,
} from "src/core-logic/domain/establishmentPath/establishment.slice";
import { BusinessContact } from "./BusinessContact";
import { MultipleAppellationInput } from "./MultipleAppellationInput";
import { SearchResultPreview } from "./SearchResultPreview";

type RouteByMode = {
  create: Route<typeof routes.formEstablishment>;
  edit: Route<typeof routes.editFormEstablishment>;
};

type Mode = keyof RouteByMode;

type EstablishmentFormProps = {
  mode: Mode;
};

export const EstablishmentForm = ({ mode }: EstablishmentFormProps) => {
  const route = useRoute() as RouteByMode[Mode];
  const isEstablishmentCreation = route.name === "formEstablishment";
  const feedback = useAppSelector(establishmentSelectors.feedback);
  const jwt = !isEstablishmentCreation ? route.params.jwt : "";
  const siret =
    isEstablishmentCreation && route.params.siret ? route.params.siret : "";
  const source =
    isEstablishmentCreation && route.params.source ? route.params.source : "";
  const isLoading = useAppSelector(establishmentSelectors.isLoading);
  const { getFormErrors, getFormFields } = useFormContents(
    formEstablishmentFieldsLabels,
  );
  const initialFormEstablishment = useAppSelector(
    establishmentSelectors.formEstablishment,
  );
  const initialValues = {
    ...initialFormEstablishment,
    source: (source === ""
      ? "immersion-facile"
      : source) as FormEstablishmentSource,
  };
  const methods = useForm<FormEstablishmentDto>({
    defaultValues: initialValues,
    resolver: zodResolver(formEstablishmentSchema),
    mode: "onTouched",
  });
  const dispatch = useDispatch();
  const {
    handleSubmit,
    register,
    setValue,
    getValues,
    formState: { errors, submitCount, isSubmitting, touchedFields },
    reset,
  } = methods;
  const [isSearchable, setIsSearchable] = useState(
    initialValues.maxContactsPerWeek > noContactPerWeek,
  );
  const formContents = getFormFields();
  const { enableMaxContactPerWeek } = useFeatureFlags();
  const formValues = getValues();
  const getFieldError = makeFieldError(methods.formState);

  useInitialSiret(siret);
  useEffect(() => {
    const payload: EstablishmentRequestedPayload =
      isEstablishmentCreation && mode !== "create"
        ? formEstablishmentQueryParamsToFormEstablishmentDto(route.params)
        : {
            siret:
              decodeMagicLinkJwtWithoutSignatureCheck<EstablishmentJwtPayload>(
                jwt,
              ).siret,
            jwt,
          };
    dispatch(establishmentSlice.actions.establishmentRequested(payload));
    return () => {
      dispatch(establishmentSlice.actions.establishmentClearRequested());
    };
  }, []);

  useEffect(() => {
    reset(initialFormEstablishment);
  }, [initialFormEstablishment]);

  useEffect(() => {
    if (isEstablishmentCreation) {
      routes
        .formEstablishment(
          formEstablishmentDtoToFormEstablishmentQueryParams(formValues),
        )
        .replace();
    }
  }, useDebounce(objectToDependencyList(formValues)));

  useEffect(() => {
    if (feedback.kind === "errored") {
      routes
        .errorRedirect({
          message: feedback.errorMessage,
          title: "Erreur",
        })
        .push();
    }
  }, [feedback.kind]);

  const onSubmit: SubmitHandler<FormEstablishmentDto> = (formEstablishment) => {
    isEstablishmentCreation
      ? dispatch(
          establishmentSlice.actions.establishmentCreationRequested(
            formEstablishment,
          ),
        )
      : dispatch(
          establishmentSlice.actions.establishmentEditionRequested({
            formEstablishment,
            jwt,
          }),
        );
  };

  if (isLoading) {
    return <Loader />;
  }
  return (
    <>
      <p>
        Bienvenue sur l'espace de référencement des entreprises volontaires pour
        l'accueil des immersions professionnelles.
      </p>
      <p>
        En référençant votre entreprise, vous rejoignez la communauté{" "}
        <a
          href={"https://lesentreprises-sengagent.gouv.fr/"}
          target={"_blank"}
          rel="noreferrer"
        >
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
          {match(mode)
            .with("create", () => <CreationSiretRelatedInputs />)
            .with("edit", () => (
              <EditionSiretRelatedInputs
                businessAddress={formValues.businessAddress}
              />
            ))
            .exhaustive()}

          <RadioButtons
            {...formContents["isEngagedEnterprise"]}
            legend={formContents["isEngagedEnterprise"].label}
            options={booleanSelectOptions.map((option) => ({
              ...option,
              nativeInputProps: {
                ...option.nativeInputProps,
                checked:
                  Boolean(option.nativeInputProps.value) ===
                  formValues["isEngagedEnterprise"],
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
                  formValues["fitForDisabledWorkers"],
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
            label={formContents.website.label}
            hintText={formContents.website.hintText}
            nativeInputProps={{
              ...formContents.website,
              ...register("website"),
            }}
            {...getFieldError("website")}
          />
          <Input
            label={formContents.additionalInformation.label}
            hintText={formContents.additionalInformation.hintText}
            textArea
            nativeTextAreaProps={{
              ...formContents.additionalInformation,
              ...register("additionalInformation"),
            }}
            {...getFieldError("additionalInformation")}
          />

          <h2 className={fr.cx("fr-text--lead", "fr-mb-2w")}>
            Les métiers que vous proposez à l'immersion :
          </h2>
          <MultipleAppellationInput
            {...formContents.appellations}
            onAppellationAdd={(appellation, index) => {
              const appellationsToUpdate = formValues.appellations;
              appellationsToUpdate[index] = appellation;
              setValue("appellations", appellationsToUpdate);
            }}
            onAppellationDelete={(appellationIndex) => {
              const appellationsToUpdate = formValues.appellations;
              const newAppellations: AppellationAndRomeDto[] =
                appellationIndex === 0 && appellationsToUpdate.length === 1
                  ? [emptyAppellationAndRome]
                  : removeAtIndex(formValues.appellations, appellationIndex);
              setValue("appellations", newAppellations);
            }}
            currentAppellations={formValues.appellations}
            error={errors?.appellations?.message}
          />
          <BusinessContact />

          {mode === "edit" && (
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

          {mode === "edit" && (
            <>
              <p>
                Vous pouvez demander la suppression définitive de votre
                entreprise{" "}
                <a href={mailtoHref(formValues.siret)}>en cliquant ici</a>
              </p>
              <p>
                Si vous avez besoin d'aide, envoyez-nous un email: <br />
                {immersionFacileContactEmail}
              </p>
            </>
          )}
          {keys(errors).length === 0 && keys(touchedFields).length > 0 && (
            <SearchResultPreview establishment={formValues} />
          )}
          <ErrorNotifications
            labels={getFormErrors()}
            errors={toDotNotation(formErrorsToFlatErrors(errors))}
            visible={submitCount !== 0 && Object.values(errors).length > 0}
          />
          {feedback.kind === "errored" && (
            <Alert
              severity="error"
              title="Veuillez nous excuser. Un problème est survenu qui a compromis l'enregistrement de vos informations. "
              description={feedback.errorMessage}
            />
          )}
          {feedback.kind === "submitSuccess" && (
            <Alert
              severity="success"
              title="Succès de l'envoi"
              description="Succès. Nous avons bien enregistré les informations concernant
                votre entreprise."
            />
          )}
          {feedback.kind !== "submitSuccess" && (
            <div className={fr.cx("fr-mt-4w")}>
              <Button
                iconId="fr-icon-checkbox-circle-line"
                iconPosition="left"
                type="submit"
                disabled={isSubmitting}
                nativeButtonProps={{
                  id: domElementIds.establishment.submitButton,
                }}
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

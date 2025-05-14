import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ElementRef, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  type AppellationDto,
  type ContactEstablishmentInPersonDto,
  contactEstablishmentInPersonSchema,
  domElementIds,
  levelsOfEducation,
} from "shared";
import { TranscientPreferencesDisplay } from "src/app/components/immersion-offer/TranscientPreferencesDisplay";
import {
  getDefaultAppellationCode,
  makeContactInputsLabelsByKey,
} from "src/app/components/immersion-offer/contactUtils";
import {
  transcientExpirationTimeInMinutes,
  useTranscientDataFromStorage,
} from "src/app/components/immersion-offer/useTranscientDataFromStorage";
import { useContactEstablishmentError } from "src/app/components/search/useContactEstablishmentError";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { type routes, useRoute } from "src/app/routes/routes";
import { outOfReduxDependencies } from "src/config/dependencies";
import type { Route } from "type-route";

type ContactInPersonProps = {
  appellations: AppellationDto[];
  onSubmitSuccess: () => void;
};

export const ContactInPerson = ({
  appellations,
  onSubmitSuccess,
}: ContactInPersonProps) => {
  const { activeError, setActiveErrorKind } = useContactEstablishmentError();
  const route = useRoute() as Route<
    typeof routes.searchResult | typeof routes.searchResultForStudent
  >;
  const {
    getTranscientDataForScope,
    setTranscientDataForScope,
    getPreferUseTranscientDataForScope,
  } = useTranscientDataFromStorage("contact-establishment", false);
  const transcientDataForScope = getTranscientDataForScope();
  const preferUseTranscientData = getPreferUseTranscientDataForScope();
  const acquisitionParams = useGetAcquisitionParams();
  const inputsLabelsByKey = makeContactInputsLabelsByKey(
    route.name === "searchResult" ? "IF" : "1_ELEVE_1_STAGE",
  );
  const initialValues: ContactEstablishmentInPersonDto = useMemo(
    () => ({
      siret: route.params.siret,
      appellationCode: getDefaultAppellationCode(
        appellations,
        route.params.appellationCode,
      ),
      contactMode: "IN_PERSON",
      potentialBeneficiaryFirstName: route.params.contactFirstName ?? "",
      potentialBeneficiaryLastName: route.params.contactLastName ?? "",
      potentialBeneficiaryEmail: route.params.contactEmail ?? "",
      locationId: route.params.location ?? "",
      ...acquisitionParams,
      ...(preferUseTranscientData && transcientDataForScope?.value
        ? { ...transcientDataForScope.value }
        : {}),
      ...(route.name === "searchResult"
        ? {
            kind: "IF",
          }
        : {
            kind: "1_ELEVE_1_STAGE",
            levelOfEducation: "3ème",
          }),
    }),
    [
      route.params,
      appellations,
      acquisitionParams,
      preferUseTranscientData,
      transcientDataForScope,
    ],
  );

  const appellationListOfOptions = appellations.map((appellation) => ({
    value: appellation.appellationCode,
    label: appellation.appellationLabel,
  }));

  const methods = useForm<ContactEstablishmentInPersonDto>({
    resolver: zodResolver(contactEstablishmentInPersonSchema),
    mode: "onTouched",
    defaultValues: initialValues,
  });
  const {
    register,
    handleSubmit,
    formState,
    formState: { isSubmitting },
    reset,
  } = methods;

  const getFieldError = makeFieldError(formState);

  const formRef = useRef<ElementRef<"form">>(null);

  const onFormValid = async (values: ContactEstablishmentInPersonDto) => {
    const errorKind =
      await outOfReduxDependencies.searchGateway.contactEstablishment(values);
    if (errorKind) return setActiveErrorKind(errorKind);
    onSubmitSuccess();
    setTranscientDataForScope(values, transcientExpirationTimeInMinutes);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormValid)}
      id={domElementIds[route.name].contactInPersonForm}
      data-matomo-name={domElementIds[route.name].contactInPersonForm}
      ref={formRef}
    >
      <TranscientPreferencesDisplay
        scope="contact-establishment"
        onPreferencesChange={(accept) => {
          const newInitialValues = accept
            ? {
                ...initialValues,
                ...transcientDataForScope?.value,
              }
            : initialValues;
          reset(newInitialValues);
        }}
        mode={"form-overlay"}
        parentRef={formRef}
      />
      <>
        <p className={"fr-my-2w"}>
          Cette entreprise souhaite que vous vous présentiez directement pour
          candidater.
        </p>
        <p className={"fr-my-2w"}>
          Merci de nous indiquer vos coordonnées. Vous recevrez par e-mail le
          nom de la personne à contacter ainsi que des conseils pour présenter
          votre demande d’immersion. Ces informations sont personnelles et
          confidentielles. Elles ne peuvent pas être communiquées à d’autres
          personnes.
        </p>
        <p className={"fr-my-2w"}>Merci !</p>
        <Input
          label={inputsLabelsByKey.potentialBeneficiaryEmail}
          nativeInputProps={{
            ...register("potentialBeneficiaryEmail"),
            type: "email",
          }}
          {...getFieldError("potentialBeneficiaryEmail")}
        />
        <Input
          label={inputsLabelsByKey.potentialBeneficiaryFirstName}
          nativeInputProps={register("potentialBeneficiaryFirstName")}
          {...getFieldError("potentialBeneficiaryFirstName")}
        />
        <Input
          label={inputsLabelsByKey.potentialBeneficiaryLastName}
          nativeInputProps={register("potentialBeneficiaryLastName")}
          {...getFieldError("potentialBeneficiaryLastName")}
        />
        {appellations.length > 1 && (
          <Select
            label={inputsLabelsByKey.appellationCode}
            options={appellationListOfOptions}
            placeholder={"Sélectionnez un métier"}
            nativeSelectProps={{
              ...register("appellationCode"),
            }}
            {...getFieldError("appellationCode")}
          />
        )}
        {route.name === "searchResultForStudent" && (
          <Select
            label={inputsLabelsByKey.levelOfEducation}
            options={levelsOfEducation
              .filter((level) => level === "3ème" || level === "2nde")
              .map((level: string) => ({ label: level, value: level }))}
            nativeSelectProps={{
              ...register("levelOfEducation"),
            }}
            {...getFieldError("levelOfEducation")}
          />
        )}

        <Button
          priority="secondary"
          type="submit"
          disabled={isSubmitting || activeError.isActive}
          nativeButtonProps={{
            id: domElementIds[route.name].contactInPersonButton,
          }}
        >
          Envoyer
        </Button>

        {activeError.isActive && (
          <Alert
            severity="error"
            title={activeError.title}
            description={activeError.description}
          />
        )}
      </>
    </form>
  );
};

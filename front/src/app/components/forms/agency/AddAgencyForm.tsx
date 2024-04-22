import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import RadioButtons, {
  RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorNotifications, LinkHome } from "react-design-system";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import {
  AgencyDto,
  AgencyKind,
  CreateAgencyDto,
  DepartmentCode,
  createAgencySchema,
  domElementIds,
  toDotNotation,
} from "shared";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { agencySubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import {
  AgencyFormCommonFields,
  AgencyLogoUpload,
} from "src/app/components/forms/agency/AgencyFormCommonFields";
import { agencyListOfOptions } from "src/app/components/forms/agency/agencyKindToLabel";
import {
  AgencySelector,
  departmentOptions,
} from "src/app/components/forms/commons/AgencySelector";
import { formAgencyFieldsLabels } from "src/app/contents/forms/agency/formAgency";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import {
  formErrorsToFlatErrors,
  getFormContents,
} from "src/app/hooks/formContents.hooks";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { routes } from "src/app/routes/routes";
import { outOfReduxDependencies } from "src/config/dependencies";
import { AgencySubmitFeedback } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { P, match } from "ts-pattern";
import { v4 as uuidV4 } from "uuid";
import errorSvg from "../../../../assets/img/error.svg";
import successSvg from "../../../../assets/img/success.svg";

type CreateAgencyInitialValues = Omit<CreateAgencyDto, "kind"> & {
  kind: AgencyKind | "";
};

export const AddAgencyForm = () => {
  const [refersToOtherAgency, setRefersToOtherAgency] = useState<
    boolean | undefined
  >(undefined);
  const [submitFeedback, setSubmitFeedback] = useState<AgencySubmitFeedback>({
    kind: "idle",
  });
  useScrollToTop(submitFeedback.kind === "agencyAdded");
  useScrollToTop(submitFeedback.kind === "agencyOfTypeOtherAdded");
  const onFormValid: SubmitHandler<CreateAgencyInitialValues> = (values) => {
    if (values.kind === "") throw new Error("Agency kind is empty");
    return outOfReduxDependencies.agencyGateway
      .addAgency({
        ...values,
        kind: values.kind,
        questionnaireUrl:
          values.kind === "pole-emploi" ? null : values.questionnaireUrl,
      })
      .then(() => {
        setSubmitFeedback({
          kind:
            values.kind !== "autre" || values.refersToAgencyId
              ? "agencyAdded"
              : "agencyOfTypeOtherAdded",
        });
      })
      .catch((e) => {
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log("AddAgencyPage", e);
        setSubmitFeedback({ kind: "errored", errorMessage: e.message });
      });
  };

  const refersToOtherAgencyOptions: RadioButtonsProps["options"] = [
    {
      label: "Prescripteur",
      nativeInputProps: {
        onClick: () => {
          setRefersToOtherAgency(false);
        },
      },
    },
    {
      label: "Structure d'accompagnement",
      nativeInputProps: {
        onClick: () => setRefersToOtherAgency(true),
      },
    },
  ];
  if (
    submitFeedback.kind === "agencyAdded" ||
    submitFeedback.kind === "agencyOfTypeOtherAdded"
  ) {
    return (
      <SubmitFeedbackNotification
        submitFeedback={submitFeedback}
        messageByKind={agencySubmitMessageByKind}
      />
    );
  }
  return (
    <>
      <RadioButtons
        id={domElementIds.addAgency.agencyRefersToInput}
        legend={"Êtes-vous un prescripteur ou une structure d'accompagnement ?"}
        options={refersToOtherAgencyOptions}
      />
      {match(refersToOtherAgency)
        .with(P.boolean, (refersToOtherAgency) => (
          <AgencyForm
            refersToOtherAgency={refersToOtherAgency}
            key={`add-agency-form-${refersToOtherAgency}`}
            submitFeedback={submitFeedback}
            onFormValid={onFormValid}
          />
        ))
        .with(undefined, () => null)
        .exhaustive()}
    </>
  );
};

type AgencyFormProps = {
  refersToOtherAgency: boolean;
  submitFeedback: AgencySubmitFeedback;
  onFormValid: SubmitHandler<CreateAgencyInitialValues>;
};

const AgencyForm = ({
  refersToOtherAgency,
  submitFeedback,
  onFormValid,
}: AgencyFormProps) => {
  const { getFormErrors, getFormFields } = getFormContents(
    formAgencyFieldsLabels,
  );
  const formContents = getFormFields();
  const acquisitionParams = useGetAcquisitionParams();

  const formInitialValues = useMemo(
    () => ({
      ...initialValues(uuidV4()),
      ...acquisitionParams,
      validatorEmails: refersToOtherAgency ? ["temp@temp.com"] : [],
    }),
    [refersToOtherAgency, acquisitionParams],
  );
  const methods = useForm<CreateAgencyInitialValues>({
    resolver: zodResolver(createAgencySchema),
    mode: "onTouched",
    defaultValues: formInitialValues,
  });

  const { handleSubmit, formState, reset, register, watch } = methods;

  const agenciesRetrieverMemoized = useCallback(
    (departmentCode: DepartmentCode) =>
      outOfReduxDependencies.agencyGateway.getFilteredAgencies({
        departmentCode,
        kind: "withoutRefersToAgency",
      }),
    [],
  );

  useEffect(() => {
    reset(formInitialValues);
  }, [reset, formInitialValues]);
  const [hasDelegation, setHasDelegation] = useState<boolean | null>(null);
  const selectedKind = watch("kind");

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onFormValid)}
        id={domElementIds.addAgency.form}
        data-matomo-name={domElementIds.addAgency.form}
      >
        <p className={fr.cx("fr-text--xs")}>
          Tous les champs marqués d'une astérisque (*) sont obligatoires.
        </p>
        {refersToOtherAgency && (
          <>
            <h2 className={fr.cx("fr-text--lead", "fr-mb-2w")}>
              Qui est le prescripteur référent de votre structure
              d'accompagnement ?
            </h2>
            <p>Il sera le validateur final des conventions</p>
            <AgencySelector
              fields={{
                agencyDepartmentField: {
                  name: "refersToAgencyDepartment",
                  label: "Département",
                  required: true,
                  id: "refersToAgencyDepartment",
                  placeholder: "Sélectionnez un département",
                },
                agencyIdField: formContents.refersToAgencyId,
                agencyKindField: {
                  name: "refersToAgencyKind",
                  label: "Type de structure",
                  required: true,
                  id: "refersToAgencyKind",
                  placeholder: "Veuillez choisir un type de structure",
                },
              }}
              shouldLockToPeAgencies={false}
              shouldFilterDelegationPrescriptionAgencyKind={true}
              shouldShowAgencyKindField
              agencyDepartmentOptions={departmentOptions}
              agenciesRetriever={agenciesRetrieverMemoized}
            />
          </>
        )}
        <h2 className={fr.cx("fr-text--lead", "fr-mb-2w")}>
          {refersToOtherAgency ? "Votre structure" : "Prescripteur"}
        </h2>
        <Select
          label={formContents.kind.label}
          hint={formContents.kind.hintText}
          options={agencyListOfOptions.sort((a, b) =>
            a.label < b.label ? -1 : 0,
          )}
          placeholder={formContents.kind.placeholder}
          nativeSelectProps={{
            ...formContents.kind,
            ...register("kind"),
          }}
          state={selectedKind === "pole-emploi" ? "error" : "default"}
          stateRelatedMessage={
            selectedKind === "pole-emploi" ? agencyErrorMessage : undefined
          }
        />

        {selectedKind === "autre" && !refersToOtherAgency && (
          <RadioButtons
            legend="Avez-vous déjà une convention de délégation ? *"
            name="hasDelegation"
            options={hasDelegationOptions.map((option) => ({
              ...option,
              nativeInputProps: {
                ...option.nativeInputProps,
                checked:
                  Boolean(option.nativeInputProps.value) === hasDelegation,
                onChange: () => {
                  setHasDelegation(option.nativeInputProps.value === 1);
                },
              },
            }))}
            orientation="vertical"
          />
        )}

        {match({ selectedKind, hasDelegation, refersToOtherAgency })
          .with(
            {
              selectedKind: "autre",
              hasDelegation: true,
            },
            { selectedKind: P.not("").and(P.not("autre")) },
            {
              selectedKind: "autre",
              hasDelegation: P.nullish,
              refersToOtherAgency: true,
            },
            () => (
              <>
                <AgencyFormCommonFields
                  refersToOtherAgency={refersToOtherAgency}
                />
                <AgencyLogoUpload />

                <ErrorNotifications
                  labels={getFormErrors()}
                  errors={toDotNotation(
                    formErrorsToFlatErrors(formState.errors),
                  )}
                  visible={
                    formState.submitCount !== 0 &&
                    Object.values(formState.errors).length > 0
                  }
                />
                <input
                  id={domElementIds.addAgency.id}
                  {...methods.register("id")}
                  type="hidden"
                />
                <SubmitFeedbackNotification
                  submitFeedback={submitFeedback}
                  messageByKind={agencySubmitMessageByKind}
                />
                <div className={fr.cx("fr-mt-4w")}>
                  <Button
                    type="submit"
                    disabled={formState.isSubmitting}
                    nativeButtonProps={{
                      id: domElementIds.addAgency.submitButton,
                    }}
                  >
                    Soumettre
                  </Button>
                </div>
              </>
            ),
          )
          .with({ selectedKind: "autre", hasDelegation: false }, () => (
            <Alert
              severity="info"
              title="Vous ne pouvez pas finaliser votre référencement sans convention de délégation"
              description={
                <>
                  Remplissez ce formulaire afin de recevoir par mail le contact
                  du prescripteur de droit qui peut vous délivrer votre
                  convention de délégation:{" "}
                  <a
                    href="https://tally.so/r/w7WM49"
                    target="_blank"
                    rel="noreferrer"
                  >
                    https://tally.so/r/w7WM49
                  </a>
                </>
              }
            />
          ))
          .with(
            {
              selectedKind: "",
              hasDelegation: null,
            },
            {
              selectedKind: "",
              hasDelegation: false,
            },
            {
              selectedKind: "",
              hasDelegation: true,
            },
            {
              selectedKind: "autre",
              hasDelegation: null,
            },
            () => undefined,
          )
          .exhaustive()}
      </form>
    </FormProvider>
  );
};

const initialValues: (id: AgencyDto["id"]) => CreateAgencyInitialValues = (
  id,
) => ({
  id,
  kind: "",
  name: "",
  coveredDepartments: [],
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
  questionnaireUrl: null,
  logoUrl: null,
  signature: "",
  agencySiret: "",
  refersToAgencyId: null,
});

const agencyErrorMessage = (
  <span>
    Attention, toutes les agences France Travail ont déjà été ajoutées par notre
    équipe sur Immersion Facilitée.{" "}
    <LinkHome {...routes.agencyDashboard().link}>
      Accéder à votre espace prescripteur.
    </LinkHome>
  </span>
);

const hasDelegationOptions: RadioButtonsProps["options"] = [
  {
    illustration: <img src={successSvg} alt="" />,
    label: "Oui",
    nativeInputProps: {
      value: 1,
    },
    hintText:
      "J'ai une délégation délivrée par France Travail, Mission Locale ou Cap Emploi",
  },
  {
    illustration: <img src={errorSvg} alt="" />,
    label: "Non",
    nativeInputProps: {
      value: 0,
    },
    hintText: `Je dois en faire la demande auprès d'un prescipteur de plein droit`,
  },
];

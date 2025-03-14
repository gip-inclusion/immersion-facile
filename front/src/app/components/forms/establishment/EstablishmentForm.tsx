import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Stepper, { type StepperProps } from "@codegouvfr/react-dsfr/Stepper";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "react-design-system";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type DotNestedKeys,
  type EstablishmentFormUserRights,
  type FormEstablishmentDto,
  domElementIds,
  errors,
  formEstablishmentSchema,
} from "shared";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { AvailabilitySection } from "src/app/components/forms/establishment/sections/AvailabilitySection";
import { BusinessContactSection } from "src/app/components/forms/establishment/sections/BusinessContactSection";
import { CreateIntroSection } from "src/app/components/forms/establishment/sections/CreateIntroSection";
import { DetailsSection } from "src/app/components/forms/establishment/sections/DetailsSection";
import { SearchableBySection } from "src/app/components/forms/establishment/sections/SearchableBySection";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useInitialSiret } from "src/app/hooks/siret.hooks";
import { useDebounce } from "src/app/hooks/useDebounce";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { frontErrors } from "src/app/pages/error/front-errors";
import {
  formEstablishmentDtoToFormEstablishmentWithAcquisitionQueryParams,
  formEstablishmentQueryParamsToFormEstablishmentDto,
} from "src/app/routes/routeParams/formEstablishment";
import { establishmentParams, routes, useRoute } from "src/app/routes/routes";
import {
  filterParamsForRoute,
  getUrlParameters,
} from "src/app/utils/url.utils";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";
import { P, match } from "ts-pattern";
import type { Route } from "type-route";

type RouteByMode = {
  create:
    | Route<typeof routes.formEstablishment>
    | Route<typeof routes.formEstablishmentForExternals>;
  edit: Route<typeof routes.establishmentDashboard>;
  admin: Route<typeof routes.manageEstablishmentAdmin>;
};

export type Mode = keyof RouteByMode;

type EstablishmentFormProps = {
  mode: Mode;
};

type FormStep = 1 | 2 | 3 | 4;

const steps: Record<FormStep, Pick<StepperProps, "title" | "nextTitle">> = {
  1: {
    title: "Visibilité",
    nextTitle: "Référent immersion",
  },
  2: {
    title: "Type de candidats",
    nextTitle: "Référent immersion",
  },
  3: {
    title: "Référent immersion",
    nextTitle: "Votre fiche dans l’annuaire Immersion Facilitée",
  },
  4: {
    title: "Votre fiche dans l’annuaire Immersion Facilitée",
  },
};

export type Step = 0 | FormStep | null;
export type OnStepChange = (
  step: Step,
  fieldsToValidate: (
    | keyof FormEstablishmentDto
    | DotNestedKeys<FormEstablishmentDto>
  )[],
) => void;

export const EstablishmentForm = ({ mode }: EstablishmentFormProps) => {
  const dispatch = useDispatch();
  const adminJwt = useAdminToken();
  const route = useRoute() as RouteByMode[Mode];
  const initialUrlParams = useRef(getUrlParameters(window.location));

  const isEstablishmentCreation =
    route.name === "formEstablishment" ||
    route.name === "formEstablishmentForExternals";
  const isEstablishmentAdmin = route.name === "manageEstablishmentAdmin";
  const isEstablishmentDashboard = route.name === "establishmentDashboard";

  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const establishmentFeedback = useFeedbackTopic("form-establishment");
  const isLoading = useAppSelector(establishmentSelectors.isLoading);
  const initialFormEstablishment = useAppSelector(
    establishmentSelectors.formEstablishment,
  );

  const initialUserRights: EstablishmentFormUserRights = useMemo(
    () =>
      mode === "create"
        ? [
            {
              email: federatedIdentity?.email ?? "",
              job: "",
              phone: "",
              role: "establishment-admin",
            },
          ]
        : initialFormEstablishment.userRights,

    [federatedIdentity, initialFormEstablishment.userRights, mode],
  );

  const [availableForImmersion, setAvailableForImmersion] = useState<
    boolean | undefined
  >(undefined);
  const [invalidEmailMessage, setInvalidEmailMessage] =
    useState<ReactNode | null>(null);

  const [currentStep, setCurrentStep] = useState<Step>(
    isEstablishmentAdmin || isEstablishmentDashboard ? null : 0,
  );
  const acquisitionParams = useGetAcquisitionParams();
  const siretFromFederatedIdentity =
    federatedIdentity?.provider === "connectedUser"
      ? federatedIdentity.siret
      : undefined;

  const defaultFormValues = useMemo(
    () => ({
      ...initialFormEstablishment,
      ...acquisitionParams,
      maxContactsPerMonth: undefined,
      userRights: initialUserRights,
      siret: siretFromFederatedIdentity,
    }),
    [
      initialFormEstablishment,
      acquisitionParams,
      initialUserRights,
      siretFromFederatedIdentity,
    ],
  );

  const currentRoute = isEstablishmentDashboard ? route : useRef(route).current;

  const methods = useForm<FormEstablishmentDto>({
    defaultValues: defaultFormValues,
    resolver: zodResolver(formEstablishmentSchema),
    mode: "onTouched",
  });
  const { handleSubmit, getValues, reset, trigger } = methods;
  const formValues = getValues();
  const debouncedFormValues = useDebounce(formValues);

  useInitialSiret(
    (isEstablishmentCreation || isEstablishmentDashboard) && route.params.siret
      ? route.params.siret
      : "",
  );
  useScrollToTop(establishmentFeedback?.level === "success" || currentStep);

  useEffect(() => {
    match({ route: currentRoute, adminJwt, inclusionConnectedJwt })
      .with(
        {
          route: {
            name: P.union("formEstablishment", "formEstablishmentForExternals"),
          },
        },
        ({ route }) =>
          dispatch(
            establishmentSlice.actions.fetchEstablishmentRequested({
              establishmentRequested:
                formEstablishmentQueryParamsToFormEstablishmentDto(
                  route.params,
                ),
              feedbackTopic: "form-establishment",
            }),
          ),
      )
      .with(
        { route: { name: "manageEstablishmentAdmin" }, adminJwt: P.nullish },
        () => {
          throw errors.user.notBackOfficeAdmin();
        },
      )
      .with(
        {
          route: { name: "manageEstablishmentAdmin" },
          adminJwt: P.not(P.nullish),
        },
        ({ route, adminJwt }) =>
          dispatch(
            establishmentSlice.actions.fetchEstablishmentRequested({
              establishmentRequested: {
                siret: route.params.siret,
                jwt: adminJwt,
              },
              feedbackTopic: "form-establishment",
            }),
          ),
      )
      .with(
        {
          route: { name: "establishmentDashboard" },
          inclusionConnectedJwt: P.not(P.nullish),
        },
        ({ route, inclusionConnectedJwt }) =>
          dispatch(
            establishmentSlice.actions.fetchEstablishmentRequested({
              establishmentRequested: {
                siret: route.params.siret,
                jwt: inclusionConnectedJwt,
              },
              feedbackTopic: "form-establishment",
            }),
          ),
      )
      .with(
        {
          route: { name: "establishmentDashboard" },
          inclusionConnectedJwt: P.nullish,
        },
        () => {
          throw errors.user.unauthorized();
        },
      )
      .exhaustive();
  }, [adminJwt, dispatch, inclusionConnectedJwt, currentRoute]);

  useEffect(() => {
    return () => {
      dispatch(establishmentSlice.actions.clearEstablishmentRequested());
    };
  }, [dispatch]);

  useEffect(() => {
    reset({
      ...defaultFormValues,
      maxContactsPerMonth:
        mode === "create"
          ? undefined
          : initialFormEstablishment.maxContactsPerMonth,
    });
  }, [defaultFormValues, reset, mode, initialFormEstablishment]);

  useEffect(() => {
    if (isEstablishmentCreation) {
      const filteredParams = filterParamsForRoute({
        urlParams: initialUrlParams.current,
        matchingParams: establishmentParams,
      });
      routes
        .formEstablishment(
          formEstablishmentDtoToFormEstablishmentWithAcquisitionQueryParams({
            ...filteredParams,
            ...debouncedFormValues,
          }),
        )
        .replace();
    }
  }, [debouncedFormValues, isEstablishmentCreation]);

  const onSubmit: SubmitHandler<FormEstablishmentDto> = (formEstablishment) =>
    match({ route, adminJwt, inclusionConnectedJwt })
      .with(
        {
          route: {
            name: P.union("formEstablishment", "formEstablishmentForExternals"), // TODO : formEstablishmentForExternals ???
          },
          inclusionConnectedJwt: P.not(P.nullish),
        },
        ({ inclusionConnectedJwt }) =>
          dispatch(
            establishmentSlice.actions.createEstablishmentRequested({
              formEstablishment,
              feedbackTopic: "form-establishment",
              jwt: inclusionConnectedJwt,
            }),
          ),
      )
      .with(
        {
          route: { name: "manageEstablishmentAdmin" },
          adminJwt: P.not(P.nullish),
        },
        ({ adminJwt }) =>
          dispatch(
            establishmentSlice.actions.updateEstablishmentRequested({
              establishmentUpdate: {
                formEstablishment,
                jwt: adminJwt,
              },
              feedbackTopic: "form-establishment",
            }),
          ),
      )
      .with(
        {
          route: { name: "establishmentDashboard" },
          inclusionConnectedJwt: P.not(P.nullish),
        },
        ({ inclusionConnectedJwt }) =>
          dispatch(
            establishmentSlice.actions.updateEstablishmentRequested({
              establishmentUpdate: {
                formEstablishment,
                jwt: inclusionConnectedJwt,
              },
              feedbackTopic: "form-establishment",
            }),
          ),
      )
      .with(
        {
          route: {
            name: P.union("formEstablishment", "formEstablishmentForExternals"),
          },
          inclusionConnectedJwt: P.nullish,
        },
        () => {
          throw frontErrors.generic.unauthorized();
        },
      )
      .with(
        {
          route: { name: "manageEstablishmentAdmin" },
          adminJwt: P.nullish,
        },
        () => {
          throw frontErrors.generic.unauthorized();
        },
      )
      .with(
        {
          route: { name: "establishmentDashboard" },
          inclusionConnectedJwt: P.nullish,
        },
        () => {
          throw new Error("Accès interdit sans être inclusion connecté.");
        },
      )
      .exhaustive();

  if (isLoading) return <Loader />;

  const onStepChange: OnStepChange = async (targetStep, fieldsToValidate) => {
    if (targetStep && currentStep && targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    const validatedFields = await Promise.all(
      fieldsToValidate.map((key) => trigger(key)),
    );
    if (validatedFields.every((validatedField) => validatedField)) {
      if (
        currentStep === 1 &&
        availableForImmersion === undefined &&
        mode === "create"
      )
        return;
      setCurrentStep(targetStep);
    }
  };

  return (
    <WithFeedbackReplacer topic="form-establishment">
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          id={domElementIds.establishment[mode].form}
          data-matomo-name={domElementIds.establishment[mode].form}
        >
          {match(currentStep)
            .with(null, () => (
              <>
                {isEstablishmentAdmin && (
                  <Button
                    onClick={() => {
                      routes.adminEstablishments().push();
                    }}
                    type="button"
                    priority="secondary"
                    className={fr.cx("fr-mb-4w")}
                  >
                    Retour au pilotage des établissements
                  </Button>
                )}
                <h1>Pilotage de l'entreprise {formValues.siret}</h1>
                <h2>{steps[1].title}</h2>
                <AvailabilitySection
                  mode={mode}
                  onStepChange={onStepChange}
                  currentStep={currentStep}
                  setAvailableForImmersion={setAvailableForImmersion}
                  availableForImmersion={availableForImmersion}
                  shouldUpdateAvailability={Boolean(
                    initialUrlParams.current.shouldUpdateAvailability,
                  )}
                />
                <h2>{steps[2].title}</h2>
                <SearchableBySection
                  mode={mode}
                  onStepChange={onStepChange}
                  currentStep={currentStep}
                />
                <h2>{steps[3].title}</h2>
                <BusinessContactSection
                  mode={mode}
                  onStepChange={onStepChange}
                  currentStep={currentStep}
                  setInvalidEmailMessage={setInvalidEmailMessage}
                />
                <h2>{steps[4].title}</h2>
                <DetailsSection
                  mode={mode}
                  isEstablishmentAdmin={isEstablishmentAdmin}
                  currentStep={currentStep}
                  onStepChange={onStepChange}
                  invalidEmailMessage={invalidEmailMessage}
                />
              </>
            ))
            .with(0, () => <CreateIntroSection onStepChange={onStepChange} />)
            .otherwise((currentStep) => (
              <div className={fr.cx("fr-col-8")}>
                <Stepper
                  currentStep={currentStep}
                  stepCount={keys(steps).length}
                  title={steps[currentStep].title}
                  nextTitle={steps[currentStep].nextTitle}
                />
                {match(currentStep)
                  .with(1, () => (
                    <AvailabilitySection
                      mode={mode}
                      onStepChange={onStepChange}
                      currentStep={currentStep}
                      availableForImmersion={availableForImmersion}
                      setAvailableForImmersion={setAvailableForImmersion}
                      shouldUpdateAvailability={undefined}
                    />
                  ))
                  .with(2, () => (
                    <SearchableBySection
                      mode={mode}
                      onStepChange={onStepChange}
                      currentStep={currentStep}
                    />
                  ))
                  .with(3, () => (
                    <BusinessContactSection
                      mode={mode}
                      onStepChange={onStepChange}
                      currentStep={currentStep}
                      setInvalidEmailMessage={setInvalidEmailMessage}
                    />
                  ))
                  .with(4, () => (
                    <DetailsSection
                      isEstablishmentAdmin={isEstablishmentAdmin}
                      mode={mode}
                      currentStep={currentStep}
                      onStepChange={onStepChange}
                      invalidEmailMessage={invalidEmailMessage}
                    />
                  ))
                  .exhaustive()}
              </div>
            ))}
        </form>
      </FormProvider>
    </WithFeedbackReplacer>
  );
};

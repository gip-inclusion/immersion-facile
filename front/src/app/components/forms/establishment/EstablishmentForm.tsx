import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Stepper, { StepperProps } from "@codegouvfr/react-dsfr/Stepper";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader } from "react-design-system";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  DotNestedKeys,
  EstablishmentJwtPayload,
  FormEstablishmentDto,
  decodeMagicLinkJwtWithoutSignatureCheck,
  domElementIds,
  expiredMagicLinkErrorMessage,
  formEstablishmentSchema,
  noContactPerWeek,
} from "shared";
import { AvailabilitySection } from "src/app/components/forms/establishment/sections/AvailabilitySection";
import { BusinessContactSection } from "src/app/components/forms/establishment/sections/BusinessContactSection";
import { DetailsSection } from "src/app/components/forms/establishment/sections/DetailsSection";
import { IntroSection } from "src/app/components/forms/establishment/sections/IntroSection";
import { SearchableBySection } from "src/app/components/forms/establishment/sections/SearchableBySection";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useInitialSiret } from "src/app/hooks/siret.hooks";
import { useDebounce } from "src/app/hooks/useDebounce";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import {
  formEstablishmentDtoToFormEstablishmentQueryParams,
  formEstablishmentQueryParamsToFormEstablishmentDto,
} from "src/app/routes/routeParams/formEstablishment";
import { establishmentParams, routes, useRoute } from "src/app/routes/routes";
import {
  filterParamsForRoute,
  getUrlParameters,
} from "src/app/utils/url.utils";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";
import {
  EstablishmentFeedback,
  establishmentSlice,
} from "src/core-logic/domain/establishmentPath/establishment.slice";
import { P, match } from "ts-pattern";
import { Route } from "type-route";

type RouteByMode = {
  create:
    | Route<typeof routes.formEstablishment>
    | Route<typeof routes.formEstablishmentForExternals>;
  edit:
    | Route<typeof routes.editFormEstablishment>
    | Route<typeof routes.establishmentDashboard>;
  admin: Route<typeof routes.manageEstablishmentAdmin>;
};

export type Mode = keyof RouteByMode;

type EstablishmentFormProps = {
  mode: Mode;
};

type FormStep = 1 | 2 | 3 | 4;

const steps: Record<FormStep, Pick<StepperProps, "title" | "nextTitle">> = {
  1: {
    title: "Planning",
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

  const feedback = useAppSelector(establishmentSelectors.feedback);
  const isLoading = useAppSelector(establishmentSelectors.isLoading);
  const initialFormEstablishment = useAppSelector(
    establishmentSelectors.formEstablishment,
  );

  const [availableForImmersion, setAvailableForImmersion] = useState<
    boolean | undefined
  >(undefined);

  const [currentStep, setCurrentStep] = useState<Step>(
    isEstablishmentAdmin || isEstablishmentDashboard ? null : 0,
  );
  const acquisitionParams = useGetAcquisitionParams();
  const methods = useForm<FormEstablishmentDto>({
    defaultValues: {
      ...initialFormEstablishment,
      ...acquisitionParams,
      maxContactsPerWeek: undefined,
    },
    resolver: zodResolver(formEstablishmentSchema),
    mode: "onTouched",
  });
  const { handleSubmit, getValues, reset, trigger } = methods;

  const formValues = getValues();
  const currentRoute = useRef(route);

  const debouncedFormValues = useDebounce(formValues);

  const isSearchable =
    Number.isNaN(formValues.maxContactsPerWeek) ||
    formValues.maxContactsPerWeek > noContactPerWeek;

  useInitialSiret(
    (isEstablishmentCreation ||
      isEstablishmentAdmin ||
      isEstablishmentDashboard) &&
      route.params.siret
      ? route.params.siret
      : "",
  );
  useScrollToTop(feedback.kind === "submitSuccess" || currentStep);

  const redirectToErrorOnFeedback = useCallback(
    (feedback: EstablishmentFeedback, jwt: string) => {
      if (feedback.kind === "errored") {
        if (!feedback.errorMessage.includes(expiredMagicLinkErrorMessage)) {
          throw new Error(feedback.errorMessage);
        }
        routes
          .renewConventionMagicLink({
            expiredJwt: jwt,
            originalURL: window.location.href,
          })
          .replace();
      }
    },
    [],
  );

  useEffect(() => {
    match({ route: currentRoute.current, adminJwt, inclusionConnectedJwt })
      .with(
        {
          route: {
            name: P.union("formEstablishment", "formEstablishmentForExternals"),
          },
        },
        ({ route }) =>
          dispatch(
            establishmentSlice.actions.establishmentRequested(
              formEstablishmentQueryParamsToFormEstablishmentDto(route.params),
            ),
          ),
      )
      .with({ route: { name: "editFormEstablishment" } }, ({ route }) =>
        dispatch(
          establishmentSlice.actions.establishmentRequested({
            siret:
              decodeMagicLinkJwtWithoutSignatureCheck<EstablishmentJwtPayload>(
                route.params.jwt,
              ).siret,
            jwt: route.params.jwt,
          }),
        ),
      )
      .with(
        { route: { name: "manageEstablishmentAdmin" }, adminJwt: P.nullish },
        () => {
          throw new Error("Accès interdit sans être connecté en admin.");
        },
      )
      .with(
        {
          route: { name: "manageEstablishmentAdmin" },
          adminJwt: P.not(P.nullish),
        },
        ({ route, adminJwt }) =>
          dispatch(
            establishmentSlice.actions.establishmentRequested({
              siret: route.params.siret,
              jwt: adminJwt,
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
            establishmentSlice.actions.establishmentRequested({
              siret: route.params.siret,
              jwt: inclusionConnectedJwt,
            }),
          ),
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
    return () => {
      dispatch(establishmentSlice.actions.establishmentClearRequested());
    };
  }, [adminJwt, dispatch, inclusionConnectedJwt, currentRoute.current]);

  useEffect(() => {
    reset({
      ...initialFormEstablishment,
      ...acquisitionParams,
      maxContactsPerWeek:
        mode === "create"
          ? undefined
          : initialFormEstablishment.maxContactsPerWeek,
    });
  }, [initialFormEstablishment, acquisitionParams, reset, mode]);

  useEffect(() => {
    if (isEstablishmentCreation) {
      const filteredParams = filterParamsForRoute(
        initialUrlParams.current,
        establishmentParams,
      );
      routes
        .formEstablishment(
          formEstablishmentDtoToFormEstablishmentQueryParams({
            ...filteredParams,
            ...debouncedFormValues,
          }),
        )
        .replace();
    }
  }, [debouncedFormValues, isEstablishmentCreation]);

  useEffect(() => {
    if (route.name === "editFormEstablishment") {
      redirectToErrorOnFeedback(feedback, route.params.jwt);
    }
  }, [feedback, redirectToErrorOnFeedback, route]);

  const onSubmit: SubmitHandler<FormEstablishmentDto> = (formEstablishment) =>
    match({ route, adminJwt, inclusionConnectedJwt })
      .with(
        {
          route: {
            name: P.union("formEstablishment", "formEstablishmentForExternals"),
          },
        },
        () =>
          dispatch(
            establishmentSlice.actions.establishmentCreationRequested(
              formEstablishment,
            ),
          ),
      )
      .with({ route: { name: "editFormEstablishment" } }, ({ route }) =>
        dispatch(
          establishmentSlice.actions.establishmentEditionRequested({
            formEstablishment,
            jwt: route.params.jwt,
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
            establishmentSlice.actions.establishmentEditionRequested({
              formEstablishment,
              jwt: adminJwt,
            }),
          ),
      )
      .with(
        {
          route: { name: "manageEstablishmentAdmin" },
          adminJwt: P.nullish,
        },
        () => {
          throw new Error("Accès interdit sans être connecté en admin.");
        },
      )
      .with(
        {
          route: { name: "establishmentDashboard" },
          inclusionConnectedJwt: P.not(P.nullish),
        },
        ({ inclusionConnectedJwt }) =>
          dispatch(
            establishmentSlice.actions.establishmentEditionRequested({
              formEstablishment,
              jwt: inclusionConnectedJwt,
            }),
          ),
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

  if (isLoading) {
    return <Loader />;
  }

  const onStepChange: OnStepChange = async (step, fieldsToValidate) => {
    if (step && currentStep && step < currentStep) {
      setCurrentStep(step);
      return;
    }
    const validatedFields = await Promise.all(
      fieldsToValidate.map((key) => trigger(key)),
    );
    if (validatedFields.every((validatedField) => validatedField)) {
      if (currentStep === 1 && availableForImmersion === undefined) return;
      setCurrentStep(step);
    }
  };
  return match(feedback)
    .with({ kind: "errored" }, (feedback) => {
      throw new Error(
        `Entreprise non trouvée : ${JSON.parse(feedback.errorMessage).errors}`,
      );
    })
    .with({ kind: "deleteSuccess" }, () => (
      <Alert
        severity="success"
        title="Succès de la suppression"
        description="Succès. Nous avons bien supprimé les informations concernant l'entreprise."
      />
    ))
    .with({ kind: "submitSuccess" }, () => (
      <Alert
        severity="success"
        title="Succès de l'envoi"
        description="Succès. Nous avons bien enregistré les informations concernant
        votre entreprise."
      />
    ))
    .otherwise(() => (
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          id={domElementIds.establishment[mode].form}
          data-matomo-name={domElementIds.establishment[mode].form}
        >
          {match(currentStep)
            .with(null, () => (
              <>
                <h1>Pilotage de l'entreprise {formValues.siret}</h1>
                <h2>{steps[1].title}</h2>
                <AvailabilitySection
                  mode={mode}
                  isSearchable={isSearchable}
                  onStepChange={onStepChange}
                  currentStep={currentStep}
                  setAvailableForImmersion={setAvailableForImmersion}
                  availableForImmersion={availableForImmersion}
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
                />
                <h2>{steps[4].title}</h2>
                <DetailsSection
                  mode={mode}
                  isEstablishmentAdmin={isEstablishmentAdmin}
                  currentStep={currentStep}
                  onStepChange={onStepChange}
                />
              </>
            ))
            .with(0, () => (
              <IntroSection onStepChange={onStepChange} mode={mode} />
            ))
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
                      isSearchable={isSearchable}
                      onStepChange={onStepChange}
                      currentStep={currentStep}
                      availableForImmersion={availableForImmersion}
                      setAvailableForImmersion={setAvailableForImmersion}
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
                    />
                  ))
                  .with(4, () => (
                    <DetailsSection
                      isEstablishmentAdmin={isEstablishmentAdmin}
                      mode={mode}
                      currentStep={currentStep}
                      onStepChange={onStepChange}
                    />
                  ))
                  .exhaustive()}
              </div>
            ))}
        </form>
      </FormProvider>
    ));
};

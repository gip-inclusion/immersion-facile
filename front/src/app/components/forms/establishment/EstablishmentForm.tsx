import React, { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Stepper, { StepperProps } from "@codegouvfr/react-dsfr/Stepper";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import { match, P } from "ts-pattern";
import { Route } from "type-route";
import {
  decodeMagicLinkJwtWithoutSignatureCheck,
  DotNestedKeys,
  EstablishmentJwtPayload,
  expiredMagicLinkErrorMessage,
  FormEstablishmentDto,
  formEstablishmentSchema,
  noContactPerWeek,
} from "shared";
import { Loader } from "react-design-system";
import { AvailabilitySection } from "src/app/components/forms/establishment/sections/AvailabilitySection";
import { BusinessContactSection } from "src/app/components/forms/establishment/sections/BusinessContactSection";
import { DetailsSection } from "src/app/components/forms/establishment/sections/DetailsSection";
import { IntroSection } from "src/app/components/forms/establishment/sections/IntroSection";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useInitialSiret } from "src/app/hooks/siret.hooks";
import { useDebounce } from "src/app/hooks/useDebounce";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import {
  formEstablishmentDtoToFormEstablishmentQueryParams,
  formEstablishmentQueryParamsToFormEstablishmentDto,
} from "src/app/routes/routeParams/formEstablishment";
import { routes, useRoute } from "src/app/routes/routes";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";
import {
  EstablishmentFeedback,
  establishmentSlice,
} from "src/core-logic/domain/establishmentPath/establishment.slice";

type RouteByMode = {
  create:
    | Route<typeof routes.formEstablishment>
    | Route<typeof routes.formEstablishmentForExternals>;
  edit: Route<typeof routes.editFormEstablishment>;
  admin: Route<typeof routes.manageEstablishmentAdmin>;
};

export type Mode = keyof RouteByMode;

type EstablishmentFormProps = {
  mode: Mode;
};

const steps: Record<1 | 2 | 3, Pick<StepperProps, "title" | "nextTitle">> = {
  1: {
    title: "Êtes-vous disponible pour recevoir des personnes en immersion ?",
    nextTitle: "Qui répondra aux demandes des candidats ?",
  },
  2: {
    title: "Qui répondra aux demandes des candidats ?",
    nextTitle: "Comment souhaitez-vous apparaître dans notre annuaire ?",
  },
  3: {
    title: "Comment souhaitez-vous apparaître dans notre annuaire ?",
  },
};

export type Step = 0 | keyof typeof steps | null;
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

  const isEstablishmentCreation =
    route.name === "formEstablishment" ||
    route.name === "formEstablishmentForExternals";
  const isEstablishmentAdmin = route.name === "manageEstablishmentAdmin";

  const feedback = useAppSelector(establishmentSelectors.feedback);
  const isLoading = useAppSelector(establishmentSelectors.isLoading);
  const initialFormEstablishment = useAppSelector(
    establishmentSelectors.formEstablishment,
  );

  const [availableForImmersion, setAvailableForImmersion] = useState<
    boolean | undefined
  >(undefined);

  const [currentStep, setCurrentStep] = useState<Step>(
    isEstablishmentAdmin ? null : 0,
  );

  const methods = useForm<FormEstablishmentDto>({
    defaultValues: {
      ...initialFormEstablishment,
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
    isNaN(formValues.maxContactsPerWeek) ||
    formValues.maxContactsPerWeek > noContactPerWeek;

  useInitialSiret(
    (isEstablishmentCreation || isEstablishmentAdmin) && route.params.siret
      ? route.params.siret
      : "",
  );

  const redirectToErrorOnFeedback = useCallback(
    (feedback: EstablishmentFeedback, jwt: string) => {
      if (feedback.kind === "errored") {
        if (feedback.errorMessage.includes(expiredMagicLinkErrorMessage)) {
          routes
            .renewConventionMagicLink({
              expiredJwt: jwt,
              originalURL: window.location.href,
            })
            .replace();
          return;
        }
        routes
          .errorRedirect({
            message: feedback.errorMessage,
            title: "Erreur",
          })
          .push();
      }
    },
    [],
  );

  useScrollToTop(currentStep);

  useEffect(() => {
    match({ route: currentRoute.current, adminJwt })
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
          routes
            .errorRedirect({
              message: "Accès interdit sans être connecté en admin.",
              title: "Erreur",
            })
            .push();
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

      .exhaustive();
    return () => {
      dispatch(establishmentSlice.actions.establishmentClearRequested());
    };
  }, [adminJwt, dispatch, currentRoute]);

  useEffect(() => {
    reset({
      ...initialFormEstablishment,
      maxContactsPerWeek:
        mode === "create"
          ? undefined
          : initialFormEstablishment.maxContactsPerWeek,
    });
  }, [initialFormEstablishment, reset, mode]);

  useEffect(() => {
    if (isEstablishmentCreation) {
      routes
        .formEstablishment(
          formEstablishmentDtoToFormEstablishmentQueryParams(
            debouncedFormValues,
          ),
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
    match({ route, adminJwt })
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
          routes
            .errorRedirect({
              message: "Accès interdit sans être connecté en admin.",
              title: "Erreur",
            })
            .push();
        },
      )
      .exhaustive();

  if (isLoading) {
    return <Loader />;
  }

  if (feedback.kind === "deleteSuccess") {
    return (
      <Alert
        severity="success"
        title="Succès de la suppression"
        description="Succès. Nous avons bien supprimé les informations concernant l'entreprise."
      />
    );
  }
  if (feedback.kind === "submitSuccess") {
    return (
      <Alert
        severity="success"
        title="Succès de l'envoi"
        description="Succès. Nous avons bien enregistré les informations concernant
      votre entreprise."
      />
    );
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

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
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
              <BusinessContactSection
                onStepChange={onStepChange}
                currentStep={currentStep}
              />
              <h2>{steps[3].title}</h2>
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
                  <BusinessContactSection
                    onStepChange={onStepChange}
                    currentStep={currentStep}
                  />
                ))
                .with(3, () => (
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
  );
};

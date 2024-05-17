import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Loader, SubmitConfirmationSection } from "react-design-system";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  Beneficiary,
  ConventionId,
  ConventionJwtPayload,
  ConventionReadDto,
  InternshipKind,
  conventionSchema,
  decodeMagicLinkJwtWithoutSignatureCheck,
  domElementIds,
  hasBeneficiaryCurrentEmployer,
  isBeneficiaryMinor,
  isEstablishmentTutorIsEstablishmentRepresentative,
  isPeConnectIdentity,
  notJobSeeker,
} from "shared";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { ConventionFormFields } from "src/app/components/forms/convention/ConventionFormFields";
import { ConventionPresentation } from "src/app/components/forms/convention/conventionHelpers";
import { useGetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useExistingSiret } from "src/app/hooks/siret.hooks";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { useMatomo } from "src/app/hooks/useMatomo";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { type ConventionCustomAgencyPageRoute } from "src/app/pages/convention/ConventionCustomAgencyPage";
import { type ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import { type ConventionMiniStagePageRoute } from "src/app/pages/convention/ConventionMiniStagePage";
import { type ConventionImmersionForExternalsRoute } from "src/app/pages/convention/ConventionPageForExternals";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import {
  fetchConventionInitialValuesFromUrl,
  makeValuesToWatchInUrl,
} from "src/app/routes/routeParams/convention";
import { routes, useRoute } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { match } from "ts-pattern";
import { Route } from "type-route";
import { ConventionSummary } from "./ConventionSummary";
import { useUpdateConventionValuesInUrl } from "./useUpdateConventionValuesInUrl";

const {
  Component: ConfirmDuplicateConventionModal,
  open: openConfirmDuplicateConventionModal,
  close: closeConfirmDuplicateConventionModal,
} = createModal({
  id: "confirm-duplicate-convention-modal",
  isOpenedByDefault: false,
});

const useWaitForReduxFormUiReadyBeforeInitialisation = (
  initialValues: ConventionPresentation,
) => {
  const [reduxFormUiReady, setReduxFormUiReady] = useState<boolean>(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      conventionSlice.actions.isMinorChanged(isBeneficiaryMinor(initialValues)),
    );
    dispatch(
      conventionSlice.actions.isCurrentEmployerChanged(
        hasBeneficiaryCurrentEmployer(initialValues),
      ),
    );
    dispatch(
      conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
        isEstablishmentTutorIsEstablishmentRepresentative(initialValues),
      ),
    );
    setReduxFormUiReady(true);
  }, [dispatch, initialValues]);

  return reduxFormUiReady;
};

export type ConventionFormMode = "create" | "edit";

type ConventionFormProps = {
  internshipKind: InternshipKind;
  mode: ConventionFormMode;
};

export type SupportedConventionRoutes =
  | ConventionImmersionPageRoute
  | ConventionMiniStagePageRoute
  | ConventionCustomAgencyPageRoute
  | ConventionImmersionForExternalsRoute;

export const ConventionForm = ({
  internshipKind,
  mode,
}: ConventionFormProps) => {
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const showSummary = useAppSelector(conventionSelectors.showSummary);

  const route = useRoute() as SupportedConventionRoutes;
  const conventionInitialValuesFromUrl = fetchConventionInitialValuesFromUrl({
    route,
    internshipKind,
  });
  const acquisitionParams = useGetAcquisitionParams();
  //TODO: pourquoi un useState sans setter avec juste valeurs initiales pour créer initialValues ???
  const [initialValues] = useState<ConventionPresentation>({
    ...conventionInitialValuesFromUrl,
    ...acquisitionParams,
    signatories: {
      ...conventionInitialValuesFromUrl.signatories,
      beneficiary: makeInitialBenefiaryForm(
        conventionInitialValuesFromUrl.signatories.beneficiary,
        federatedIdentity,
      ),
    },
  });

  useExistingSiret(initialValues.siret);
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const fetchedConvention = useAppSelector(conventionSelectors.convention);
  const fetchConventionError = useAppSelector(conventionSelectors.fetchError);
  const dispatch = useDispatch();

  //TODO: tentative de déplacer methods uniquement dans ConventionFormFields ???
  const methods = useForm<ConventionReadDto>({
    defaultValues:
      mode === "create" ? initialValues : fetchedConvention || initialValues,
    resolver: zodResolver(conventionSchema),
    mode: "onTouched",
  });
  const formSuccessfullySubmitted = submitFeedback.kind === "justSubmitted";

  //TODO: à déplacer dans ConventionFormFields ???
  useUpdateConventionValuesInUrl(makeValuesToWatchInUrl(methods.getValues())); // TODO: a placer dans ConventionFormFields???
  useMatomo(conventionInitialValuesFromUrl.internshipKind);
  useScrollToTop(formSuccessfullySubmitted);

  useEffect(() => {
    if (mode === "create") {
      dispatch(conventionSlice.actions.clearFetchedConvention());
      dispatch(
        conventionSlice.actions.showSummaryChangeRequested({
          showSummary: false,
        }),
      );
    }

    if (mode === "edit" && route.params.jwt) {
      dispatch(conventionSlice.actions.jwtProvided(route.params.jwt));
      const { applicationId: conventionId } =
        decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
          route.params.jwt,
        );
      dispatch(
        conventionSlice.actions.fetchConventionRequested({
          jwt: route.params.jwt,
          conventionId,
        }),
      );
    }

    return () => {
      dispatch(conventionSlice.actions.clearFetchedConvention());
      dispatch(conventionSlice.actions.clearFeedbackTriggered());
    };
  }, [dispatch, mode, route.params.jwt]);

  //TODO: à placer dans ConventionFormFields ????
  useEffect(() => {
    if (fetchedConvention) {
      methods.reset(fetchedConvention);
    }
  }, [fetchedConvention, methods.reset]);

  const reduxFormUiReady =
    useWaitForReduxFormUiReadyBeforeInitialisation(initialValues);

  const { copyButtonIsDisabled, copyButtonLabel, onCopyButtonClick } =
    useCopyButton();

  return (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      {match({
        showSummary,
        reduxFormUiReady,
        formSuccessfullySubmitted,
        shouldRedirectToError: !!(route.params.jwt && fetchConventionError),
        conventionCantBeEdited:
          mode === "edit" &&
          route.params.jwt &&
          fetchedConvention &&
          fetchedConvention?.status !== "DRAFT",
      })
        .with({ reduxFormUiReady: false }, () => <Loader />)
        .with(
          {
            formSuccessfullySubmitted: false,
          },
          ({ showSummary }) =>
            showSummary ? (
              <ConventionSummarySection />
            ) : (
              <ConventionFormFields methods={methods} mode={mode} />
            ),
        )
        .with({ formSuccessfullySubmitted: true }, () => (
          <SubmitConfirmationSection
            idToCopy={methods.getValues().id} //TODO: Le form est soumis donc on a la convention dans redux, on peut choper l'id dans redux au lieu du form????
            copyButtonIsDisabled={copyButtonIsDisabled}
            copyButtonLabel={copyButtonLabel}
            onCopyButtonClick={onCopyButtonClick}
          />
        ))
        .with({ shouldRedirectToError: true }, () => (
          <>
            {route.params.jwt && fetchConventionError && (
              <ShowErrorOrRedirectToRenewMagicLink
                errorMessage={fetchConventionError}
                jwt={route.params.jwt}
              />
            )}
          </>
        ))
        .with({ conventionCantBeEdited: true }, () => (
          <Alert
            severity="error"
            title="Cette convention ne peut plus être modifiée"
            description="Cette convention ne peut plus être modifiée car elle a déjà été signée, validée ou refusée."
          />
        ))
        .exhaustive()}
    </div>
  );
};

const makeInitialBenefiaryForm = (
  beneficiary: Beneficiary<"immersion" | "mini-stage-cci">,
  federatedIdentityWithUser: FederatedIdentityWithUser | null,
): Beneficiary<"immersion" | "mini-stage-cci"> => {
  const { federatedIdentity, ...beneficiaryOtherProperties } = beneficiary;
  const peConnectIdentity =
    federatedIdentityWithUser && isPeConnectIdentity(federatedIdentityWithUser)
      ? federatedIdentityWithUser
      : undefined;
  const federatedIdentityValue = federatedIdentity ?? peConnectIdentity;

  return {
    ...beneficiaryOtherProperties,
    ...(federatedIdentityValue?.token !== notJobSeeker && {
      federatedIdentity: federatedIdentityValue,
    }),
  };
};

const ConventionSummarySection = () => {
  const dispatch = useDispatch();
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const convention = useAppSelector(conventionSelectors.convention);
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const similarConventionIds = useAppSelector(
    conventionSelectors.similarConventionIds,
  );
  const route = useRoute() as Route<typeof routes.conventionImmersion>;

  const isEditingConvention = !!route.params.jwt;
  const shouldShowDuplicateWarning =
    !isEditingConvention && similarConventionIds.length > 0;

  useEffect(() => {
    if (!convention) return;
    dispatch(
      conventionSlice.actions.getSimilarConventionsRequested({
        codeAppellation: convention.immersionAppellation.appellationCode,
        siret: convention.siret,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        dateStart: convention.dateStart,
        beneficiaryBirthdate: convention.signatories.beneficiary.birthdate,
      }),
    );
  }, []);

  const onConfirmSubmit = () => {
    if (!convention) return;
    // TODO : show feedback if convention is null
    dispatch(
      conventionSlice.actions.saveConventionRequested({
        ...convention,
        status: "READY_TO_SIGN",
      }),
    );
  };

  return (
    <section>
      {
        //TODO il y a déjà un LOADER dans le composant parent. Nécéssaire?
        isLoading && <Loader />
      }
      <ConventionSummary />
      {convention && (
        <ConventionFeedbackNotification
          submitFeedback={submitFeedback}
          signatories={convention.signatories}
        />
      )}
      {shouldShowDuplicateWarning && (
        <DuplicateConventionAlert similarConventionIds={similarConventionIds} />
      )}
      <ButtonsGroup
        className={fr.cx("fr-mt-4w")}
        inlineLayoutWhen="sm and up"
        alignment="center"
        buttons={[
          {
            children: "Modifier la convention",
            onClick: () => {
              dispatch(
                conventionSlice.actions.showSummaryChangeRequested({
                  showSummary: false,
                }),
              );
            },
            id: domElementIds.conventionImmersionRoute.summaryEditButton,
            priority: "secondary",
          },
          {
            children: "Envoyer la convention",
            onClick: () =>
              shouldShowDuplicateWarning
                ? openConfirmDuplicateConventionModal()
                : onConfirmSubmit(),
            nativeButtonProps: {
              id: domElementIds.conventionImmersionRoute
                .confirmSubmitFormButton,
              disabled: isLoading,
            },
          },
        ]}
      />
      {createPortal(
        <ConfirmDuplicateConventionModal
          title={"Confirmer la création de cette convention"}
        >
          <DuplicateConventionAlert
            similarConventionIds={similarConventionIds}
          />
          <ButtonsGroup
            className={fr.cx("fr-mt-4w")}
            inlineLayoutWhen="sm and up"
            alignment="center"
            buttons={[
              {
                children: "Annuler",
                onClick: closeConfirmDuplicateConventionModal,
                priority: "secondary",
              },
              {
                children: "Valider (au risque de créer un doublon)",
                onClick: onConfirmSubmit,
                nativeButtonProps: {
                  disabled: isLoading,
                },
              },
            ]}
          />
        </ConfirmDuplicateConventionModal>,
        document.body,
      )}
    </section>
  );
};

const DuplicateConventionAlert = (props: {
  similarConventionIds: ConventionId[];
}) => (
  <Alert
    severity={"warning"}
    title={"Attention ! Possible convention en doublon."}
    description={
      <div>
        {props.similarConventionIds.length === 1
          ? "Une convention a déjà été initiée avec des informations similaires. Voici son identifiant :"
          : "Des conventions ont déjà été initiées avec des informations similaires. Voici leurs identifiants :"}
        <ul>
          {props.similarConventionIds.map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      </div>
    }
  />
);

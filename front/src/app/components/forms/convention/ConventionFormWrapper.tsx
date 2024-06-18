import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import React, { useEffect } from "react";
import { Loader, SubmitConfirmationSection } from "react-design-system";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import {
  ConventionId,
  ConventionJwtPayload,
  InternshipKind,
  decodeMagicLinkJwtWithoutSignatureCheck,
  domElementIds,
} from "shared";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import { type ConventionCustomAgencyPageRoute } from "src/app/pages/convention/ConventionCustomAgencyPage";
import { type ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import { type ConventionMiniStagePageRoute } from "src/app/pages/convention/ConventionMiniStagePage";
import { type ConventionImmersionForExternalsRoute } from "src/app/pages/convention/ConventionPageForExternals";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import { routes, useRoute } from "src/app/routes/routes";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { match } from "ts-pattern";
import { Route } from "type-route";
import { ConventionSummary } from "./ConventionSummary";

const {
  Component: ConfirmDuplicateConventionModal,
  open: openConfirmDuplicateConventionModal,
  close: closeConfirmDuplicateConventionModal,
} = createModal({
  id: "confirm-duplicate-convention-modal",
  isOpenedByDefault: false,
});

export type ConventionFormMode = "create" | "edit";

type ConventionFormWrapperProps = {
  internshipKind: InternshipKind;
  mode: ConventionFormMode;
};

export type SupportedConventionRoutes =
  | ConventionImmersionPageRoute
  | ConventionMiniStagePageRoute
  | ConventionCustomAgencyPageRoute
  | ConventionImmersionForExternalsRoute;

export const ConventionFormWrapper = ({
  internshipKind,
  mode,
}: ConventionFormWrapperProps) => {
  const showSummary = useAppSelector(conventionSelectors.showSummary);
  const route = useRoute() as SupportedConventionRoutes;
  const fetchedConvention = useAppSelector(conventionSelectors.convention);
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const fetchConventionError = useAppSelector(conventionSelectors.fetchError);
  const dispatch = useDispatch();

  const formSuccessfullySubmitted = submitFeedback.kind === "justSubmitted";

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

  const { copyButtonIsDisabled, copyButtonLabel, onCopyButtonClick } =
    useCopyButton();

  return (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      {match({
        showSummary,
        formSuccessfullySubmitted,
        shouldRedirectToError: !!(route.params.jwt && fetchConventionError),
        conventionCantBeEdited:
          mode === "edit" &&
          route.params.jwt &&
          fetchedConvention &&
          fetchedConvention?.status !== "DRAFT",
      })
        .with(
          {
            formSuccessfullySubmitted: false,
          },
          ({ showSummary }) =>
            showSummary ? (
              <ConventionSummarySection />
            ) : (
              <ConventionForm internshipKind={internshipKind} mode={mode} />
            ),
        )
        .with(
          { formSuccessfullySubmitted: true },
          () =>
            fetchedConvention && (
              <SubmitConfirmationSection
                idToCopy={fetchedConvention.id}
                copyButtonIsDisabled={copyButtonIsDisabled}
                copyButtonLabel={copyButtonLabel}
                onCopyButtonClick={onCopyButtonClick}
              />
            ),
        )
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
        convention: {
          ...convention,
          status: "READY_TO_SIGN",
        },
        discussionId: undefined, // TODO, handle discussionId, if provided in params for example
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

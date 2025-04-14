import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useEffect } from "react";
import { ConventionSummary, Loader } from "react-design-system";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import {
  type ConventionId,
  type ConventionJwtPayload,
  type ExcludeFromExisting,
  type InternshipKind,
  decodeMagicLinkJwtWithoutSignatureCheck,
  domElementIds,
  toDisplayedDate,
} from "shared";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { makeConventionSections } from "src/app/contents/convention/conventionSummary.helpers";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import type { ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import type { ConventionMiniStagePageRoute } from "src/app/pages/convention/ConventionMiniStagePage";
import type { ConventionImmersionForExternalsRoute } from "src/app/pages/convention/ConventionPageForExternals";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import { routes, useRoute } from "src/app/routes/routes";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { match } from "ts-pattern";
import type { Route } from "type-route";

const {
  Component: ConfirmDuplicateConventionModal,
  open: openConfirmDuplicateConventionModal,
  close: closeConfirmDuplicateConventionModal,
} = createModal({
  id: "confirm-duplicate-convention-modal",
  isOpenedByDefault: false,
});

export const creationFormModes = [
  "create-from-scratch",
  "create-from-shared",
] as const;
const allConventionFormModes = [...creationFormModes, "edit"] as const;
export type ConventionFormMode = (typeof allConventionFormModes)[number];

type ConventionFormWrapperProps = {
  internshipKind: InternshipKind;
  mode: ConventionFormMode;
};

export type SupportedConventionRoutes =
  | ConventionImmersionPageRoute
  | ConventionMiniStagePageRoute
  | ConventionImmersionForExternalsRoute;

export const ConventionFormWrapper = ({
  internshipKind,
  mode,
}: ConventionFormWrapperProps) => {
  const showSummary = useAppSelector(conventionSelectors.showSummary);
  const route = useRoute() as SupportedConventionRoutes;
  const fetchedConvention = useAppSelector(conventionSelectors.convention);
  const dispatch = useDispatch();
  const conventionFormFeedback = useFeedbackTopic("convention-form");
  const fetchConventionError =
    conventionFormFeedback?.level === "error" &&
    conventionFormFeedback.on === "fetch";
  const formSuccessfullySubmitted =
    conventionFormFeedback?.level === "success" &&
    conventionFormFeedback.on === "create";

  useScrollToTop(formSuccessfullySubmitted);

  useEffect(() => {
    if (
      creationFormModes.includes(
        mode as ExcludeFromExisting<ConventionFormMode, "edit">,
      )
    ) {
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
          feedbackTopic: "unused",
        }),
      );
    }

    return () => {
      dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    };
  }, [dispatch, mode, route.params.jwt]);

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
            conventionCantBeEdited: true,
            formSuccessfullySubmitted: false,
            shouldRedirectToError: false,
          },
          () => (
            <Alert
              severity="error"
              title="Cette convention ne peut plus être modifiée"
              description="Cette convention ne peut plus être modifiée car elle a déjà été signée, validée ou refusée."
              className={fr.cx("fr-mb-4w")}
            />
          ),
        )
        .with(
          {
            formSuccessfullySubmitted: false,
            shouldRedirectToError: false,
          },
          ({ showSummary }) =>
            showSummary ? (
              <ConventionSummarySection />
            ) : (
              <ConventionForm internshipKind={internshipKind} mode={mode} />
            ),
        )
        .with(
          {
            formSuccessfullySubmitted: true,
            shouldRedirectToError: false,
          },
          () => {
            fetchedConvention &&
              routes
                .conventionConfirmation({
                  conventionId: fetchedConvention.id,
                })
                .push();
            return null;
          },
        )
        .with({ shouldRedirectToError: true }, () => (
          <>
            {route.params.jwt && fetchConventionError && (
              <ShowErrorOrRedirectToRenewMagicLink
                errorMessage={conventionFormFeedback?.message}
                jwt={route.params.jwt}
              />
            )}
          </>
        ))

        .exhaustive()}
    </div>
  );
};

const ConventionSummarySection = () => {
  const dispatch = useDispatch();
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const convention = useAppSelector(conventionSelectors.convention);
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
        feedbackTopic: "convention-form",
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
        discussionId: route.params.discussionId,
        feedbackTopic: "convention-form",
      }),
    );
  };
  console.log("convention", convention);
  return (
    <article>
      {
        //TODO il y a déjà un LOADER dans le composant parent. Nécéssaire?
        isLoading && <Loader />
      }
      {convention && (
        <ConventionSummary
          submittedAt={toDisplayedDate({
            date: new Date(convention.dateSubmission),
          })}
          summary={makeConventionSections(convention)}
        />
      )}
      {convention?.internshipKind === "mini-stage-cci" && (
        <Alert
          severity={"info"}
          title="Validation"
          description="Attention ! Vérifiez que tous les éléments sont bien intégrés et exacts. En cas de demande de modification après validation, tous les signataires devront signer à nouveau la convention."
          small
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
                onClick: () => {
                  onConfirmSubmit();
                  closeConfirmDuplicateConventionModal();
                },
                nativeButtonProps: {
                  disabled: isLoading,
                },
              },
            ]}
          />
        </ConfirmDuplicateConventionModal>,
        document.body,
      )}
    </article>
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

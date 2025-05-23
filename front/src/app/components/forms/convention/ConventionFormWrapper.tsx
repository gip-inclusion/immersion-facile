import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { intersection } from "ramda";
import { useEffect, useState } from "react";
import { ConventionSummary, Loader } from "react-design-system";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type ConventionId,
  type ConventionJwtPayload,
  type InternshipKind,
  type Role,
  agencyModifierRoles,
  conventionStatusesAllowedForModification,
  decodeMagicLinkJwtWithoutSignatureCheck,
  domElementIds,
  errors,
  hasAllowedRolesToEditConvention,
  isSignatory,
  toDisplayedDate,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { SignButton } from "src/app/components/forms/convention/SignButton";
import {
  type WithStatusJustification,
  statusJustificationSchema,
} from "src/app/components/forms/convention/conventionHelpers";
import { makeConventionSections } from "src/app/contents/convention/conventionSummary.helpers";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useScrollToTop } from "src/app/hooks/window.hooks";
import type { ConventionImmersionPageRoute } from "src/app/pages/convention/ConventionImmersionPage";
import type { ConventionMiniStagePageRoute } from "src/app/pages/convention/ConventionMiniStagePage";
import type { ConventionImmersionForExternalsRoute } from "src/app/pages/convention/ConventionPageForExternals";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import { routes, useRoute } from "src/app/routes/routes";
import { commonIllustrations } from "src/assets/img/illustrations";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { P, match } from "ts-pattern";
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
  const conventionActionEditFeedback = useFeedbackTopic(
    "convention-action-edit",
  );
  const inclusionConnectedRoles = useAppSelector(
    inclusionConnectedSelectors.userRolesForFetchedConvention,
  );
  const conventionIsLoading = useAppSelector(conventionSelectors.isLoading);
  const currentUserIsLoading = useAppSelector(
    inclusionConnectedSelectors.isLoading,
  );
  const isLoading = conventionIsLoading || currentUserIsLoading;
  const fetchConventionError =
    conventionFormFeedback?.level === "error" &&
    conventionFormFeedback.on === "fetch";

  // const formSuccessfullySubmitted =
  //   conventionFormFeedback?.level === "success" &&
  //   (conventionFormFeedback.on === "create" ||
  //     conventionFormFeedback.on === "update");

  const formSuccessfullySubmitted =
    (conventionFormFeedback?.level === "success" &&
      (conventionFormFeedback.on === "create" ||
        conventionFormFeedback.on === "update")) ||
    (conventionActionEditFeedback?.level === "success" &&
      conventionActionEditFeedback.on === "update");

  const hasConventionUpdateConflict =
    (conventionFormFeedback?.level === "error" &&
      conventionFormFeedback.on === "update" &&
      conventionFormFeedback.message ===
        errors.convention.conventionGotUpdatedWhileUpdating().message) ||
    (conventionActionEditFeedback?.level === "error" &&
      conventionActionEditFeedback.on === "update" &&
      conventionActionEditFeedback.message ===
        errors.convention.conventionGotUpdatedWhileUpdating().message);

  const [userRolesOnConvention, setUserRolesOnConvention] = useState<Role[]>(
    inclusionConnectedRoles,
  );

  useScrollToTop(formSuccessfullySubmitted);

  useEffect(() => {
    if (mode === "edit" && route.params.jwt) {
      dispatch(conventionSlice.actions.jwtProvided(route.params.jwt));
      const { applicationId } =
        decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
          route.params.jwt,
        );

      const conventionIdInRouteParams =
        "conventionId" in route.params ? route.params.conventionId : undefined;

      const conventionId = applicationId ?? conventionIdInRouteParams;

      dispatch(
        conventionSlice.actions.fetchConventionRequested({
          jwt: route.params.jwt,
          conventionId,
          feedbackTopic: "unused",
        }),
      );
    }
  }, [dispatch, mode, route.params]);

  useEffect(() => {
    if (route.params.jwt) {
      const { role: roleFromJwt } =
        decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
          route.params.jwt,
        );

      const roles: Role[] = roleFromJwt
        ? [roleFromJwt]
        : inclusionConnectedRoles;
      setUserRolesOnConvention(roles);
      const signatoryRole = roles.find((role) => isSignatory(role));

      if (signatoryRole) {
        dispatch(
          conventionSlice.actions.currentSignatoryRoleChanged(signatoryRole),
        );
      }
    }
  }, [dispatch, route.params.jwt, inclusionConnectedRoles]);

  useEffect(() => {
    dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    return () => {
      dispatch(conventionSlice.actions.clearFetchedConvention());
      dispatch(
        conventionSlice.actions.showSummaryChangeRequested({
          showSummary: false,
        }),
      );
    };
  }, [dispatch]);

  const routeToRedirectTo = getRouteToRedirectAfterSubmit({
    mode,
    userRolesOnConvention,
    route,
    fetchedConvention,
  });

  return (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      {match({
        showSummary,
        formSuccessfullySubmitted,
        isUpdateMode: mode === "edit",
        shouldRedirectToError: !!(route.params.jwt && fetchConventionError),
        hasAllowedRoleToEditConvention:
          mode === "edit" &&
          route.params.jwt &&
          fetchedConvention &&
          hasAllowedRolesToEditConvention(userRolesOnConvention),
        conventionCantBeEdited:
          mode === "edit" &&
          route.params.jwt &&
          fetchedConvention &&
          !conventionStatusesAllowedForModification.includes(
            fetchedConvention?.status,
          ),
        isLoading,
        fetchedConvention,
        hasConventionUpdateConflict,
      })
        .with({ isLoading: true }, () => <Loader />)
        .with({ hasConventionUpdateConflict: true }, () => (
          <section className={fr.cx("fr-col-12")}>
            <Alert
              severity="error"
              title="Attention ! Vos modifications n'ont pas été prises en compte"
              description={
                errors.convention.conventionGotUpdatedWhileUpdating().message
              }
            />
            {routeToRedirectTo && (
              <Button
                linkProps={routeToRedirectTo.link}
                className={fr.cx("fr-mt-4w")}
              >
                Retourner sur la convention
              </Button>
            )}
          </section>
        ))
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
              description="Cette convention ne peut plus être modifiée car elle a déjà été validée, annulée ou refusée."
              className={fr.cx("fr-mb-4w")}
            />
          ),
        )
        .with(
          {
            conventionCantBeEdited: false,
            formSuccessfullySubmitted: false,
            shouldRedirectToError: false,
            hasAllowedRoleToEditConvention: false,
            isUpdateMode: true,
          },
          () => (
            <Alert
              severity="error"
              title="Vous n'avez pas les droits pour modifier cette convention."
              description="Seul les signataires ainsi que les conseillers liés a cette convention peuvent la modifier."
              className={fr.cx("fr-mb-4w")}
            />
          ),
        )
        .with(
          {
            formSuccessfullySubmitted: false,
            shouldRedirectToError: false,
          },
          ({ showSummary, fetchedConvention }) =>
            showSummary && fetchedConvention ? (
              <ConventionSummarySection
                mode={mode}
                internshipKind={internshipKind}
                userRolesOnConvention={userRolesOnConvention}
                conventionId={fetchedConvention.id}
              />
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
            if (!fetchedConvention) return null;

            if (
              mode === "create-from-scratch" ||
              mode === "create-from-shared"
            ) {
              routes
                .conventionConfirmation({
                  conventionId: fetchedConvention.id,
                })
                .push();
            }

            if (routeToRedirectTo) routeToRedirectTo.push();
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

const ConventionSummarySection = ({
  mode,
  internshipKind,
  conventionId,
}: {
  mode: ConventionFormMode;
  internshipKind: InternshipKind;
  userRolesOnConvention: Role[];
  conventionId: ConventionId;
}) => {
  const dispatch = useDispatch();
  const isLoading = useAppSelector(conventionSelectors.isLoading);
  const convention = useAppSelector(conventionSelectors.convention);
  const similarConventionIds = useAppSelector(
    conventionSelectors.similarConventionIds,
  );
  const conventionFormFeedback = useFeedbackTopic("convention-form");
  const conventionActionEditFeedback = useFeedbackTopic(
    "convention-action-edit",
  );

  // const conventionSuccessfullySubmitted =
  //   conventionFormFeedback?.level === "success" &&
  //   (conventionFormFeedback.on === "create" ||
  //     conventionFormFeedback.on === "update");

  const conventionSuccessfullySubmitted =
    (conventionFormFeedback?.level === "success" &&
      (conventionFormFeedback.on === "create" ||
        conventionFormFeedback.on === "update")) ||
    (conventionActionEditFeedback?.level === "success" &&
      conventionActionEditFeedback.on === "update");

  const { signatory: currentSignatory } = useAppSelector(
    conventionSelectors.signatoryData,
  );
  const [isModalClosedWithoutSignature, setIsModalClosedWithoutSignature] =
    useState<boolean>(false);
  const route = useRoute() as Route<typeof routes.conventionImmersion>;

  const isEditingConvention = !!route.params.jwt;
  const shouldShowDuplicateWarning =
    !isEditingConvention && similarConventionIds.length > 0;

  const t = useConventionTexts(internshipKind);

  if (!convention) {
    throw errors.convention.notFound({ conventionId });
  }
  const isMagicLinkUser =
    route.params.jwt &&
    "applicationId" in
      decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
        route.params.jwt,
      );

  const { register, handleSubmit, formState, getValues, trigger } =
    useForm<WithStatusJustification>({
      mode: "onTouched",
      defaultValues: { statusJustification: "" },
      resolver: zodResolver(statusJustificationSchema),
    });
  const getFieldError = makeFieldError(formState);

  const onConfirmSubmit = () => {
    dispatch(
      conventionSlice.actions.saveConventionRequested({
        convention: {
          ...convention,
          statusJustification: getValues("statusJustification"),
          status: "READY_TO_SIGN",
        },
        discussionId: route.params.discussionId,
        feedbackTopic: isMagicLinkUser
          ? "convention-form"
          : "convention-action-edit",
      }),
    );
  };

  return (
    <article>
      <p className={fr.cx("fr-m-0", "fr-mb-2w")}>
        {t.intro.conventionSummaryDescription}
      </p>
      <ConventionSummary
        illustration={commonIllustrations.documentsAdministratifs}
        submittedAt={toDisplayedDate({
          date: new Date(convention.dateSubmission),
        })}
        summary={makeConventionSections(convention)}
      />

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
      {isModalClosedWithoutSignature && (
        <Alert
          {...t.conventionNeedToBeSign}
          closable={true}
          severity="warning"
          small
          className={fr.cx("fr-mb-5w")}
        />
      )}

      {mode === "edit" ? (
        <>
          {!conventionSuccessfullySubmitted && (
            <Feedback
              topics={["convention-form", "convention-action-edit"]}
              className={fr.cx("fr-mb-2w")}
              closable
            />
          )}
          <form>
            <Input
              textArea
              label="Expliquer les modifications"
              hintText="Votre message sera envoyé aux autres signataires"
              nativeTextAreaProps={{
                ...register("statusJustification"),
                id: domElementIds.conventionImmersionRoute
                  .statusJustificationInput,
              }}
              {...getFieldError("statusJustification")}
            />

            <Button
              disabled={isLoading}
              className={fr.cx("fr-m-1w")}
              iconId="fr-icon-arrow-go-back-line"
              iconPosition="left"
              id={domElementIds.conventionImmersionRoute.summaryEditButton}
              priority="secondary"
              onClick={() => {
                dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
                dispatch(
                  conventionSlice.actions.showSummaryChangeRequested({
                    showSummary: false,
                  }),
                );
              }}
            >
              Retourner à la modification
            </Button>

            {currentSignatory ? (
              <SignButton
                className={fr.cx("fr-m-1w")}
                disabled={isLoading}
                id={domElementIds.conventionToSign.openSignModalButton}
                submitButtonId={domElementIds.conventionToSign.submitButton}
                signatory={currentSignatory}
                internshipKind={convention?.internshipKind}
                onConfirmClick={handleSubmit(onConfirmSubmit)}
                onOpenSignModal={() => trigger("statusJustification")}
                onCloseSignModalWithoutSignature={
                  setIsModalClosedWithoutSignature
                }
              />
            ) : (
              <Button
                className={fr.cx("fr-m-1w")}
                priority="primary"
                onClick={handleSubmit(onConfirmSubmit)}
                nativeButtonProps={{
                  id: domElementIds.conventionImmersionRoute
                    .confirmSubmitFormButton,
                  disabled: isLoading,
                }}
              >
                Envoyer la convention
              </Button>
            )}
          </form>
        </>
      ) : (
        <>
          <ButtonsGroup
            className={fr.cx("fr-mt-4w")}
            inlineLayoutWhen="sm and up"
            alignment="center"
            buttons={[
              {
                children: "Retourner à la modification",
                onClick: () => {
                  dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
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
        </>
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

const getRouteToRedirectAfterSubmit = ({
  mode,
  userRolesOnConvention,
  route,
  fetchedConvention,
}: {
  mode: ConventionFormMode;
  userRolesOnConvention: Role[];
  route: SupportedConventionRoutes;
  fetchedConvention: { id: string } | null;
}) => {
  return match({
    mode,
    userRolesOnConvention,
    route,
    fetchedConvention,
  })
    .with({ fetchedConvention: null }, () => undefined)
    .with(
      {
        mode: "edit",
        userRolesOnConvention: P.when((roles) =>
          roles.some((role) => isSignatory(role)),
        ),
        route: {
          params: {
            jwt: P.string,
          },
        },
        fetchedConvention: { id: P.string },
      },
      ({ route, fetchedConvention }) => {
        const { applicationId } =
          decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
            route.params.jwt,
          );

        if (applicationId) {
          return routes.conventionToSign({ jwt: route.params.jwt });
        }
        return routes.manageConventionConnectedUser({
          conventionId: fetchedConvention.id,
        });
      },
    )
    .with(
      {
        mode: "edit",
        userRolesOnConvention: P.when((roles) => roles.includes("back-office")),
        fetchedConvention: { id: P.string },
      },
      ({ fetchedConvention }) =>
        routes.adminConventionDetail({
          conventionId: fetchedConvention.id,
        }),
    )
    .with(
      {
        mode: "edit",
        userRolesOnConvention: P.when(
          (roles) => intersection(roles, agencyModifierRoles).length > 0,
        ),
        route: {
          params: {
            jwt: P.string,
          },
        },
        fetchedConvention: { id: P.string },
      },
      ({ route, fetchedConvention }) => {
        const { applicationId } =
          decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
            route.params.jwt,
          );
        if (applicationId) {
          return routes.manageConvention({ jwt: route.params.jwt });
        }
        return routes.manageConventionConnectedUser({
          conventionId: fetchedConvention.id,
        });
      },
    )
    .otherwise(() => undefined);
};

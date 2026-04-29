import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";

import DOMPurify from "dompurify";
import { useEffect } from "react";
import {
  ButtonWithSubMenu,
  DiscussionMeta,
  ExchangeMessage,
  Loader,
} from "react-design-system";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type AbsoluteUrl,
  absoluteUrlSchema,
  addressDtoToString,
  type ConnectedUser,
  type ConventionDraftDto,
  type CreateConventionPresentationInitialValues,
  createOpaqueEmail,
  type DiscussionId,
  type DiscussionReadDto,
  domElementIds,
  type ExchangeFromDashboard,
  type ExchangeRole,
  emailExchangeSplitters,
  escapeHtml,
  exchangeMessageFromDashboardSchema,
  getFormattedFirstnameAndLastname,
  splitTextOnFirstSeparator,
  toConventionDraftDto,
  toDisplayedDate,
  type WithDiscussionId,
} from "shared";
import {
  AcceptDiscussionModal,
  openAcceptDiscussionModal,
} from "src/app/components/admin/establishments/AcceptDiscussionModal";
import {
  openRejectDiscussionModal,
  RejectDiscussionModal,
} from "src/app/components/admin/establishments/RejectDiscussionModal";
import { DiscussionStatusBadge } from "src/app/components/establishment/establishment-dashboard/DiscussionStatusBadge";
import { useDiscussion } from "src/app/hooks/discussion.hooks";
import { useFeedbackEventCallback } from "src/app/hooks/feedback.hooks";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { makeEmptyConventionInitialValues } from "src/app/routes/routeParams/convention";
import { routes } from "src/app/routes/routes";
import {
  addLineBreakOnNewLines,
  convertHtmlToText,
} from "src/app/utils/html.utils";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { conventionDraftSelectors } from "src/core-logic/domain/convention/convention-draft/conventionDraft.selectors";
import { conventionDraftSlice } from "src/core-logic/domain/convention/convention-draft/conventionDraft.slice";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import { match, P } from "ts-pattern";
import { Feedback } from "../../feedback/Feedback";
import { WithFeedbackReplacer } from "../../feedback/WithFeedbackReplacer";

type DiscussionManageContentProps = WithDiscussionId & {
  viewer: ExchangeRole;
};

export const DiscussionManageContent = ({
  discussionId,
  viewer,
}: DiscussionManageContentProps): JSX.Element => {
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const { discussion, isLoading } = useDiscussion(
    discussionId,
    connectedUserJwt,
  );
  const dispatch = useDispatch();
  const showDiscussion = !isLoading && discussion && currentUser;

  useFeedbackEventCallback(
    "dashboard-discussion-status-updated",
    "update.success",
    () => {
      if (connectedUserJwt) {
        dispatch(
          discussionSlice.actions.fetchDiscussionRequested({
            discussionId,
            feedbackTopic: "dashboard-discussion",
            jwt: connectedUserJwt,
          }),
        );
      }
    },
  );

  useEffect(() => {
    if (discussion) {
      dispatch(
        searchSlice.actions.fetchSearchResultRequested({
          searchResult: {
            siret: discussion.siret,
            appellationCode: discussion.appellation.appellationCode,
            locationId: discussion.locationId,
          },
          feedbackTopic: "unused",
        }),
      );
    }
  }, [discussion, dispatch]);

  useEffect(
    () => () => {
      dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    },
    [dispatch],
  );

  return (
    <>
      {isLoading && <Loader />}
      <WithFeedbackReplacer topic="dashboard-discussion" level="error">
        {showDiscussion && (
          <DiscussionDetails
            discussion={discussion}
            connectedUser={currentUser}
            viewer={viewer}
          />
        )}
      </WithFeedbackReplacer>
    </>
  );
};

type DiscussionDetailsProps = {
  discussion: DiscussionReadDto;
  connectedUser: ConnectedUser;
  viewer: ExchangeRole;
};
type ActivateConventionDraftButtonProps = Pick<
  DiscussionDetailsProps,
  "discussion" | "connectedUser"
>;

type ButtonPropsWithId = ButtonProps & { id: string };

const getActivateDraftConventionButtonProps = ({
  discussion,
  connectedUser,
  saveConventionDraftThenRedirectRequested,
  saveConventionDraftIsLoading,
}: ActivateConventionDraftButtonProps & {
  saveConventionDraftThenRedirectRequested: ({
    conventionDraft,
    redirectUrl,
  }: {
    conventionDraft: ConventionDraftDto;
    redirectUrl: AbsoluteUrl;
  }) => void;
  saveConventionDraftIsLoading: boolean;
}): ButtonProps => {
  const internshipKind =
    discussion.kind === "IF" ? "immersion" : "mini-stage-cci";
  const conventionDraft = toConventionDraftDto({
    convention: makeConventionFromDiscussion({
      initialConvention: makeEmptyConventionInitialValues({
        internshipKind,
      }),
      discussion,
      connectedUser,
    }),
  });

  const redirectPath =
    internshipKind === "immersion"
      ? routes.conventionImmersion({
          skipIntro: true,
          conventionDraftId: conventionDraft.id,
          discussionId: discussion.id,
          mtm_campaign: "mise_en_relation_activation_convention",
        }).href
      : routes.conventionMiniStage({
          // TODO add discussionId as quaryPram for mini-stage. Do we need acquisitionParams ?
          conventionDraftId: conventionDraft.id,
        }).href;

  return {
    id: domElementIds.establishmentDashboard.discussion.activateDraftConvention,
    priority: "tertiary",
    onClick: () => {
      saveConventionDraftThenRedirectRequested({
        conventionDraft,
        redirectUrl: absoluteUrlSchema.parse(
          `${window.location.origin}${redirectPath}`,
        ),
      });
    },
    children: "Pré-remplir la convention pour cette mise en relation",
    disabled: saveConventionDraftIsLoading,
  } satisfies ButtonProps;
};

const getDiscussionButtons = ({
  discussion,
  connectedUser,
  makeInitiateConventionDraftButtonProps,
}: {
  discussion: DiscussionReadDto;
  connectedUser: ConnectedUser;
  makeInitiateConventionDraftButtonProps: (
    props: ActivateConventionDraftButtonProps,
  ) => ButtonProps;
}): [ButtonPropsWithId, ...ButtonPropsWithId[]] => {
  return [
    ...(discussion.status === "PENDING" && discussion.kind === "IF"
      ? [makeInitiateConventionDraftButtonProps({ discussion, connectedUser })]
      : []),
    ...(discussion.status === "PENDING"
      ? [
          {
            id: domElementIds.establishmentDashboard.discussion
              .acceptDiscussionOpenModalButton,
            priority: "secondary",
            type: "button",
            onClick: openAcceptDiscussionModal,
            children: "Marquer comme acceptée",
          } satisfies ButtonProps,
          {
            id: domElementIds.establishmentDashboard.discussion
              .rejectDiscussionOpenModalButton,
            priority: "secondary",
            type: "button",
            onClick: openRejectDiscussionModal,
            children: "Marquer comme refusée",
          } satisfies ButtonProps,
        ]
      : []),
    {
      id: domElementIds.establishmentDashboard.discussion
        .replyToCandidateByEmail,
      priority: "primary",
      linkProps: {
        style: { backgroundImage: "none" }, // this is to avoid the underline in the list
        href: `mailto:${createOpaqueEmail({
          discussionId: discussion.id,
          recipient: {
            kind: "potentialBeneficiary",
            firstname: discussion.potentialBeneficiary.firstName,
            lastname: discussion.potentialBeneficiary.lastName,
          },
          replyDomain: `reply.${window.location.hostname}`,
        })}?subject=${encodeURI(
          connectedUser.firstName && connectedUser.lastName
            ? `Réponse de ${connectedUser.firstName} ${connectedUser.lastName} - Immersion potentielle chez ${discussion.businessName} en tant que ${discussion.appellation.appellationLabel}`
            : `Réponse de l'entreprise ${discussion.businessName} - Immersion potentielle en tant que ${discussion.appellation.appellationLabel}`,
        )}`,
      },
      children: "Répondre au candidat par email",
    } satisfies ButtonProps,
  ] as unknown as [ButtonPropsWithId, ...ButtonPropsWithId[]];
};

const getDiscussionStatusUpdatedFeedbackMessage = (
  discussion: DiscussionReadDto,
): string => {
  return match(discussion)
    .with({ status: "PENDING" }, () => "")
    .with(
      { status: "ACCEPTED" },
      () =>
        "La candidature a bien été marquée comme acceptée. Merci pour votre retour.",
    )
    .with(
      {
        status: "REJECTED",
        rejectionKind: "CANDIDATE_ALREADY_WARNED",
      },
      () =>
        "Candidature marquée comme refusée. Merci d’avoir indiqué que le candidat a bien été informé.",
    )
    .with(
      {
        status: "REJECTED",
        rejectionKind: P.union("UNABLE_TO_HELP", "NO_TIME", "OTHER"),
      },
      () =>
        "Candidature refusée, le message a bien été envoyé au candidat. Merci pour votre retour.",
    )
    .with(
      {
        status: "REJECTED",
        rejectionKind: "DEPRECATED",
      },
      () =>
        "Candidature automatiquement refusée par manque de réponse de votre part dans un délai de 3 mois.",
    )
    .exhaustive();
};

const DiscussionDetails = (props: DiscussionDetailsProps): JSX.Element => {
  const dispatch = useDispatch();
  const { discussion, viewer } = props;
  const saveConventionDraftIsLoading = useAppSelector(
    conventionDraftSelectors.isLoading,
  );
  const relatedOffer = useAppSelector(searchSelectors.currentSearchResult);
  const saveConventionDraftThenRedirectRequested = ({
    conventionDraft,
    redirectUrl,
  }: {
    conventionDraft: ConventionDraftDto;
    redirectUrl: AbsoluteUrl;
  }) =>
    dispatch(
      conventionDraftSlice.actions.saveConventionDraftThenRedirectRequested({
        conventionDraft,
        redirectUrl,
        feedbackTopic: "convention-draft",
      }),
    );
  return (
    <>
      <Feedback
        topics={["dashboard-discussion-status-updated"]}
        render={({ title, level, message }) => (
          <Alert
            title={title}
            description={
              level === "error"
                ? message
                : getDiscussionStatusUpdatedFeedbackMessage(discussion)
            }
            severity={level}
            small
          />
        )}
      />
      <header>
        <Button
          type="button"
          onClick={() =>
            viewer === "establishment"
              ? routes.establishmentDashboardDiscussions().push()
              : routes.beneficiaryDashboardDiscussions().push()
          }
          priority="tertiary"
          iconId="fr-icon-arrow-left-line"
          iconPosition="left"
          className={fr.cx("fr-my-2w")}
        >
          Retour
        </Button>
        <div
          className={fr.cx("fr-grid-row", "fr-grid-row--middle", "fr-mb-2w")}
        >
          <div className={fr.cx("fr-col-12", "fr-col-lg")}>
            <h1>
              Discussion avec{" "}
              {viewer === "establishment"
                ? getFormattedFirstnameAndLastname({
                    firstname: discussion.potentialBeneficiary.firstName,
                    lastname: discussion.potentialBeneficiary.lastName,
                  })
                : discussion.businessName}
            </h1>
          </div>
          {(discussion.status === "ACCEPTED" &&
            discussion.candidateWarnedMethod !== null &&
            discussion.conventionId === undefined) ||
            (viewer === "potentialBeneficiary" && (
              <Button
                {...getActivateDraftConventionButtonProps({
                  ...props,
                  saveConventionDraftThenRedirectRequested,
                  saveConventionDraftIsLoading,
                })}
                priority="primary"
              >
                Pré-remplir la convention
              </Button>
            ))}
          {discussion.status === "PENDING" && viewer === "establishment" && (
            <ButtonWithSubMenu
              priority="primary"
              id={
                domElementIds.establishmentDashboard.discussion
                  .handleDiscussionButton
              }
              buttonLabel={"Gérer la candidature"}
              buttonIconId="fr-icon-arrow-down-s-line"
              iconPosition="right"
              navItems={getDiscussionButtons({
                ...props,
                makeInitiateConventionDraftButtonProps: (discussionProps) =>
                  getActivateDraftConventionButtonProps({
                    ...discussionProps,
                    saveConventionDraftThenRedirectRequested,
                    saveConventionDraftIsLoading,
                  }),
              })}
              className={fr.cx("fr-ml-md-auto")}
            />
          )}
        </div>
        <DiscussionMeta>
          <DiscussionStatusBadge discussion={discussion} viewer={viewer} />
          {discussion.potentialBeneficiary.immersionObjective}
          {discussion.appellation.appellationLabel}
          {discussion.kind === "IF" &&
            discussion.potentialBeneficiary.resumeLink &&
            viewer === "establishment" && (
              <a
                href={discussion.potentialBeneficiary.resumeLink}
                title={"CV du candidat"}
                target="_blank"
                rel="noreferrer"
              >
                CV
              </a>
            )}
          {discussion.kind === "IF" &&
            viewer === "potentialBeneficiary" &&
            relatedOffer &&
            relatedOffer.website && (
              <a
                href={relatedOffer.website}
                title={"Site web de l'entreprise"}
                target="_blank"
                rel="noreferrer"
              >
                Site web de l'entreprise
              </a>
            )}
        </DiscussionMeta>
      </header>

      <DiscussionExchangeMessageForm
        discussionId={discussion.id}
        viewer={viewer}
      />

      <DiscussionExchangesList discussion={discussion} viewer={viewer} />

      {createPortal(
        <RejectDiscussionModal discussion={discussion} />,
        document.body,
      )}

      {createPortal(
        <AcceptDiscussionModal discussion={discussion} />,
        document.body,
      )}
    </>
  );
};

const DiscussionExchangesList = ({
  discussion,
  viewer,
}: {
  discussion: DiscussionReadDto;
  viewer: ExchangeRole;
}): JSX.Element => {
  const sortedExchangesBySentAtDesc = [...discussion.exchanges].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );
  return (
    <section>
      <hr className={fr.cx("fr-hr", "fr-mt-6w")} />
      {sortedExchangesBySentAtDesc.map((exchange) => {
        const currentMessage = addLineBreakOnNewLines(
          convertHtmlToText(exchange.message),
        );
        const messageToDisplay = splitTextOnFirstSeparator(
          currentMessage,
          emailExchangeSplitters,
        );
        return (
          <ExchangeMessage
            viewer={viewer}
            sender={exchange.sender}
            key={`${exchange.sender}-${exchange.sentAt}`}
          >
            <header
              className={fr.cx(
                "fr-grid-row",
                "fr-grid-row--middle",
                "fr-mb-2w",
              )}
            >
              <div>
                <h2 className={fr.cx("fr-mb-0", "fr-mb-1v")}>
                  {exchange.sender === "establishment"
                    ? `${discussion.businessName} - ${exchange.firstname} ${exchange.lastname}`
                    : getFormattedFirstnameAndLastname({
                        firstname: discussion.potentialBeneficiary.firstName,
                        lastname: discussion.potentialBeneficiary.lastName,
                      })}
                </h2>
              </div>
              <div className={fr.cx("fr-ml-auto")}>
                <div className={fr.cx("fr-mb-2w")}>
                  <Badge
                    className={`fr-badge--${
                      exchange.sender === "establishment"
                        ? "blue-cumulus"
                        : "green-archipel"
                    }`}
                  >
                    {exchange.sender === "establishment"
                      ? "Entreprise"
                      : "Candidat"}
                  </Badge>
                </div>

                <span className={fr.cx("fr-hint-text")}>
                  {toDisplayedDate({
                    date: new Date(exchange.sentAt),
                    withHours: true,
                  })}
                </span>
              </div>
            </header>
            <hr className={fr.cx("fr-hr")} />
            <section>
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(messageToDisplay[0]),
                }}
              />
            </section>
          </ExchangeMessage>
        );
      })}
    </section>
  );
};

const makeConventionFromDiscussion = ({
  initialConvention,
  discussion,
  connectedUser,
}: {
  initialConvention: CreateConventionPresentationInitialValues;
  discussion: DiscussionReadDto;
  connectedUser: ConnectedUser;
}): CreateConventionPresentationInitialValues => ({
  ...initialConvention,
  signatories: {
    ...initialConvention.signatories,
    beneficiary: {
      ...initialConvention.signatories.beneficiary,
      firstName: discussion.potentialBeneficiary.firstName,
      lastName: discussion.potentialBeneficiary.lastName,
      email: discussion.potentialBeneficiary.email,
      phone:
        discussion.contactMode === "EMAIL"
          ? discussion.potentialBeneficiary.phone
          : "",
    },
    establishmentRepresentative: {
      ...initialConvention.signatories.establishmentRepresentative,
      firstName: connectedUser.firstName,
      lastName: connectedUser.lastName,
      email: connectedUser.email,
    },
  },
  establishmentTutor: {
    firstName: connectedUser.firstName,
    lastName: connectedUser.lastName,
    email: connectedUser.email,
    job: "",
    phone: "",
    role: "establishment-tutor",
  },
  immersionObjective:
    discussion.contactMode === "EMAIL" &&
    discussion.potentialBeneficiary.immersionObjective
      ? discussion.potentialBeneficiary.immersionObjective
      : undefined,
  siret: discussion.siret,
  businessName: discussion.businessName,
  immersionAppellation: discussion.appellation,
  immersionAddress: addressDtoToString(discussion.address),
});

const DiscussionExchangeMessageForm = ({
  discussionId,
  viewer,
}: {
  discussionId: DiscussionId;
  viewer: ExchangeRole;
}) => {
  const { register, handleSubmit, formState, watch, setValue } =
    useForm<ExchangeFromDashboard>({
      resolver: zodResolver(exchangeMessageFromDashboardSchema),
      defaultValues: {
        message: "",
      },
    });
  const getFieldError = makeFieldError(formState);
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const message = watch("message");

  const onSubmit = (data: ExchangeFromDashboard) => {
    if (connectedUserJwt) {
      dispatch(
        discussionSlice.actions.sendExchangeRequested({
          exchangeData: {
            jwt: connectedUserJwt,
            discussionId,
            message: data.message,
          },
          feedbackTopic: "beneficiary-dashboard-discussion-send-message",
        }),
      );
    }
  };

  useFeedbackEventCallback(
    "beneficiary-dashboard-discussion-send-message",
    "create.success",
    () => {
      setValue("message", "", { shouldValidate: true });
    },
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={fr.cx("fr-mb-4w")}>
      <Feedback
        topics={[
          "establishment-dashboard-discussion-send-message",
          "beneficiary-dashboard-discussion-send-message",
        ]}
        className={fr.cx("fr-mb-2w")}
        closable
      />
      <input type="hidden" {...register("discussionId")} value={discussionId} />
      <Input
        textArea
        label={
          viewer === "establishment"
            ? "Répondre au candidat"
            : "Répondre à l'entreprise"
        }
        nativeTextAreaProps={{
          id: domElementIds.establishmentDashboard.discussion.sendMessageInput,
          rows: 5,
          placeholder: "Rédigez votre message ici...",
          ...register("message", {
            setValueAs: escapeHtml,
          }),
        }}
        {...getFieldError("message")}
      />
      <div className={fr.cx("fr-mt-2w", "fr-mb-4w")}>
        <Button
          id={
            domElementIds.establishmentDashboard.discussion
              .sendMessageSubmitButton
          }
          type="submit"
          disabled={formState.isSubmitting || message.trim().length === 0}
          size="small"
        >
          Envoyer un message
        </Button>
      </div>
    </form>
  );
};

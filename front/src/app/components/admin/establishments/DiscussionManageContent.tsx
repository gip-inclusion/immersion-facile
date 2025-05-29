import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge, { type BadgeProps } from "@codegouvfr/react-dsfr/Badge";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Card } from "@codegouvfr/react-dsfr/Card";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Select, { type SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { renderContent } from "html-templates/src/components/email";
import { useEffect, useState } from "react";
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
  type DiscussionDisplayStatus,
  type DiscussionId,
  type DiscussionReadDto,
  type Email,
  type ExchangeFromDashboard,
  type RejectDiscussionAndSendNotificationParam,
  type RejectionKind,
  type WithDiscussionId,
  type WithDiscussionRejection,
  addressDtoToString,
  createOpaqueEmail,
  discussionRejectionSchema,
  domElementIds,
  escapeHtml,
  exchangeMessageFromDashboardSchema,
  getDiscussionDisplayStatus,
  rejectDiscussionEmailParams,
  toDisplayedDate,
} from "shared";
import type { ConventionPresentation } from "src/app/components/forms/convention/conventionHelpers";
import { useDiscussion } from "src/app/hooks/discussion.hooks";
import { useFeedbackEventCallback } from "src/app/hooks/feedback.hooks";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  getConventionInitialValuesFromUrl,
  makeValuesToWatchInUrl,
} from "src/app/routes/routeParams/convention";
import { routes } from "src/app/routes/routes";
import {
  addLineBreakOnNewLines,
  convertHtmlToText,
} from "src/app/utils/html.utils";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { P, match } from "ts-pattern";
import { Feedback } from "../../feedback/Feedback";

type DiscussionManageContentProps = WithDiscussionId;

const { open: openRejectApplicationModal, Component: RejectApplicationModal } =
  createModal({
    isOpenedByDefault: false,
    id: domElementIds.establishmentDashboard.discussion.rejectApplicationModal,
  });

export const DiscussionManageContent = ({
  discussionId,
}: DiscussionManageContentProps): JSX.Element => {
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const connectedUser = useAppSelector(authSelectors.connectedUser);
  const { discussion, isLoading, fetchError } = useDiscussion(
    discussionId,
    inclusionConnectedJwt,
  );
  const dispatch = useDispatch();
  useFeedbackEventCallback(
    "dashboard-discussion-rejection",
    "update.success",
    () => {
      if (inclusionConnectedJwt) {
        dispatch(
          discussionSlice.actions.fetchDiscussionRequested({
            discussionId,
            feedbackTopic: "dashboard-discussion",
            jwt: inclusionConnectedJwt,
          }),
        );
      }
    },
  );

  useEffect(
    () => () => {
      dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    },
    [dispatch],
  );

  if (isLoading) return <Loader />;
  if (fetchError) throw new Error(fetchError);

  return match(discussion)
    .with(null, () => (
      <Alert
        severity="warning"
        title={`La discussion ${discussionId} n'est pas trouvée.`}
      />
    ))
    .with(P.not(null), (discussion) =>
      connectedUser ? (
        <DiscussionDetails
          discussion={discussion}
          userEmail={connectedUser.email}
        />
      ) : (
        <Alert severity="error" title={`Vous n'êtes pas connecté.`} />
      ),
    )
    .exhaustive();
};

type DiscussionDetailsProps = {
  discussion: DiscussionReadDto;
  userEmail: string;
};

type ButtonPropsWithId = ButtonProps & { id: string };

const getDiscussionButtons = ({
  discussion,
  userEmail,
}: DiscussionDetailsProps): [ButtonPropsWithId, ...ButtonPropsWithId[]] => {
  const draftConvention = makeConventionFromDiscussion({
    initialConvention: getConventionInitialValuesFromUrl({
      route: routes.conventionImmersion(),
      internshipKind: "immersion",
    }),
    discussion,
    userEmail,
  });

  return [
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
          `Réponse de ${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - Immersion potentielle chez ${discussion.businessName} en tant que ${discussion.appellation.appellationLabel}`,
        )}`,
        target: "_blank",
      },
      children: "Répondre au candidat par email",
    } satisfies ButtonProps,
    ...(discussion.status === "PENDING" && discussion.kind === "IF"
      ? [
          {
            id: domElementIds.establishmentDashboard.discussion
              .activateDraftConvention,
            priority: "tertiary",
            linkProps: {
              style: { backgroundImage: "none" }, // this is to avoid the underline in the list
              href: makeDraftConventionLink(draftConvention, discussion.id)
                .href,
              target: "_blank",
            },
            children: "Pré-remplir la convention pour cette mise en relation",
          } satisfies ButtonProps,
        ]
      : []),
    ...(discussion.status === "PENDING"
      ? [
          {
            id: domElementIds.establishmentDashboard.discussion
              .rejectApplicationOpenModal,
            priority: "secondary",
            type: "button",
            onClick: () => openRejectApplicationModal(),
            children: "Refuser la candidature",
          } satisfies ButtonProps,
        ]
      : []),
  ];
};

const DiscussionDetails = (props: DiscussionDetailsProps): JSX.Element => {
  const { discussion } = props;
  const statusBadgeData: Record<
    DiscussionDisplayStatus,
    {
      severity: BadgeProps["severity"];
      label: string;
    }
  > = {
    new: {
      severity: "info",
      label: "Nouveau",
    },
    "needs-answer": {
      severity: "warning",
      label: "En cours - à répondre",
    },
    "needs-urgent-answer": {
      severity: "error",
      label: "En cours - Urgent",
    },
    answered: {
      severity: "new",
      label: "En cours - répondu",
    },
    accepted: {
      severity: "success",
      label: "Acceptée",
    },
    rejected: {
      severity: undefined,
      label: "Refusée",
    },
  };

  const statusBadge =
    statusBadgeData[
      getDiscussionDisplayStatus({
        discussion,
        now: new Date(),
      })
    ];

  return (
    <>
      <Feedback topics={["dashboard-discussion-rejection"]} />
      <header>
        <Button
          type="button"
          onClick={() =>
            routes
              .establishmentDashboard({
                tab: "discussions",
              })
              .push()
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
              Discussion avec {discussion.potentialBeneficiary.firstName}{" "}
              {discussion.potentialBeneficiary.lastName}
            </h1>
          </div>
          <ButtonWithSubMenu
            priority="primary"
            buttonLabel={"Gérer la candidature"}
            buttonIconId="fr-icon-arrow-down-s-line"
            iconPosition="right"
            navItems={getDiscussionButtons(props)}
            className={fr.cx("fr-ml-md-auto")}
          />
        </div>
        <DiscussionMeta>
          <p
            key="status-badge"
            id={domElementIds.establishmentDashboard.discussion.statusBadge}
            className={fr.cx(
              "fr-badge",
              statusBadge.severity && `fr-badge--${statusBadge.severity}`,
            )}
          >
            {statusBadge.label}
          </p>
          {discussion.contactMode === "EMAIL" &&
            discussion.potentialBeneficiary.immersionObjective}
          {discussion.appellation.appellationLabel}
          {discussion.contactMode === "EMAIL" &&
            discussion.kind === "IF" &&
            discussion.potentialBeneficiary.resumeLink && (
              <a
                href={discussion.potentialBeneficiary.resumeLink}
                title={"CV du candidat"}
                target="_blank"
                rel="noreferrer"
              >
                CV
              </a>
            )}
        </DiscussionMeta>
      </header>

      <DiscussionEchangeMessageForm discussionId={discussion.id} />

      <DiscussionExchangesList discussion={discussion} />

      {createPortal(
        <RejectApplicationModal title="Refuser la candidature">
          <RejectApplicationForm discussion={discussion} />
        </RejectApplicationModal>,
        document.body,
      )}
    </>
  );
};

const DiscussionExchangesList = ({
  discussion,
}: {
  discussion: DiscussionReadDto;
}): JSX.Element => {
  const sortedBySentAtDesc = [...discussion.exchanges].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );
  return (
    <section>
      <hr className={fr.cx("fr-hr", "fr-mt-6w")} />
      {sortedBySentAtDesc.map(({ sender, sentAt, subject, message }) => (
        <ExchangeMessage sender={sender} key={`${sender}-${sentAt}`}>
          <header
            className={fr.cx("fr-grid-row", "fr-grid-row--middle", "fr-mb-2w")}
          >
            <div>
              <h2 className={fr.cx("fr-mb-0", "fr-mb-1v")}>
                {sender === "establishment"
                  ? `${discussion.businessName}`
                  : `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`}
              </h2>
            </div>
            <div className={fr.cx("fr-ml-auto")}>
              <div className={fr.cx("fr-mb-2w")}>
                <Badge
                  className={`fr-badge--${
                    sender === "establishment"
                      ? "blue-cumulus"
                      : "green-archipel"
                  }`}
                >
                  {sender === "establishment" ? "Entreprise" : "Candidat"}
                </Badge>
              </div>

              <span className={fr.cx("fr-hint-text")}>
                {toDisplayedDate({
                  date: new Date(sentAt),
                  withHours: true,
                })}
              </span>
            </div>
          </header>
          <hr className={fr.cx("fr-hr")} />
          <section>
            <h3>{subject}</h3>
            <div
              dangerouslySetInnerHTML={{
                __html: addLineBreakOnNewLines(convertHtmlToText(message)),
              }}
            />
          </section>
        </ExchangeMessage>
      ))}
    </section>
  );
};

const makeDraftConventionLink = (
  convention: ConventionPresentation,
  discussionId: DiscussionId,
) =>
  routes.conventionImmersion({
    ...makeValuesToWatchInUrl(convention),
    discussionId,
    mtm_campaign: "mise_en_relation_activation_convention",
  }).link;

const makeConventionFromDiscussion = ({
  initialConvention,
  discussion,
  userEmail,
}: {
  initialConvention: ConventionPresentation;
  discussion: DiscussionReadDto;
  userEmail: Email;
}): ConventionPresentation => ({
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
      firstName: discussion.establishmentContact.firstName,
      lastName: discussion.establishmentContact.lastName,
      email: userEmail,
    },
  },
  establishmentTutor: {
    firstName: discussion.establishmentContact.firstName,
    lastName: discussion.establishmentContact.lastName,
    job: "",
    email: userEmail,
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

const RejectApplicationForm = ({
  discussion,
}: {
  discussion: DiscussionReadDto;
}): JSX.Element => {
  const { register, watch, handleSubmit, formState } =
    useForm<WithDiscussionRejection>({
      resolver: zodResolver(discussionRejectionSchema),
    });
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const getFieldError = makeFieldError(formState);
  const dispatch = useDispatch();
  const watchedFormValues = watch();
  const [rejectParams, setRejectParams] =
    useState<RejectDiscussionAndSendNotificationParam | null>(null);
  const rejectionKindOptions: SelectProps.Option<RejectionKind>[] = [
    {
      label:
        "Je ne suis pas en capacité d'aider le candidat dans son projet professionnel",
      value: "UNABLE_TO_HELP",
    },
    {
      label:
        "Je traverse une période chargée et je n'ai pas le temps d'accueillir une immersion",
      value: "NO_TIME",
    },
    {
      label: "Autre",
      value: "OTHER",
    },
  ];
  if (!inclusionConnectedJwt) throw new Error("No jwt found");
  if (rejectParams) {
    const { htmlContent, subject } = rejectDiscussionEmailParams(
      rejectParams,
      discussion,
    );
    return (
      <>
        <p>
          Voici l'email qui sera envoyé au candidat si vous rejetez sa
          candidature :
        </p>
        <Card
          title={`Sujet : ${subject}`}
          className={fr.cx("fr-mb-2w")}
          desc={
            <div
              dangerouslySetInnerHTML={{
                __html:
                  renderContent(htmlContent, { wrapInTable: false }) ?? "",
              }}
            />
          }
        />
        <ButtonsGroup
          buttons={[
            {
              id: domElementIds.establishmentDashboard.discussion
                .rejectApplicationCancelButton,
              priority: "secondary",
              children: "Annuler",
              type: "button",
              onClick: () => setRejectParams(null),
            },
            {
              id: domElementIds.establishmentDashboard.discussion
                .rejectApplicationSubmitButton,
              priority: "primary",
              children: "Rejeter la candidature et notifier le candidat",
              onClick: () =>
                dispatch(
                  discussionSlice.actions.updateDiscussionStatusRequested({
                    status: "REJECTED",
                    feedbackTopic: "dashboard-discussion-rejection",
                    ...rejectParams,
                    jwt: inclusionConnectedJwt,
                  }),
                ),
            },
          ]}
          inlineLayoutWhen="always"
        />
      </>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) =>
        setRejectParams({ ...values, discussionId: discussion.id }),
      )}
    >
      <Select
        label="Pour quel motif souhaitez-vous refuser cette candidature ?"
        nativeSelectProps={{
          id: domElementIds.establishmentDashboard.discussion
            .rejectApplicationJustificationKindInput,
          ...register("rejectionKind"),
        }}
        options={rejectionKindOptions}
        {...getFieldError("rejectionKind")}
      />
      {watchedFormValues.rejectionKind === "OTHER" && (
        <Input
          textArea
          label="Précisez"
          nativeTextAreaProps={{
            id: domElementIds.establishmentDashboard.discussion
              .rejectApplicationJustificationReasonInput,
            ...register("rejectionReason"),
          }}
          {...getFieldError("rejectionReason")}
        />
      )}
      <ButtonsGroup
        buttons={[
          {
            id: domElementIds.establishmentDashboard.discussion
              .rejectApplicationCancelButton,
            priority: "secondary",
            children: "Annuler",
            type: "button",
          },
          {
            id: domElementIds.establishmentDashboard.discussion
              .rejectApplicationSubmitPreviewButton,
            priority: "primary",
            children: "Prévisualiser et envoyer",
          },
        ]}
        inlineLayoutWhen="always"
      />
    </form>
  );
};

const DiscussionEchangeMessageForm = ({
  discussionId,
}: {
  discussionId: DiscussionId;
}) => {
  const { register, handleSubmit, formState } = useForm<ExchangeFromDashboard>({
    resolver: zodResolver(exchangeMessageFromDashboardSchema),
    defaultValues: {
      message: "",
    },
  });
  const getFieldError = makeFieldError(formState);
  const dispatch = useDispatch();
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );

  const onSubmit = (data: ExchangeFromDashboard) => {
    if (inclusionConnectedJwt) {
      dispatch(
        discussionSlice.actions.sendExchangeRequested({
          exchangeData: {
            jwt: inclusionConnectedJwt,
            discussionId,
            message: data.message,
          },
          feedbackTopic: "establishment-dashboard-discussion-send-message",
        }),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={fr.cx("fr-mb-4w")}>
      <Feedback
        topics={["establishment-dashboard-discussion-send-message"]}
        className={fr.cx("fr-mb-2w")}
        closable
      />
      <input type="hidden" {...register("discussionId")} value={discussionId} />
      <Input
        textArea
        label="Répondre au candidat"
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
          disabled={formState.isSubmitting}
          size="small"
        >
          Envoyer un message
        </Button>
      </div>
    </form>
  );
};

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Card } from "@codegouvfr/react-dsfr/Card";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Select, { type SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { renderContent } from "html-templates/src/components/email";
import { useEffect, useState } from "react";
import {
  CopyButton,
  DiscussionMeta,
  ExchangeMessage,
  Loader,
} from "react-design-system";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type DiscussionId,
  type DiscussionReadDto,
  type DiscussionVisualStatus,
  type Email,
  type RejectDiscussionAndSendNotificationParam,
  type RejectionKind,
  type WithDiscussionId,
  type WithDiscussionRejection,
  addressDtoToString,
  createOpaqueEmail,
  discussionRejectionSchema,
  domElementIds,
  getDiscussionVisualStatus,
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

const DiscussionDetails = ({
  discussion,
  userEmail,
}: { discussion: DiscussionReadDto; userEmail: Email }): JSX.Element => {
  const draftConvention = makeConventionFromDiscussion({
    initialConvention: getConventionInitialValuesFromUrl({
      route: routes.conventionImmersion(),
      internshipKind: "immersion",
    }),
    discussion,
    userEmail,
  });

  const statusBadgeData: Record<
    DiscussionVisualStatus,
    {
      severity: "new" | "info" | "error" | "warning" | "success" | undefined;
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
    statusBadgeData[getDiscussionVisualStatus({ discussion, now: new Date() })];
  const candidateContactButtons: [ButtonProps, ...ButtonProps[]] = [
    {
      id: domElementIds.establishmentDashboard.discussion
        .replyToCandidateByEmail,
      priority: "primary",
      linkProps: {
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
      children: "Répondre au candidat",
    },
  ];
  if (discussion.status === "PENDING") {
    if (discussion.kind === "IF") {
      candidateContactButtons.push({
        id: domElementIds.establishmentDashboard.discussion
          .activateDraftConvention,
        priority: "tertiary",
        linkProps: {
          href: makeDraftConventionLink(draftConvention, discussion.id).href,
          target: "_blank",
        },
        children: "Pré-remplir la convention pour cette mise en relation",
      });
    }
    candidateContactButtons.push({
      id: domElementIds.establishmentDashboard.discussion
        .rejectApplicationOpenModal,
      priority: "secondary",
      type: "button",
      onClick: () => openRejectApplicationModal(),
      children: "Refuser la candidature",
    });
  }

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
        <h1>
          Discussion avec {discussion.potentialBeneficiary.firstName}{" "}
          {discussion.potentialBeneficiary.lastName}
        </h1>
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
        <ButtonsGroup
          inlineLayoutWhen="always"
          buttonsSize="small"
          buttons={candidateContactButtons}
        />
        <div className={fr.cx("fr-grid-row")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-8")}>
            <Highlight className={fr.cx("fr-ml-0", "fr-pt-2w", "fr-pb-1w")}>
              <p className={fr.cx("fr-text--sm", "fr-mb-2w")}>
                Vous ne parvenez pas à répondre au candidat ? Copiez dans votre
                presse papier l'adresse email sécurisée de cette discussion et
                utilisez-la directement depuis votre boîte mail.
              </p>
              <CopyButton
                textToCopy={createOpaqueEmail({
                  discussionId: discussion.id,
                  recipient: {
                    kind: "potentialBeneficiary",
                    firstname: discussion.potentialBeneficiary.firstName,
                    lastname: discussion.potentialBeneficiary.lastName,
                  },
                  replyDomain: `reply.${window.location.hostname}`,
                })}
                id={
                  domElementIds.establishmentDashboard.discussion
                    .copyEmailButton
                }
                withIcon
                label="Copier l'adresse email"
              />
            </Highlight>
          </div>
        </div>
      </header>
      {discussion.exchanges.map(({ sender, sentAt, subject, message }) => (
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

      {createPortal(
        <RejectApplicationModal title="Refuser la candidature">
          <RejectApplicationForm discussion={discussion} />
        </RejectApplicationModal>,
        document.body,
      )}
    </>
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

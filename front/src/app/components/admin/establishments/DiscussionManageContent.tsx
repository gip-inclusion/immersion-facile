import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge, { type BadgeProps } from "@codegouvfr/react-dsfr/Badge";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useEffect } from "react";
import {
  ButtonWithSubMenu,
  CopyButton,
  DiscussionMeta,
  ExchangeMessage,
  Loader,
} from "react-design-system";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import {
  type DiscussionDisplayStatus,
  type DiscussionId,
  type DiscussionReadDto,
  type Email,
  type WithDiscussionId,
  addressDtoToString,
  createOpaqueEmail,
  domElementIds,
  getDiscussionDisplayStatus,
  toDisplayedDate,
} from "shared";
import { RejectApplicationForm } from "src/app/components/admin/establishments/RejectApplicationForm";
import type { ConventionPresentation } from "src/app/components/forms/convention/conventionHelpers";
import { useDiscussion } from "src/app/hooks/discussion.hooks";
import { useFeedbackEventCallback } from "src/app/hooks/feedback.hooks";
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
      children: "Répondre au candidat",
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
      getDiscussionDisplayStatus({ discussion, now: new Date() })
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
        <div className={fr.cx("fr-grid-row")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-8")}>
            <Highlight className={fr.cx("fr-ml-0", "fr-pt-2w", "fr-pb-1w")}>
              <span className={fr.cx("fr-text--sm", "fr-mb-2w")}>
                Vous ne parvenez pas à répondre au candidat ? Copiez dans votre
                presse papier l'adresse email sécurisée de cette discussion et
                utilisez-la directement depuis votre boîte mail.
              </span>
              <br />
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
        <RejectApplicationModal title="Marquer comme refusée">
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

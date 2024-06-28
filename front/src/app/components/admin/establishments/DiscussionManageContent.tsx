import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Card } from "@codegouvfr/react-dsfr/Card";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Select, { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { ExchangeMessage, Loader } from "react-design-system";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import {
  DiscussionId,
  DiscussionReadDto,
  Email,
  RejectionKind,
  WithDiscussionId,
  WithDiscussionRejection,
  addressDtoToString,
  createOpaqueEmail,
  discussionRejectionSchema,
  domElementIds,
  rejectDiscussionEmailParams,
  toDisplayedDate,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { ConventionPresentation } from "src/app/components/forms/convention/conventionHelpers";
import { useDiscussion } from "src/app/hooks/discussion.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  getConventionInitialValuesFromUrl,
  makeValuesToWatchInUrl,
} from "src/app/routes/routeParams/convention";
import { routes } from "src/app/routes/routes";
import { convertHtmlToText } from "src/app/utils/html.utils";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";
import { P, match } from "ts-pattern";

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

  return (
    <>
      <header>
        <Button
          type="button"
          onClick={() => window.history.back()}
          priority="tertiary"
          iconId="fr-icon-arrow-left-line"
          iconPosition="left"
          className={fr.cx("fr-mb-2w")}
        >
          Retour
        </Button>
        <h1>
          Discussion avec {discussion.potentialBeneficiary.firstName}{" "}
          {discussion.potentialBeneficiary.lastName}
        </h1>
        <p>
          {discussion.immersionObjective} ·{" "}
          {discussion.appellation.appellationLabel}
          {discussion.potentialBeneficiary.resumeLink ? (
            <>
              {" · "}
              <a
                href={discussion.potentialBeneficiary.resumeLink}
                title={"CV du candidat"}
                target="_blank"
                rel="noreferrer"
              >
                CV
              </a>
            </>
          ) : null}
        </p>
        <ButtonsGroup
          inlineLayoutWhen="always"
          buttonsSize="small"
          buttons={[
            {
              id: domElementIds.establishmentDashboard.discussion
                .replyToCandidateByEmail,
              priority: "primary",
              linkProps: {
                href: `mailto:${createOpaqueEmail(
                  discussion.id,
                  "potentialBeneficiary",
                  window.location.hostname,
                )}?subject=${encodeURI(
                  `Réponse de ${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - Immersion potentielle chez ${discussion.businessName} en tant que ${discussion.appellation.appellationLabel}`,
                )}`,
                target: "_blank",
              },
              children: "Répondre au candidat",
            },
            {
              id: domElementIds.establishmentDashboard.discussion
                .activateDraftConvention,
              priority: "tertiary",
              linkProps: {
                href: makeMailtoLink({
                  email: createOpaqueEmail(
                    discussion.id,
                    "potentialBeneficiary",
                    window.location.hostname,
                  ),
                  subject: `L'entreprise ${discussion.businessName} vous invite à finaliser votre demande de convention d'immersion`,
                  body: `Félicitations ${
                    discussion.potentialBeneficiary.firstName
                  },\n\nL'entreprise ${
                    discussion.businessName
                  } a accepté votre candidature et vous invite à: \n\n • vérifier les informations préremplies dans la demande de convention \n\n • compléter les informations manquantes \n\n • valider la demande de convention \n\n Voici <a href="${
                    makeDraftConventionLink(draftConvention, discussion.id).href
                  }">le lien pour accéder à la demande de convention préremplie</a>.\n\n Bonne journée,\nL'équipe Immersion Facilitée`,
                }),
                target: "_blank",
              },
              children: "Pré-remplir la convention pour cette mise en relation",
            },
            {
              id: domElementIds.establishmentDashboard.discussion
                .rejectApplicationOpenModal,
              priority: "tertiary",
              linkProps: {
                onClick: openRejectApplicationModal,
                href: "#",
              },
              children: "Refuser la candidature",
            },
          ]}
        />
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
            <div>{convertHtmlToText(message)}</div>
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
      phone: discussion.potentialBeneficiary.phone ?? "",
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
  immersionObjective: discussion.immersionObjective ?? undefined,
  siret: discussion.siret,
  businessName: discussion.businessName,
  immersionAppellation: discussion.appellation,
  immersionAddress: addressDtoToString(discussion.address),
});

const makeMailtoLink = ({
  email,
  subject,
  body,
}: {
  email: Email;
  subject: string;
  body?: string;
}) =>
  `mailto:${email}?subject=${encodeURI(subject)}${
    body ? `&body=${encodeURI(body)}` : ""
  }`;

const RejectApplicationForm = ({
  discussion,
}: {
  discussion: DiscussionReadDto;
}): JSX.Element => {
  const { register, watch, handleSubmit } = useForm<WithDiscussionRejection>({
    resolver: zodResolver(discussionRejectionSchema),
  });
  const dispatch = useDispatch();
  const watchedFormValues = watch();
  const [dataToSend, setDataToSend] =
    React.useState<WithDiscussionRejection | null>(null);
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
  return dataToSend ? (
    <>
      <p>
        Voici l'email qui sera envoyé au candidat si vous rejetez sa candidature
        :
      </p>
      <Card
        title={`Sujet : ${
          rejectDiscussionEmailParams({
            discussion,
            ...dataToSend,
          }).subject
        }`}
        className={fr.cx("fr-mb-2w")}
        desc={`Contenu : ${
          rejectDiscussionEmailParams({
            discussion,
            ...dataToSend,
          }).htmlContent
        }`}
      />
      <ButtonsGroup
        buttons={[
          {
            id: domElementIds.establishmentDashboard.discussion
              .rejectApplicationCancelButton,
            priority: "secondary",
            children: "Annuler",
            type: "button",
            onClick: () => setDataToSend(null),
          },
          {
            id: domElementIds.establishmentDashboard.discussion
              .rejectApplicationSubmitButton,
            priority: "primary",
            children: "Rejeter la candidature et notifier le candidat",
            onClick: () =>
              dispatch(
                discussionSlice.actions.updateDiscussionStatusRequested(
                  dataToSend,
                ),
              ),
          },
        ]}
        inlineLayoutWhen="always"
      />
    </>
  ) : (
    <form
      onSubmit={handleSubmit(setDataToSend, (errors) => console.log(errors))}
    >
      <Select
        label="Pour quel motif souhaitez-vous refuser cette candidature ?"
        nativeSelectProps={{
          id: domElementIds.establishmentDashboard.discussion
            .rejectApplicationJustificationKindInput,
          ...register("rejectionKind"),
        }}
        options={rejectionKindOptions}
      />
      {watchedFormValues.rejectionKind === "OTHER" && (
        <Input textArea label="Précisez" />
      )}
      <Feedback topic="establishment-discussion-rejection" />
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
              .rejectApplicationSubmitButton,
            priority: "primary",
            children: "Prévisualiser et envoyer",
          },
        ]}
        inlineLayoutWhen="always"
      />
    </form>
  );
};

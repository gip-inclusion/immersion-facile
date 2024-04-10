import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import React from "react";
import { ExchangeMessage, Loader } from "react-design-system";
import {
  DiscussionReadDto,
  Email,
  WithDiscussionId,
  addressDtoToString,
  createOpaqueEmail,
  domElementIds,
  toDisplayedDate,
} from "shared";
import { ConventionPresentation } from "src/app/components/forms/convention/conventionHelpers";
import { useDiscussion } from "src/app/hooks/discussion.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  conventionInitialValuesFromUrl,
  makeValuesToWatchInUrl,
} from "src/app/routes/routeParams/convention";
import { routes } from "src/app/routes/routes";
import { convertHtmlToText } from "src/app/utils/html.utils";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { P, match } from "ts-pattern";

type DiscussionManageContentProps = WithDiscussionId;

export const DiscussionManageContent = ({
  discussionId,
}: DiscussionManageContentProps): JSX.Element => {
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const connectedUser = useAppSelector(authSelectors.connectedUser);
  const discussionHook = useDiscussion(discussionId, inclusionConnectedJwt);

  return match(discussionHook)
    .with({ isLoading: true }, () => <Loader />)
    .with({ fetchError: P.not(P.nullish) }, ({ fetchError }) => {
      throw new Error(fetchError);
    })
    .with({ discussion: P.nullish }, () => (
      <Alert
        severity="warning"
        title={`La discussion ${discussionId} n'est pas trouvée.`}
      />
    ))
    .with({ discussion: P.not(P.nullish) }, ({ discussion }) =>
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
    initialConvention: conventionInitialValuesFromUrl({
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
          buttonsEquisized
          alignment="center"
          buttons={[
            {
              id: domElementIds.establishmentDashboard.discussion
                .activateDraftConvention,
              priority: "tertiary",
              linkProps: {
                href: makeDraftConventionLink(draftConvention).href,
                target: "_blank",
              },
              children: "Pré-remplir la convention pour cette mise en relation",
            },
            {
              id: domElementIds.establishmentDashboard.discussion
                .replyToCandidateByEmail,
              priority: "tertiary",
              linkProps: {
                href: `mailto:${createOpaqueEmail(
                  discussion.id,
                  "potentialBeneficiary",
                  window.location.hostname,
                )}?subject=${encodeURI(
                  `Réponse de ${discussion.establishmentContact.firstName} ${discussion.establishmentContact.firstName} - Immersion potentielle chez ${discussion.businessName} en tant que ${discussion.appellation.appellationLabel}`,
                )}`,
                target: "_blank",
              },
              children: "Envoyer un message au candidat par email",
            },
          ]}
        />
      </header>
      {discussion.exchanges.map(({ sender, sentAt, subject, message }) => (
        <ExchangeMessage sender={sender}>
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
    </>
  );
};

const makeDraftConventionLink = (convention: ConventionPresentation) =>
  routes.conventionImmersion({
    ...makeValuesToWatchInUrl(convention),
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

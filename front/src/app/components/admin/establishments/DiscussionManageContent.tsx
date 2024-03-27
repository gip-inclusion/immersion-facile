import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { ExchangeMessage, Loader } from "react-design-system";
import { DiscussionReadDto, WithDiscussionId, toDisplayedDate } from "shared";
import { useDiscussion } from "src/app/hooks/discussion.hooks";
import { P, match } from "ts-pattern";

type DiscussionManageContentProps = WithDiscussionId;

export const DiscussionManageContent = ({
  discussionId,
}: DiscussionManageContentProps): JSX.Element =>
  match(useDiscussion(discussionId))
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
    .with({ discussion: P.not(P.nullish) }, ({ discussion }) => (
      <DiscussionDetails discussion={discussion} />
    ))
    .exhaustive();

const DiscussionDetails = ({
  discussion: {
    potentialBeneficiary,
    immersionObjective,
    exchanges,
    businessName,
    appellation,
  },
}: { discussion: DiscussionReadDto }): JSX.Element => (
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
        Discussion avec {potentialBeneficiary.firstName}{" "}
        {potentialBeneficiary.lastName}
      </h1>
      <p>
        {immersionObjective} · {appellation.appellationLabel}
        {potentialBeneficiary.resumeLink ? (
          <>
            {" · "}
            <a
              href={potentialBeneficiary.resumeLink}
              title={"CV du candidat"}
              target="_blank"
              rel="noreferrer"
            >
              CV
            </a>
          </>
        ) : null}
      </p>
    </header>
    {exchanges.map(({ sender, sentAt, subject, message }) => (
      <ExchangeMessage sender={sender}>
        <header
          className={fr.cx("fr-grid-row", "fr-grid-row--middle", "fr-mb-2w")}
        >
          <div>
            <h2 className={fr.cx("fr-mb-0", "fr-mb-1v")}>
              {sender === "establishment"
                ? `${businessName}`
                : `${potentialBeneficiary.firstName} ${potentialBeneficiary.lastName}`}
            </h2>
          </div>
          <div className={fr.cx("fr-ml-auto")}>
            <div className={fr.cx("fr-mb-2w")}>
              <Badge
                className={`fr-badge--${
                  sender === "establishment" ? "blue-cumulus" : "green-archipel"
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
          <div>{message}</div>
        </section>
      </ExchangeMessage>
    ))}
  </>
);

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";

import type { AbsoluteUrl } from "shared";
import { useConsent } from "src/app/components/ConsentManager";
import { globalStatsUrl, immersionStatsUrl } from "src/app/pages/StatsPage";
import { ENV } from "src/config/environmentVariables";
import { useStyles } from "tss-react/dsfr";

const TitleButton = ({ url }: { url: AbsoluteUrl }) => (
  <a
    href={url}
    target="_blank"
    className={fr.cx("fr-btn", "fr-btn--tertiary", "fr-btn--sm", "fr-ml-auto")}
    rel="noreferrer"
  >
    Ouvrir en plein écran
  </a>
);

export const MetabaseView = ({
  title,
  subtitle,
  url,
}: {
  url?: AbsoluteUrl;
  title: string;
  subtitle?: string;
}) => {
  const { cx } = useStyles();
  const consent = useConsent();
  if (!consent.finalityConsent?.statistics)
    return (
      <>
        <p>
          Vous avez souhaité ne pas autoriser les cookies concernant cette
          fonctionnalité.
        </p>
        <Button
          type="button"
          onClick={() => {
            consent.assumeConsent("statistics");
          }}
        >
          Autoriser les cookies d'affichage de données
        </Button>
      </>
    );
  if (!url) return <p>Chargement du dashboard en cours...</p>;
  return (
    <div>
      <h2 className={cx(fr.cx("fr-h5", "fr-mb-2w"), "flex")}>
        {title} <TitleButton url={url} />
        {subtitle && <p className={fr.cx("fr-hint-text")}>{subtitle}</p>}
      </h2>
      {ENV.envType === "production" ||
      url === globalStatsUrl ||
      url === immersionStatsUrl ? (
        <iframe
          title="Tableau Metabase"
          src={url}
          frameBorder="0"
          width="100%"
          height="800"
        />
      ) : (
        <Alert
          title="Non disponible hors production"
          severity="warning"
          description="Cette fonctionnalité n'est disponible qu'en production (pas de
          metabase en dehors de la production)"
        />
      )}
    </div>
  );
};

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import type { AbsoluteUrl } from "shared";
import { useConsent } from "src/app/components/ConsentManager";
import { MetabaseFullScreenButton } from "src/app/components/MetabaseFullScreenButton";
import { BackofficeDashboardTabContent } from "src/app/components/layout/BackofficeDashboardTabContent";
import { globalStatsUrl, immersionStatsUrl } from "src/app/pages/StatsPage";
import { ENV } from "src/config/environmentVariables";

export const MetabaseView = ({
  title,
  subtitle,
  url,
}: {
  url?: AbsoluteUrl;
  title: string;
  subtitle?: string;
}) => {
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
    <BackofficeDashboardTabContent
      title={title}
      titleAction={<MetabaseFullScreenButton url={url} />}
      description={subtitle}
    >
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
    </BackofficeDashboardTabContent>
  );
};

import React from "react";
import { DsfrTitle, Notification } from "react-design-system";
import { AbsoluteUrl } from "shared";
import { ENV } from "src/config/environmentVariables";

const TitleButton = ({ url }: { url: AbsoluteUrl }) => (
  <a
    href={url}
    target="_blank"
    className="fr-btn fr-btn--tertiary fr-btn--sm fr-ml-auto"
  >
    Ouvrir en plein écran
  </a>
);

export const MetabaseView = ({
  title,
  url,
}: {
  url?: AbsoluteUrl;
  title: string;
}) => {
  if (!url) return <p>Chargement du dashboard en cours...</p>;
  return (
    <div>
      <DsfrTitle
        level={5}
        text={title}
        action={<TitleButton url={url} />}
        className={"flex"}
      />
      {ENV.envType === "production" ? (
        <iframe src={url} frameBorder="0" width="100%" height="800"></iframe>
      ) : (
        <Notification title={"Non disponible hors production"} type="warning">
          Cette fonctionnalité n'est disponible qu'en production (pas de
          metabase en dehors de la production)
        </Notification>
      )}
    </div>
  );
};

import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useStyles } from "tss-react/dsfr";

import { AbsoluteUrl } from "shared";

import { DsfrTitle } from "react-design-system";

import { ENV } from "src/config/environmentVariables";

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
  url,
}: {
  url?: AbsoluteUrl;
  title: string;
}) => {
  const { cx } = useStyles();
  if (!url) return <p>Chargement du dashboard en cours...</p>;
  return (
    <div>
      <DsfrTitle
        level={5}
        text={title}
        action={<TitleButton url={url} />}
        className={cx("flex")}
      />
      {ENV.envType === "production" ? (
        <iframe src={url} frameBorder="0" width="100%" height="800"></iframe>
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

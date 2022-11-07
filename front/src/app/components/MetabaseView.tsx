import React from "react";
import { DsfrTitle } from "react-design-system";
import { AbsoluteUrl } from "shared";

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
  if (!url) return <p>Chargement...</p>;
  return (
    <div>
      <DsfrTitle
        level={5}
        text={title}
        action={<TitleButton url={url} />}
        className={"flex"}
      />
      <iframe src={url} frameBorder="0" width="100%" height="800"></iframe>
    </div>
  );
};

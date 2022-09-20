import React from "react";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { DsfrTitle } from "react-design-system";

export const MetabaseView = ({
  title,
  url,
}: {
  url?: AbsoluteUrl;
  title: string;
}) =>
  url ? (
    <div>
      <DsfrTitle level={5} text={title} />
      <iframe src={url} frameBorder="0" width="1220" height="800"></iframe>
    </div>
  ) : (
    <p>Chargement...</p>
  );

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import type { AbsoluteUrl } from "shared";

export const MetabaseFullScreenButton = ({
  url,
  tooltipText,
  label = "Ouvrir en plein écran",
}: {
  url: AbsoluteUrl;
  label?: string;
  tooltipText?: string;
}) => {
  if (tooltipText)
    return (
      <Tooltip title={tooltipText}>
        <Button
          linkProps={{
            target: "_blank",
            rel: "noreferrer",
            href: url,
          }}
          size="small"
          priority="tertiary"
          className={fr.cx("fr-ml-auto")}
        >
          {label}
        </Button>
      </Tooltip>
    );

  return (
    <Button
      linkProps={{
        target: "_blank",
        rel: "noreferrer",
        href: url,
      }}
      size="small"
      priority="tertiary"
      className={fr.cx("fr-ml-auto")}
    >
      {label}
    </Button>
  );
};

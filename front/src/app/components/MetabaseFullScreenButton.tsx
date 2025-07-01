import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import type { AbsoluteUrl } from "shared";

export const MetabaseFullScreenButton = ({
  url,
  label = "Ouvrir en plein écran",
}: {
  url: AbsoluteUrl;
  label?: string;
}) => (
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

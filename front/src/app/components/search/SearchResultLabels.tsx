import { fr } from "@codegouvfr/react-dsfr";

import type { FitForDisableWorkerOption } from "shared";
import { useStyles } from "tss-react/dsfr";

type ImmersionOfferLabelsProps = {
  truc?: FitForDisableWorkerOption | null;
  className?: string;
};

export const SearchResultLabels = ({
  truc: fitForDisabledWorkers,
}: ImmersionOfferLabelsProps) => (
  <ul className={fr.cx("fr-card__desc", "fr-badges-group")}>
    {fitForDisabledWorkers === "yes-declared-only" && (
      <li>
        <Label className={fr.cx("fr-badge--yellow-moutarde")}>
          Personnes en situation de handicap bienvenues
        </Label>
      </li>
    )}
    {fitForDisabledWorkers === "yes-ft-certified" && (
      <li>
        <Label className={fr.cx("fr-badge--yellow-moutarde")}>
          Certifié pour l'accueil personnes en situation de handicap
        </Label>
      </li>
    )}
  </ul>
);

const Label = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => {
  const { cx } = useStyles();
  return <span className={cx(fr.cx("fr-badge"), className)}>{children}</span>;
};

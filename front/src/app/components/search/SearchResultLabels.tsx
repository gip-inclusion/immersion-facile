import { fr } from "@codegouvfr/react-dsfr";

import type { ContactMode, FitForDisableWorkerOption } from "shared";
import { useStyles } from "tss-react/dsfr";

type ImmersionOfferLabelsProps = {
  voluntaryToImmersion?: boolean;
  fitForDisabledWorkers?: FitForDisableWorkerOption | null;
  contactMode?: ContactMode;
  className?: string;
};

export const SearchResultLabels = ({
  voluntaryToImmersion,
  fitForDisabledWorkers,
  contactMode,
}: ImmersionOfferLabelsProps) => (
  <ul className={fr.cx("fr-card__desc", "fr-badges-group")}>
    <li>
      <InfoLabel
        contactMode={contactMode}
        voluntaryToImmersion={voluntaryToImmersion}
      />
    </li>
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

const InfoLabel = ({
  contactMode,
  voluntaryToImmersion,
}: ImmersionOfferLabelsProps) => {
  const { cx } = useStyles();
  const luckyGuess = typeof contactMode === "undefined";
  const className = [
    ...(voluntaryToImmersion ? [fr.cx("fr-badge--blue-cumulus")] : []),
    ...(luckyGuess ? [fr.cx("fr-badge--purple-glycine")] : []),
  ].join(" ");

  const label = voluntaryToImmersion
    ? "Entreprise accueillante"
    : "Tentez votre chance";

  return voluntaryToImmersion || luckyGuess ? (
    <Label className={cx(className)}>{label}</Label>
  ) : null;
};

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

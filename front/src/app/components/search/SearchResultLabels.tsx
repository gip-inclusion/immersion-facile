import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import { ContactMethod } from "shared";

type ImmersionOfferLabelsProps = {
  voluntaryToImmersion?: boolean;
  fitForDisabledWorkers?: boolean;
  contactMode?: ContactMethod;
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
    {fitForDisabledWorkers && (
      <li>
        <Label className={fr.cx("fr-badge--yellow-moutarde")}>
          Priorité aux personnes en situation de handicap
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

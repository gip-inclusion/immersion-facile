import { fr } from "@codegouvfr/react-dsfr";
import {
  Tag as DsfrTag,
  TagProps as DsfrTagProps,
} from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./Tag.styles";

type ThemeTag = "rqth" | "superEnterprise" | "lbb" | "voluntaryToImmersion";

type TagProps = {
  theme: ThemeTag;
};

type Themes = Record<
  ThemeTag,
  {
    label: string;
    iconId: DsfrTagProps.WithIcon["iconId"];
  }
>;

const themes: Themes = {
  rqth: {
    label: "Personnes en situation de handicap bienvenues",
    iconId: "fr-icon-account-line",
  },
  superEnterprise: {
    label: "Super entreprise",
    iconId: "fr-icon-star-line",
  },
  lbb: {
    label: "Tentez votre chance",
    iconId: "fr-icon-draft-line",
  },
  voluntaryToImmersion: {
    label: "Entreprise accueillante",
    iconId: "fr-icon-team-line",
  },
};

export const Tag = ({ theme }: TagProps) => {
  const selectedTheme = themes[theme];
  const { cx } = useStyles();
  return (
    <DsfrTag
      className={cx(
        fr.cx("fr-mx-1w", "fr-my-1v", "fr-text--xs"),
        Styles.root,
        Styles[theme],
      )}
      iconId={selectedTheme.iconId}
    >
      {selectedTheme.label}
    </DsfrTag>
  );
};

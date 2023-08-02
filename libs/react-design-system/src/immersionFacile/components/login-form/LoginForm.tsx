import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import Styles from "./LoginForm.styles";

export type LoginFormSectionProps = {
  title: string;
  description: string;
  authComponent: React.ReactNode;
  index?: number;
};

type LoginFormProps = {
  sections: LoginFormSectionProps[];
  classes?: string;
  style?: React.CSSProperties;
};

const LoginFormSection = ({
  title,
  description,
  authComponent,
  index,
}: LoginFormSectionProps) => {
  const { cx } = useStyles();
  return (
    <>
      {index !== undefined && index > 0 && (
        <p className={cx(fr.cx("fr-mt-5w", "fr-mb-4w", "fr-hr-or"))}>ou</p>
      )}
      <div>
        <h2 className={fr.cx("fr-h4")}>{title}</h2>
        <p dangerouslySetInnerHTML={{ __html: description }} />
        {authComponent}
      </div>
    </>
  );
};

export const LoginForm = ({ sections }: LoginFormProps) => {
  const { cx } = useStyles();
  return (
    <div className={cx(fr.cx("fr-py-6w", "fr-px-12w"), Styles.inner)}>
      {sections.map((props: LoginFormSectionProps, index) => (
        <LoginFormSection key={props.title} {...props} index={index} />
      ))}
    </div>
  );
};

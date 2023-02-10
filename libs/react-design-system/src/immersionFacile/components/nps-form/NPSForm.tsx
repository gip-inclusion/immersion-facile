import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

type NPSFormProps = {
  title?: string;
  conventionId: string;
};

const componentName = "im-nps-form";

export const NPSForm = ({ title, conventionId }: NPSFormProps) => {
  const { cx } = useStyles();
  return (
    <section className={cx(componentName)}>
      <hr className={fr.cx("fr-hr", "fr-my-4w")} />
      <iframe
        src={`https://tally.so/embed/wM1oRp?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&conventionId=${conventionId}`}
        loading="lazy"
        width="100%"
        height="290"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title={title}
        className={cx(`${componentName}__embed`)}
      />
    </section>
  );
};

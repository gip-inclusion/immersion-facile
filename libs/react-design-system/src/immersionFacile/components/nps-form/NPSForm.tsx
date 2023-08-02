import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

export type NPSFormProps = {
  title?: string;
  conventionInfos: {
    id: string;
    role: string;
    status: string;
  };
};

const componentName = "im-nps-form";

export const NPSForm = ({ title, conventionInfos }: NPSFormProps) => {
  const { cx } = useStyles();
  const paramsAsString = (
    Object.keys(conventionInfos) as (keyof typeof conventionInfos)[]
  ).reduce((acc, key) => `${acc}&${key}=${conventionInfos[key]}`, "");
  return (
    <section className={cx(componentName)}>
      <hr className={fr.cx("fr-hr", "fr-my-4w")} />
      <iframe
        src={`https://tally.so/embed/wM1oRp?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&${paramsAsString}`}
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

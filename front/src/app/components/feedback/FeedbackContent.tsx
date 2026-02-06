import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";
import type { FrCoreClassName } from "@codegouvfr/react-dsfr/fr/generatedFromCss/classNames";
import { PageHeader, type TitleLevel } from "react-design-system";
import type { ExtractFromExisting } from "shared";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";

export type FeedbackContentProps = {
  title: string;
  illustration: string;
  content: React.ReactNode;
  buttonProps: ButtonProps;
  titleAs?: TitleLevel;
  titleClassName?: ExtractFromExisting<FrCoreClassName, `fr-${TitleLevel}`>;
};

export const FeedbackContent = ({
  illustration,
  title,
  titleAs = "h1",
  titleClassName,
  content,
  buttonProps,
}: FeedbackContentProps) => (
  <PageHeader
    title={title}
    illustration={illustration}
    breadcrumbs={<Breadcrumbs />}
    titleAs={titleAs}
    titleClassName={titleClassName ?? ""}
  >
    {content}
    <div>
      <Button {...buttonProps} className={fr.cx("fr-mt-2w")} />
    </div>
  </PageHeader>
);

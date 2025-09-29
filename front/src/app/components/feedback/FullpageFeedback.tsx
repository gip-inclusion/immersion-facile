import { fr } from "@codegouvfr/react-dsfr";
import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { MainWrapper, PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

type FullPageFeedbackProps = {
  title: string;
  illustration: string;
  content: React.ReactNode;
  buttonProps: ButtonProps;
  includeWrapper?: boolean;
};

export const FullPageFeedback = ({
  title,
  illustration,
  content,
  buttonProps,
  includeWrapper = true,
}: FullPageFeedbackProps) => {
  const feedbackContent = (
    <PageHeader
      title={title}
      illustration={illustration}
      breadcrumbs={<Breadcrumbs />}
    >
      {content}
      <div>
        <Button {...buttonProps} className={fr.cx("fr-mt-2w")} />
      </div>
    </PageHeader>
  );
  return includeWrapper ? (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={0} className={fr.cx("fr-mb-4w")}>
        {feedbackContent}
      </MainWrapper>
    </HeaderFooterLayout>
  ) : (
    feedbackContent
  );
};

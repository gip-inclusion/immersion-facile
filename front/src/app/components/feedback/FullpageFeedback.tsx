import { fr } from "@codegouvfr/react-dsfr";
import { MainWrapper } from "react-design-system";
import {
  FeedbackContent,
  type FeedbackContentProps,
} from "src/app/components/feedback/FeedbackContent";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

type FullPageFeedbackProps = FeedbackContentProps & {
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
    <FeedbackContent
      buttonProps={buttonProps}
      illustration={illustration}
      title={title}
      content={content}
    />
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

import { MainWrapper } from "react-design-system";
import type { ConventionJwt, ShortLinkId } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { ErrorPageContent } from "src/app/pages/error/ErrorPageContent";
import { ContactUsButton } from "src/app/pages/error/front-errors";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import { RenewExpiredJwtButton } from "../../components/auth/RenewExpiredJwtButton";

const linkAlreadyUsedTitle = "Ce lien a déjà été utilisé";
const linkAlreadyUsedDescription =
  "Ce lien de signature ne peut être utilisé qu'une seule fois. Si vous le souhaitez, vous pouvez demander un nouveau lien.";

export const LinkAlreadyUsedPage = ({
  shortLinkId,
  expiredJwt,
}: {
  shortLinkId: ShortLinkId;
  expiredJwt: ConventionJwt;
}): React.JSX.Element => {
  const feedbackTopic: FeedbackTopic = "renew-expired-jwt-convention";

  const buttons = [
    RenewExpiredJwtButton({
      expiredJwt,
      feedbackTopic,
      shortLinkId,
    }),
    ContactUsButton,
  ];

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default">
        <ErrorPageContent
          title={linkAlreadyUsedTitle}
          description={linkAlreadyUsedDescription}
          buttons={buttons}
          feedbackTopic={feedbackTopic}
        />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

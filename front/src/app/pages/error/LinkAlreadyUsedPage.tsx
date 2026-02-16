import { MainWrapper } from "react-design-system";
import type { ConventionJwt } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { ErrorPageContent } from "src/app/pages/error/ErrorPageContent";
import { ContactUsButton, HomeButton } from "src/app/pages/error/front-errors";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import { RenewExpiredJwtButton } from "../../components/auth/RenewExpiredJwtButton";

const linkAlreadyUsedTitle = "Ce lien a déjà été utilisé";
const linkAlreadyUsedDescription =
  "Ce lien de signature ne peut être utilisé qu'une seule fois. Si vous le souhaitez, vous pouvez demander un nouveau lien.";

export const LinkAlreadyUsedPage = ({
  jwt,
}: {
  jwt?: ConventionJwt;
}): React.JSX.Element => {
  const feedbackTopic: FeedbackTopic = "renew-expired-jwt-convention";

  const buttons = jwt
    ? [
        RenewExpiredJwtButton({
          feedbackTopic,
          expiredJwt: jwt,
          originalUrl: window.location.href,
        }),
        ContactUsButton,
      ]
    : [HomeButton, ContactUsButton];

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default">
        <ErrorPageContent
          title={linkAlreadyUsedTitle}
          description={linkAlreadyUsedDescription}
          buttons={buttons}
          feedbackTopic={jwt ? feedbackTopic : undefined}
        />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

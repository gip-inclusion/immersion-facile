import { MainWrapper } from "react-design-system";
import { RenewExpiredLinkContent } from "src/app/components/auth/RenewExpiredLinkContent";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const RenewExpiredLinkPage = () => (
  <HeaderFooterLayout>
    <MainWrapper layout="boxed">
      <RenewExpiredLinkContent />
    </MainWrapper>
  </HeaderFooterLayout>
);

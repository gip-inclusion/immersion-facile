import React from "react";
import { MainWrapper } from "react-design-system";
import { DiscussionManageContent } from "src/app/components/admin/establishments/DiscussionManageContent";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";

type DiscussionManagePageProps = {
  route: Route<typeof routes.manageDiscussion>;
};

export const DiscussionManagePage = ({ route }: DiscussionManagePageProps) => {
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        <DiscussionManageContent discussionId={route.params.discussionId} />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

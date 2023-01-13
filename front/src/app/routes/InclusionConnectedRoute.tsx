import React, { useState } from "react";
import { InclusionConnectButton, MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const InclusionConnectedRoute = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const [isInclusionConnected, setIsInclusionConnected] = useState(false);

  if (!isInclusionConnected)
    return (
      <HeaderFooterLayout>
        <MainWrapper layout="boxed">
          <InclusionConnectButton
            inclusionConnectEndpoint="yolo"
            onClick={(e) => {
              e.preventDefault();
              setIsInclusionConnected(true);
            }}
          />
        </MainWrapper>
      </HeaderFooterLayout>
    );

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">{children}</MainWrapper>
    </HeaderFooterLayout>
  );
};

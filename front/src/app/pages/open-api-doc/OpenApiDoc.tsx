import type { ReactElement } from "react";
import { MainWrapper } from "react-design-system";
import { type AvailableApiVersion, technicalRoutes } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export const OpenApiDoc = (props: {
  version: AvailableApiVersion;
}): ReactElement => (
  <HeaderFooterLayout>
    <MainWrapper layout="default" vSpacing={0}>
      <SwaggerUI
        url={`/api${technicalRoutes.openApiSpec.url}?${new URLSearchParams(props)}`}
        supportedSubmitMethods={["get"]}
      />
    </MainWrapper>
  </HeaderFooterLayout>
);

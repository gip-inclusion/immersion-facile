import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { Loader } from "react-design-system";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { ApiConsumersSection } from "src/app/pages/admin/technical-options-sections/ApiConsumersSection";
import { FeatureFlagsSection } from "src/app/pages/admin/technical-options-sections/FeatureFlagsSection";
import { UploadFileSection } from "src/app/pages/admin/technical-options-sections/UploadFileSection";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";

export const TechnicalOptionsTab = () => {
  const { isLoading: isFeatureFlagsLoading } = useFeatureFlags();
  const isApiConsumersLoading = useAppSelector(apiConsumerSelectors.isLoading);
  return (
    <>
      {(isFeatureFlagsLoading || isApiConsumersLoading) && <Loader />}
      <div className={fr.cx("fr-container")}>
        <FeatureFlagsSection />
      </div>
      <div className={fr.cx("fr-container", "fr-mt-6w")}>
        <UploadFileSection />
      </div>
      <div className={fr.cx("fr-container", "fr-mt-6w")}>
        <ApiConsumersSection />
      </div>
    </>
  );
};

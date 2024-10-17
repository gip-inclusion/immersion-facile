import { useMemo } from "react";
import { MainWrapper, SubmitConfirmationSection } from "react-design-system";
import { errors, zUuidLike } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";

type ConventionConfirmationPageProps = {
  route: ConventionImmersionPageRoute;
};

type ConventionImmersionPageRoute = Route<typeof routes.conventionConfirmation>;

export const ConventionConfirmationPage = ({
  route,
}: ConventionConfirmationPageProps) => {
  const { conventionId } = route.params;
  const { copyButtonIsDisabled, copyButtonLabel, onCopyButtonClick } =
    useCopyButton();
  const isValidConventionId = useMemo(
    () => !!conventionId && zUuidLike.safeParse(conventionId).success,
    [conventionId],
  );
  if (!isValidConventionId) throw errors.convention.notFound({ conventionId });
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" useBackground>
        <SubmitConfirmationSection
          idToCopy={conventionId}
          copyButtonIsDisabled={copyButtonIsDisabled}
          copyButtonLabel={copyButtonLabel}
          onCopyButtonClick={onCopyButtonClick}
        />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

import { fr } from "@codegouvfr/react-dsfr";
import { useMemo } from "react";
import {
  MainWrapper,
  SectionConventionNextSteps,
  SectionConventionNextStepsProps,
  SubmitConfirmationSection,
} from "react-design-system";
import { errors, zUuidLike } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { nextStepIllustrations } from "../../../assets/img/illustrations";

type ConventionConfirmationPageProps = {
  route: ConventionImmersionPageRoute;
};

type ConventionImmersionPageRoute = Route<typeof routes.conventionConfirmation>;

const nextSteps: SectionConventionNextStepsProps["nextSteps"] = [
  {
    illustration: nextStepIllustrations[0],
    content: (
      <>
        <p>1. Pensez à verifier votre boîte mail et votre dossier de spams.</p>
        <a
          className={fr.cx("fr-download__link", "fr-link--icon-right")}
          href="https://immersion-facile.beta.gouv.fr/aide/article/le-beneficiaire-lentreprise-ou-le-prescripteur-na-pas-recu-la-convention-a-signer-125bxxd/"
          target="_blank"
          rel="noreferrer"
        >
          Vous n'avez pas reçu l'email ?
        </a>
      </>
    ),
  },
  {
    illustration: nextStepIllustrations[1],
    content: (
      <>
        <p>
          2. Signez électroniquement la demande de convention à partir du mail
          reçu.
        </p>
      </>
    ),
  },
  {
    illustration: nextStepIllustrations[2],
    content: (
      <p>
        3. Pensez également à informer les autres signataires de la convention
        qu'ils devront vérifier leur boîte mail et leur dossier de spams.
      </p>
    ),
  },
];

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
      <MainWrapper
        layout="fullscreen"
        useBackground
        backgroundStyles={{
          marginTop: "5rem",
        }}
      >
        <SubmitConfirmationSection
          idToCopy={conventionId}
          copyButtonIsDisabled={copyButtonIsDisabled}
          copyButtonLabel={copyButtonLabel}
          onCopyButtonClick={onCopyButtonClick}
        />
        <SectionConventionNextSteps nextSteps={nextSteps} />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

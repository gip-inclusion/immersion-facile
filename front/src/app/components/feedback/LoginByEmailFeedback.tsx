import { fr } from "@codegouvfr/react-dsfr";
import { Button, type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { Highlight } from "@codegouvfr/react-dsfr/Highlight";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import { useDispatch } from "react-redux";
import { type AllowedStartOAuthLoginPage, domElementIds } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { loginByEmailFeedbackTopic } from "src/app/routes/ConnectedPrivateRoute";
import { routes, useRoute } from "src/app/routes/routes";
import { loginIllustration } from "src/assets/img/illustrations";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { Breadcrumbs } from "../Breadcrumbs";
import { HeaderFooterLayout } from "../layout/HeaderFooterLayout";
import { immersionFacileSupportUrl } from "../layout/LayoutFooter";

type Mode = "success" | "failed";

type MajorFeedbackProps = {
  mode: Mode;
  page: AllowedStartOAuthLoginPage;
};

export const LoginByEmailFeedback = ({ mode, page }: MajorFeedbackProps) => {
  const route = useRoute();
  const dispatch = useDispatch();

  const email = useAppSelector(authSelectors.requestedEmail);
  const isRequestingLoginByEmail = useAppSelector(
    authSelectors.isRequestingLoginByEmail,
  );

  const contents: Record<
    Mode,
    {
      title: string;
      content: React.ReactNode;
      buttonProps: ButtonProps;
    }
  > = {
    success: {
      title: "Votre lien de connexion a bien été envoyé",
      content: (
        <>
          {email && (
            <p className={fr.cx("fr-text--regular")}>
              Un email contenant votre lien de connexion vient d’être envoyé à
              l’adresse <strong>{email}</strong>. Ce lien est valable pendant 12
              heures. Pensez à vérifier vos spams si vous ne le voyez pas
              rapidement.
            </p>
          )}
          <Highlight>
            Si vous avez déjà utilisé Immersion Facilitée, assurez-vous d’avoir
            renseigné la même adresse email que précédemment. Cela nous permet
            de retrouver votre entreprise ou vos conventions.
          </Highlight>
        </>
      ),
      buttonProps: {
        children: "Retourner sur la page d'accueil",
        className: fr.cx("fr-mt-2w"),
        onClick: () => routes.home().push(),
        id: domElementIds[page].login.navigateToHome,
      },
    },
    failed: {
      title: "Nous n’avons pas pu envoyer le lien de connexion",
      content: (
        <>
          {email && (
            <p>
              Une erreur est survenue lors de l’envoi du lien de connexion à
              l’adresse <strong>{email}</strong>. Cela peut arriver en cas de
              problème temporaire de messagerie ou si l’adresse email renseignée
              est incorrecte.
            </p>
          )}
          <p>
            Veuillez vérifier l’orthographe de votre adresse email et réessayer.
          </p>
        </>
      ),
      buttonProps: {
        children: "Recevoir à nouveau le lien",
        className: fr.cx("fr-mt-2w"),
        onClick: () => {
          if (email) {
            dispatch(
              authSlice.actions.loginByEmailRequested({
                email,
                page,
                feedbackTopic: loginByEmailFeedbackTopic,
              }),
            );
          }
        },
      },
    },
  };

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={0} className={fr.cx("fr-mb-4w")}>
        <PageHeader
          title={contents[mode].title}
          illustration={loginIllustration}
          breadcrumbs={<Breadcrumbs />}
        >
          {isRequestingLoginByEmail && <Loader />}
          {contents[mode].content}
          <p>
            Vous n’avez pas reçu le lien ?{" "}
            <a
              className={fr.cx("fr-link")}
              href={route.href}
              id={domElementIds[page].login.retryButton}
            >
              Modifier mon email
            </a>{" "}
            ou{" "}
            <a
              id={domElementIds[page].login.contactSupport}
              className={fr.cx("fr-link")}
              href={immersionFacileSupportUrl}
              target="_blank"
              rel="noreferrer"
            >
              Contacter le support
            </a>
          </p>
          <Button
            {...contents[mode].buttonProps}
            className={fr.cx("fr-mt-2w")}
          />
        </PageHeader>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

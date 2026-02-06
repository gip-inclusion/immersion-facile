import { fr } from "@codegouvfr/react-dsfr";
import { Feedback } from "src/app/components/feedback/Feedback";
import type { FrontErrorProps } from "src/app/contents/error/types";
import { commonIllustrations } from "src/assets/img/illustrations";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";

type ErrorPageContentProps = FrontErrorProps & {
  feedbackTopic?: FeedbackTopic;
};

export const ErrorPageContent = ({
  title,
  subtitle,
  description,
  buttons,
  feedbackTopic,
}: ErrorPageContentProps) => (
  <div
    className={fr.cx(
      "fr-grid-row",
      "fr-grid-row--gutters",
      "fr-grid-row--middle",
    )}
  >
    <div className={fr.cx("fr-col-12", "fr-col-lg-8")}>
      <h1>{title}</h1>
      <p className={fr.cx("fr-text--lead", "fr-mb-3w")}>{subtitle}</p>
      <p className={fr.cx("fr-text--sm", "fr-mb-3w")}>{description}</p>
      <ul className={fr.cx("fr-btns-group", "fr-btns-group--inline-md")}>
        {buttons.length
          ? buttons.map((button) => {
              const buttonJsx =
                typeof button === "function"
                  ? button({
                      currentUrl: window.location.href,
                      currentDate: new Date().toISOString(),
                      error: description,
                    })
                  : button;
              return <li key={buttonJsx.key}>{buttonJsx}</li>;
            })
          : null}
      </ul>
      {feedbackTopic && <Feedback topics={[feedbackTopic]} />}
    </div>
    <div className={fr.cx("fr-hidden", "fr-unhidden-lg", "fr-col-4")}>
      <img src={commonIllustrations.errorMissing} alt="" />
    </div>
  </div>
);

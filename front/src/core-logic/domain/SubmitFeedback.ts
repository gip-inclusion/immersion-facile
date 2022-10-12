type ErrorFeedback = {
  kind: "errored";
  errorMessage: string;
};

export type SubmitFeedBack<T extends string> =
  | { kind: T }
  | { kind: "idle" }
  | ErrorFeedback;

export const isFeedbackError = (
  submitFeedback: SubmitFeedBack<string>,
): submitFeedback is ErrorFeedback => submitFeedback.kind === "errored";

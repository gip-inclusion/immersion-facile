import { TallyForm, tallyFormSchema } from "shared";
import { createTransactionalUseCase } from "../../UseCase";
import { CrispGateway } from "../ports/CrispGateway";

export type SendSupportTicketToCrisp = ReturnType<
  typeof makeSendSupportTicketToCrisp
>;
export const makeSendSupportTicketToCrisp = createTransactionalUseCase<
  TallyForm,
  void,
  void,
  { crispApi: CrispGateway }
>(
  { name: "SendSupportTicketToCrips", inputSchema: tallyFormSchema },
  async () => {
    // TODO: we need to have some sample from prod data to implement this.
  },
);

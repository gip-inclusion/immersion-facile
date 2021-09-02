export type Email = {
  recipient: string;
  subject: string;
  textContent: string;
};

export interface EmailGateway {
  send: (emailEntity: Email) => Promise<void>;
}

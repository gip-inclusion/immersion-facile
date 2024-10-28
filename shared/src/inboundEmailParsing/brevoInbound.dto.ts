export type BrevoAttachment = {
  Name: string;
  ContentType: string;
  ContentLength: number;
  DownloadToken: string;
};

export type BrevoRecipient = {
  Name: string | null;
  Address: string;
};

export type BrevoEmailItem = {
  Uuid: string[];
  MessageId: string;
  InReplyTo: string | null;
  From: BrevoRecipient;
  To: BrevoRecipient[];
  Cc: BrevoRecipient[] | null;
  ReplyTo: BrevoRecipient | null;
  SentAtDate: string;
  Subject: string;
  Attachments: BrevoAttachment[] | null;
  RawHtmlBody: string | null;
  RawTextBody: string | null;
};

export type BrevoInboundBody = {
  items: BrevoEmailItem[];
};

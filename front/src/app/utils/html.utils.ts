export const convertHtmlToText = (message: string): string => {
  const bodyRegex: RegExp = /<body[^>]*>([\s\S]*?)<\/body>/;
  const matches: RegExpMatchArray | null = message.match(bodyRegex);

  const body = matches?.[0] ?? message;

  const tempDivElement = document.createElement("div");
  tempDivElement.innerHTML = body;
  return (
    tempDivElement.textContent || tempDivElement.innerText || "Pas de contenu"
  );
};

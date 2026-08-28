import legacyHtml from "../legacy.html?raw";

const bodyMarkup =
  legacyHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? legacyHtml;

export default function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyMarkup }} />
      <script src="/scroll-reveal.js?v=26" defer />
    </>
  );
}

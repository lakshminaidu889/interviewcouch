// Renders **bold** segments and hides the trailing "SCORE:" line while streaming.
export default function Feedback({ text }) {
  const clean = text.replace(/SCORE:.*$/is, "").trim();
  return (
    <div className="feedback">
      {clean.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part
      )}
    </div>
  );
}

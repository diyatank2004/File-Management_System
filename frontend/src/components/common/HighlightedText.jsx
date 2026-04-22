import React from "react";

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function HighlightedText({ text = "", query = "", component: Component = "span", sx }) {
  const safeText = String(text);
  const trimmedQuery = String(query).trim();

  if (!safeText) {
    return null;
  }

  if (!trimmedQuery) {
    return <Component style={sx}>{safeText}</Component>;
  }

  const parts = safeText.split(new RegExp(`(${escapeRegex(trimmedQuery)})`, "gi"));

  return (
    <Component style={sx}>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
          <mark
            key={`${part}-${index}`}
            style={{
              backgroundColor: "rgba(255, 208, 0, 0.35)",
              color: "inherit",
              borderRadius: 4,
              padding: "0 2px"
            }}
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
        )
      )}
    </Component>
  );
}
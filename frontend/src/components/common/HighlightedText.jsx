// frontend/src/components/common/HighlightedText.jsx
import React from 'react';

const HighlightedText = ({ text = '', query, search, component: Component = 'span' }) => {
  const q = query ?? search;
  if (!q) return <Component>{text}</Component>;

  const escaped = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'i');
  const parts = String(text).split(regex);
  const lowerQ = q.toLowerCase();

  return (
    <Component>
      {parts.map((part, idx) =>
        part.toLowerCase().includes(lowerQ) ? (
          <mark key={idx} style={{ backgroundColor: '#fef08a', color: '#000', padding: '0 2px', borderRadius: '2px' }}>
            {part}
          </mark>
        ) : (
          <Component key={idx}>{part}</Component>
        )
      )}
    </Component>
  );
};

export default HighlightedText;
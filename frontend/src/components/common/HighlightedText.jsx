// frontend/src/components/common/HighlightedText.jsx
import React from 'react';

const HighlightedText = ({ text, search }) => {
  if (!search) return <span>{text}</span>;

  // Escape special regex characters safely
  const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapSearch})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} style={{ backgroundColor: '#fef08a', color: '#000', padding: '0 2px', borderRadius: '2px' }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default HighlightedText;
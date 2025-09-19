import React, { useState } from "react";

type DiaryTagsProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[]; // AI/tag suggestions
  editable?: boolean;
};

export default function DiaryTags({
  tags,
  onChange,
  suggestions = [],
  editable = true,
}: DiaryTagsProps) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const cleanTag = tag.trim().replace(/[^a-zA-Z0-9-_ ]/g, "");
    if (!cleanTag || tags.includes(cleanTag)) return;
    onChange([...tags, cleanTag]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-wrap gap-2 items-center mt-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded text-xs flex items-center"
        >
          #{tag}
          {editable && (
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 text-red-400 hover:text-red-600 px-1"
              aria-label={`Remove ${tag}`}
              type="button"
            >
              ×
            </button>
          )}
        </span>
      ))}

      {editable && (
        <input
          className="bg-transparent text-sm px-2 py-1 outline-none border-b border-blue-300 ml-1 w-24"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === "Tab") && !!input.trim()) {
              e.preventDefault();
              addTag(input);
            }
            if (e.key === "Backspace" && !input && tags.length) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          placeholder="Add tag"
          disabled={!editable}
        />
      )}

      {/* Suggestions / AI tags */}
      {editable && suggestions.length > 0 && (
        <div className="flex gap-1 ml-2 flex-wrap">
          {suggestions
            .filter((sug) => !tags.includes(sug))
            .map((sug) => (
              <button
                key={sug}
                className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-0.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-200"
                onClick={() => addTag(sug)}
                type="button"
              >
                +{sug}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

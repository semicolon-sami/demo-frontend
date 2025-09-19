import React, { useState } from "react";

type DiarySearchBarProps = {
  value: string;
  onSearch: (val: string) => void;
};

export default function DiarySearchBar({ value, onSearch }: DiarySearchBarProps) {
  const [input, setInput] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(input.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center max-w-md mx-auto mb-6" autoComplete="off">
      <input
        type="text"
        placeholder="Search diary entries…"
        className="flex-1 rounded-l-md py-2 px-4 border border-gray-300 dark:border-gray-700 text-lg bg-white dark:bg-gray-800 outline-none"
        value={input}
        onChange={handleChange}
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-r-md px-4 py-2 text-lg"
        aria-label="Search"
      >
        🔍
      </button>
    </form>
  );
}

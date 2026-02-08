import React from "react";
import { useTheme, type ThemeMode } from "../lib/theme-context";

const options: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center bg-white/10 rounded-full p-0.5 text-[10px] font-semibold">
      {options.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
            theme === value
              ? "bg-white/20 text-white"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

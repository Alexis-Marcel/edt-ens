"use client";

import { CLASSES } from "@/lib/types";

interface SidebarProps {
  selectedClasses: Set<string>;
  onToggleClass: (classId: string) => void;
}

export default function Sidebar({
  selectedClasses,
  onToggleClass,
}: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Classes</h2>
        <div className="space-y-3">
          {CLASSES.map((cls) => (
            <label key={cls.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selectedClasses.has(cls.id)}
                onChange={() => onToggleClass(cls.id)}
                className="h-4 w-4 rounded"
                style={{ accentColor: cls.color }}
              />
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: cls.color }}
              />
              <span className="font-medium text-gray-700">{cls.label}</span>
            </label>
          ))}
        </div>
      </aside>

      {/* Mobile filter bar */}
      <div className="flex md:hidden items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
        {CLASSES.map((cls) => (
          <button
            key={cls.id}
            onClick={() => onToggleClass(cls.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selectedClasses.has(cls.id)
                ? "text-white"
                : "bg-gray-100 text-gray-400"
            }`}
            style={
              selectedClasses.has(cls.id)
                ? { backgroundColor: cls.color }
                : undefined
            }
          >
            <span>{cls.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

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
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white p-5">
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
      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          Mis à jour automatiquement toutes les heures
        </p>
      </div>
    </aside>
  );
}

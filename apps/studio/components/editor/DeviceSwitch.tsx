"use client";

import { useEditor, type Device } from "@/lib/store";

const devices: { id: Device; label: string; icon: string; title: string }[] = [
  { id: "desktop", label: "Desktop", icon: "🖥", title: "Desktop · lg" },
  { id: "tablet", label: "Tablet", icon: "▯", title: "Tablet · md" },
  { id: "mobile", label: "Mobile", icon: "▯", title: "Mobile · base" },
];

export function DeviceSwitch() {
  const device = useEditor((s) => s.device);
  const setDevice = useEditor((s) => s.setDevice);

  return (
    <div className="inline-flex items-center rounded border border-slate-200 bg-white overflow-hidden">
      {devices.map((d) => (
        <button
          key={d.id}
          title={d.title}
          onClick={() => setDevice(d.id)}
          className={`px-2.5 py-1 text-xs transition-colors ${
            device === d.id
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

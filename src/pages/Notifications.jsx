import { Bell } from "lucide-react";
import { useData } from "../context/DataContext";

export default function Notifications() {
  const { notifications } = useData();
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <p className="hud-label mb-2">Inbox</p>
      <h1 className="font-display text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <Bell size={26} className="text-cyan-400" /> Notifications
      </h1>
      <div className="panel divide-y divide-white/5">
        {notifications.map((n) => (
          <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.read ? "bg-cyan-500/5" : ""}`}>
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-cyan-400" : "bg-transparent"}`} />
            <div>
              <p className="text-sm text-slate-200">{n.text}</p>
              <p className="text-xs text-slate-500 mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

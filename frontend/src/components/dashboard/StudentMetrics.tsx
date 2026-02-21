import { CheckCircle2, Cpu, RotateCcw } from "lucide-react";

const METRICS_DATA = [
  {
    title: "Success Rate",
    value: "84.5%",
    trendText: "+2.4% this week",
    trendColor: "text-emerald-500",
    Icon: CheckCircle2,
    TrendIcon: () => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-4 h-4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
        <polyline points="16 7 22 7 22 13"></polyline>
      </svg>
    ),
  },
  {
    title: "AI Dependency",
    value: "12%",
    trendText: "Optimal mastery range",
    trendColor: "text-emerald-500",
    Icon: Cpu,
    TrendIcon: () => <CheckCircle2 className="w-4 h-4" />,
  },
  {
    title: "Avg. Retries",
    value: "2.4",
    trendText: "Target: < 3.0",
    trendColor: "text-gray-500",
    Icon: RotateCcw,
    TrendIcon: () => (
      <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center font-serif italic text-[10px] text-gray-600">
        i
      </div>
    ),
  },
];

export default function StudentMetrics() {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
      {METRICS_DATA.map(
        ({ title, value, trendText, trendColor, Icon, TrendIcon }) => (
          <div
            key={title}
            className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-bold text-gray-700">{title}</span>
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-1">
              <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {value}
              </span>
              <div
                className={`flex items-center gap-1.5 text-sm font-bold mt-2 ${trendColor}`}
              >
                <TrendIcon />
                {trendText}
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

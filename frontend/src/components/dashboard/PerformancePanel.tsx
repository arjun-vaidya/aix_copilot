const RECENT_SIMULATIONS = [
  {
    title: "Damped Harmonic",
    status: "Verified • 2h ago",
    statusColor: "text-emerald-500",
    hasBorder: true,
  },
  {
    title: "Matrix Inversion",
    status: "Failed Audit • 1d ago",
    statusColor: "text-red-500",
    hasBorder: false,
  },
];

export default function PerformancePanel() {
  return (
    <div className="w-full xl:w-[380px] flex flex-col gap-8 shrink-0">
      <h3 className="text-xl font-bold text-gray-900">Performance Breakdown</h3>

      <div className="flex flex-col gap-6">
        {/* Box 1: AI Dependency Chart */}
        <div className="p-8 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
          <h4 className="w-full text-sm font-bold text-gray-900 mb-8 self-start">
            AI Dependency Metric
          </h4>

          {/* Fake Donut Chart Graphic */}
          <div className="w-36 h-36 rounded-full border-[12px] border-blue-500 flex flex-col items-center justify-center relative">
            {/* Ghost border behind */}
            <div className="absolute inset-[-12px] rounded-full border-[12px] border-gray-100 -z-10 clip-half" />

            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
              12%
            </span>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">
              ASSISTANCE
            </span>
          </div>

          <p className="mt-8 text-xs text-center text-blue-600 leading-relaxed font-medium">
            You are using AI help effectively. This score reflects a healthy
            balance of independent work and guided hints.
          </p>
        </div>

        {/* Box 2: Recent Simulations List */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col gap-5">
          <h4 className="text-sm font-bold text-gray-900">
            Recent Simulations
          </h4>

          <div className="flex flex-col gap-4">
            {RECENT_SIMULATIONS.map((sim) => (
              <div
                key={sim.title}
                className={`flex justify-between items-center ${
                  sim.hasBorder ? "border-b border-gray-100 pb-4" : "pb-2"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">
                    {sim.title}
                  </span>
                  <span className={`text-xs font-medium ${sim.statusColor}`}>
                    {sim.status}
                  </span>
                </div>
                <button className="text-xs font-bold text-gray-500 hover:text-blue-600">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Sigma, Waves, GripHorizontal, Lock } from "lucide-react";

const PROBLEM_SETS = [
    {
        id: "1",
        title: "1.2 Linear Regression on House Prices",
        subtitle: "Assigned Nov 10 • Due in 2 days",
        progress: 75,
        isLocked: false,
        actionText: "Resume",
        Icon: Sigma,
        iconColor: "text-blue-600",
        bgClass: "bg-blue-50",
        progressColor: "bg-blue-600",
    },
    {
        id: "set-5",
        title: "Set 5: Ordinary Differential Equations",
        subtitle: "Assigned Nov 15 • Due in 8 days",
        progress: 0,
        isLocked: false,
        actionText: "Start",
        Icon: Waves,
        iconColor: "text-sky-600",
        bgClass: "bg-sky-50",
    },
    {
        id: "set-6",
        title: "Set 6: Partial Diff Equations",
        subtitle: "Locked • Release Nov 25",
        progress: 0,
        isLocked: true,
        actionText: "",
        Icon: GripHorizontal,
        iconColor: "text-gray-400",
        bgClass: "bg-gray-200",
    },
];

export default function ProblemSetList() {
    const navigate = useNavigate();

    return (
        <div className="w-full flex flex-col gap-4">
            {PROBLEM_SETS.map((set) => {
                if (set.isLocked) {
                    return (
                        <div
                            key={set.id}
                            className="bg-gray-50 border border-[#e5e7eb] rounded-xl p-6 opacity-75"
                        >
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-4 sm:gap-5">
                                    <div
                                        className={`w-12 h-12 rounded-xl ${set.bgClass} flex items-center justify-center shrink-0`}
                                    >
                                        <set.Icon className={`w-6 h-6 ${set.iconColor}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-gray-400 leading-tight sm:leading-normal">
                                            {set.title}
                                        </h4>
                                        <span className="text-xs text-gray-400 mt-1">
                                            {set.subtitle}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                    <Lock className="w-5 h-5 text-gray-300" />
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div
                        key={set.id}
                        className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div
                                    className={`w-12 h-12 rounded-xl ${set.bgClass} flex items-center justify-center shrink-0`}
                                >
                                    <set.Icon className={`w-6 h-6 ${set.iconColor}`} />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="font-bold text-gray-900 leading-tight sm:leading-normal">
                                        {set.title}
                                    </h4>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {set.subtitle}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/workspace/${set.id}`)}
                                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                            >
                                {set.actionText}
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm font-semibold">
                                <span className="text-gray-600">Progress</span>
                                <span className="text-gray-900">{set.progress}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                {set.progress > 0 && (
                                    <div
                                        className={`h-full ${set.progressColor} rounded-full`}
                                        style={{ width: `${set.progress}%` }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

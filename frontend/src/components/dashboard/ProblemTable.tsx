import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadInstructorProblems } from "../../lib/problemLoader";
import type { ProblemSet } from "../../lib/problemLoader";

export default function ProblemTable() {
    const navigate = useNavigate();
    const [problems, setProblems] = useState<ProblemSet[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProblems() {
            try {
                const data = await loadInstructorProblems("au2229");
                setProblems(data);
            } catch (error) {
                console.error("Failed to load problems:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProblems();
    }, []);

    if (isLoading) {
        return (
            <div className="w-full bg-white border border-[#f1f1f1] rounded-2xl p-12 text-center shadow-sm">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-[#0267C1] border-t-transparent rounded-full mb-3" />
                <p className="text-gray-400 text-sm font-medium">Loading problem sets...</p>
            </div>
        );
    }

    if (problems.length === 0) {
        return (
            <div className="w-full bg-white border border-[#f1f1f1] rounded-2xl p-12 text-center shadow-sm">
                <p className="text-gray-400 text-sm font-medium">No problem sets available.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white border border-[#f1f1f1] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <tbody className="divide-y divide-[#f1f1f1]">
                        {problems.map((set) => (
                            <tr key={set.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <span className="text-[15px] font-bold text-[#111827]">
                                        {set.title}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-[14px] font-medium text-[#6B7280]">
                                        {set.topic}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button
                                        onClick={() => navigate(`/workspace/${set.id}`)}
                                        className="px-6 py-2 border-2 border-[#0267C1] text-[#0267C1] hover:bg-[#eff6ff] text-[13px] font-bold rounded-lg transition-colors"
                                    >
                                        Start Set
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

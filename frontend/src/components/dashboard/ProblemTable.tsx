import { useNavigate } from "react-router-dom";

interface ProblemSet {
    id: string;
    name: string;
    topic: string;
    status: 'review' | 'continue' | 'start';
    letter: string;
}

const PROBLEM_SETS: ProblemSet[] = [
    {
        id: "1",
        name: "Problem Set 1: Linear Algebra",
        topic: "Matrices & Vectors",
        status: 'review',
        letter: 'L',
    },
    {
        id: "2",
        name: "Problem Set 2: Root Finding",
        topic: "Newton's Method",
        status: 'continue',
        letter: 'R',
    },
    {
        id: "3",
        name: "Problem Set 3: Interpolation",
        topic: "Lagrange Polynomials",
        status: 'start',
        letter: 'I',
    },
    {
        id: "4",
        name: "Problem Set 4: Integration",
        topic: "Simpson's Rule",
        status: 'start',
        letter: 'Q',
    }
];

export default function ProblemTable() {
    const navigate = useNavigate();

    return (
        <div className="w-full bg-white border border-[#f1f1f1] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left">

                    <tbody className="divide-y divide-[#f1f1f1]">
                        {PROBLEM_SETS.map((set) => (
                            <tr key={set.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <span className="text-[15px] font-bold text-[#111827]">
                                        {set.name}
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

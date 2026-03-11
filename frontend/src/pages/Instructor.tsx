import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, FileText, Loader2 } from "lucide-react";
import { loadInstructorProblems, type ProblemSet } from "../lib/problemLoader";
import CreateProblemModal from "../components/instructor/CreateProblemModal";

export default function Instructor() {
  const [problemSets, setProblemSets] = useState<ProblemSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadInstructorProblems("au2229").then((loaded) => {
      // Sort to guarantee consistent UI ordering based on title "1.1", "2.1", etc.
      const sorted = loaded.sort((a, b) => a.title.localeCompare(b.title));
      setProblemSets(sorted);
      setIsLoading(false);
    });
  }, []);

  const handleCreateProblem = (data: any) => {
    console.log("Creating new problem set:", data);
    // TODO: Actually hook this up to the GitHub PAT API layer
    setIsModalOpen(false);
  };

  return (
    <div className="w-full h-full bg-[#f8f9fa] overflow-y-auto px-4 py-8 md:p-8 lg:p-10 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Problem Sets</h1>
            <p className="text-sm text-gray-500 mt-1">Create, edit, and monitor your assigned problem sets.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Problem Set
          </button>
        </div>

        {/* Loading State or Grid */}
        {isLoading ? (
          <div className="w-full h-64 flex flex-col items-center justify-center gap-4 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="font-medium">Loading repository: /au2229/...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {problemSets.map((set) => (
              <div
                key={set.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col group min-h-[160px]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight">{set.title}</h3>
                      <span className="text-xs font-medium text-gray-500">{set.topic}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 transition-opacity">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors" title="Edit Problem Set">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors" title="Delete Problem Set">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mt-2 mb-4">
                  {set.description}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-xs text-gray-400 font-medium">Last Modified: {set.lastModified}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Overlay Modal */}
      <CreateProblemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProblem}
      />
    </div>
  );
}

import { X, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

interface CreateProblemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isSubmitting?: boolean;
    errorMessage?: string;
}

export default function CreateProblemModal({ isOpen, onClose, onSubmit, isSubmitting = false, errorMessage }: CreateProblemModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        topic: "",
        difficulty: "Beginner",
        description: "",
        objectivePlaceholder: "",
        constraintPlaceholder: "",
        initialCode: "# AI4Numerics Editor\nimport numpy as np\n\n# TODO: Implement...",
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4 md:p-8 md:pb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create New Problem Set</h2>
                        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed pr-8">
                            Initialize a new numerical challenge for your students. You can add specific parameters and grading scripts in the next step.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors -mr-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error State */}
                {errorMessage && (
                    <div className="px-6 md:px-8 mb-4">
                        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                            <span className="font-semibold block mb-0.5">Creation Failed:</span>
                            {errorMessage}
                        </div>
                    </div>
                )}

                {/* Scrollable Form Body */}
                <div className="px-6 md:px-8 pb-4 overflow-y-auto custom-scrollbar flex-1">
                    <div className="space-y-5">

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Problem Title</label>
                            <input
                                type="text"
                                placeholder="e.g., Eigenvalue Stability Analysis"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Topic Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Module / Category</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-white text-gray-700"
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                >
                                    <option value="" disabled>Select Module...</option>
                                    <option value="Linear Algebra">Linear Algebra</option>
                                    <option value="Differential Equations">Differential Equations</option>
                                    <option value="Transport Phenomena">Transport Phenomena</option>
                                    <option value="Fluid Dynamics">Fluid Dynamics</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Difficulty</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm bg-white text-gray-700"
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Brief Description</label>
                            <textarea
                                rows={3}
                                placeholder="Provide a short context for the problem..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Advanced Configurations */}
                        <div className="pt-2">
                            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Gatekeeper Configurations</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Objective Placeholder</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Calculate the steady-state temperature..."
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                        value={formData.objectivePlaceholder}
                                        onChange={(e) => setFormData({ ...formData, objectivePlaceholder: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Constraint Placeholder</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. T_in = 400K, Re = 100..."
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                        value={formData.constraintPlaceholder}
                                        onChange={(e) => setFormData({ ...formData, constraintPlaceholder: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Initial Starter Code</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-mono text-gray-600 bg-gray-50 focus:bg-white resize-none"
                                        value={formData.initialCode}
                                        onChange={(e) => setFormData({ ...formData, initialCode: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 md:px-8 py-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(formData)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm min-w-[140px] justify-center cursor-pointer disabled:cursor-wait"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Create & Edit
                                <ArrowRight className="w-4 h-4 ml-0.5" />
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}

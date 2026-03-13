import type { LucideIcon } from "lucide-react";

interface ResourceCardProps {
    title: string;
    description: string;
    linkText: string;
    Icon: LucideIcon;
}

export default function ResourceCard({ title, description, linkText, Icon }: ResourceCardProps) {
    return (
        <div className="flex-1 flex flex-col bg-white border border-[#f1f1f1] rounded-2xl overflow-hidden shadow-sm hover:translate-y-[-2px] transition-all duration-300">
            {/* Icon Header */}
            <div className="h-40 bg-[#f8fafc] flex items-center justify-center border-b border-[#f1f1f1]">
                <div className="w-16 h-16 bg-[#eff6ff] rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-[#0267C1] opacity-70" />
                </div>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col flex-1">
                <h4 className="text-[17px] font-bold text-[#111827] mb-3 leading-snug">
                    {title}
                </h4>
                <p className="text-[14px] leading-relaxed text-[#6B7280] mb-6 line-clamp-3">
                    {description}
                </p>
                <div className="mt-auto">
                    <button className="flex items-center gap-2 text-[14px] font-extrabold text-[#0267C1] hover:gap-3 transition-all">
                        {linkText}
                        <span className="text-xl leading-none pt-0.5">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

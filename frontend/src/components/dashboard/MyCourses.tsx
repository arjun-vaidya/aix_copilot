import { Book, Waves, Atom } from "lucide-react";

const MY_COURSES = [
  {
    title: "Numerical Methods 101",
    Icon: Book,
    iconColor: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  {
    title: "Fluid Dynamics",
    Icon: Waves,
    iconColor: "text-sky-500",
    bgClass: "bg-sky-50",
  },
  {
    title: "Quantum Mechanics",
    Icon: Atom,
    iconColor: "text-indigo-500",
    bgClass: "bg-indigo-50",
  },
];

export default function MyCourses() {
  return (
    <div className="w-full flex flex-col gap-6 mt-6 mb-6">
      <div className="flex items-end justify-between">
        <h3 className="text-xl font-bold text-gray-900">My Courses</h3>
        <a
          href="#"
          className="text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
        >
          View All Courses
        </a>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {MY_COURSES.map(({ title, Icon, iconColor, bgClass }) => (
          <div
            key={title}
            className="flex-1 bg-white border border-[#e5e7eb] rounded-xl p-4 flex items-center gap-4 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-all shadow-sm hover:shadow-md"
          >
            <div
              className={`w-10 h-10 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <span className="font-bold text-gray-900 text-sm">{title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

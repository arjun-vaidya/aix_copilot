import StudentMetrics from "../components/dashboard/StudentMetrics";
import MyCourses from "../components/dashboard/MyCourses";
import ProblemSetList from "../components/dashboard/ProblemSetList";
import Header from "../components/dashboard/Header";
import PerformancePanel from "../components/dashboard/PerformancePanel";

export default function Dashboard() {
  return (
    <div className="w-full h-full flex flex-col">
      <Header />

      {/* Scrollable Main Content */}
      <main className="w-full px-6 md:px-10 py-8 md:py-12 flex flex-col gap-10">
        {/* Welcome Section */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, Alex
          </h2>
          <div className="flex items-center text-sm">
            <span className="text-gray-500">Currently viewing:</span>
            <span className="font-bold text-gray-900 ml-2">
              Numerical Methods 101
            </span>
          </div>
        </div>

        <StudentMetrics />

        <MyCourses />

        <div className="flex flex-col xl:flex-row gap-10">
          {/* Main Left Column (Sets) */}
          <div className="flex-1 flex flex-col gap-8">
            <div className="flex items-end justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Active Problem Sets
              </h3>
              <a
                href="#"
                className="text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
              >
                View All Sets
              </a>
            </div>

            <ProblemSetList />
          </div>

          <PerformancePanel />
        </div>
      </main>
    </div>
  );
}

import ProblemTable from "../components/dashboard/ProblemTable";

export default function Dashboard() {
  return (
    <div className="w-full h-full bg-[#fcfcfc] overflow-y-auto">
      <main className="max-w-[1200px] mx-auto px-8 md:px-12 py-12 flex flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col">
          <h1 className="text-4xl font-black text-[#111827] tracking-tight">
            Dashboard Overview
          </h1>
        </header>

        {/* Separator */}
        <div className="h-[1px] w-full bg-[#f1f1f1] -mt-2" />

        {/* Problem Sets Section */}
        <section className="flex flex-col gap-6 -mt-2">
          <h3 className="text-lg font-extrabold text-[#111827]">
            Available Problem Sets
          </h3>
          <ProblemTable />
        </section>
      </main>
    </div>
  );
}

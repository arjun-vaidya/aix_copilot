import ProblemTable from "../components/dashboard/ProblemTable";
import ResourceCard from "../components/dashboard/ResourceCard";
import { BrainCircuit, Cpu, ShieldCheck } from "lucide-react";

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

        {/* Resource Cards Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
          <ResourceCard
            title="Why Reasoning Matters"
            description="Understanding the 'why' behind numerical methods ensures long-term retention beyond simple formula application."
            linkText="Read Article"
            Icon={BrainCircuit}
          />
          <ResourceCard
            title="Debugging as a Learning Tool"
            description="How analyzing convergence failures provides deeper insights into algorithm stability and precision limits."
            linkText="Read Article"
            Icon={Cpu}
          />
          <ResourceCard
            title="Mastering the Gatekeeper Phase"
            description="Strategies for overcoming the initial steep learning curve of advanced numerical analysis concepts."
            linkText="Read Article"
            Icon={ShieldCheck}
          />
        </section>
      </main>
    </div>
  );
}

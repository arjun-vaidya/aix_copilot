import yaml from "js-yaml";

export type ProblemSet = {
    id: string;
    title: string;
    topic: string;
    description: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    objectivePlaceholder: string;
    constraintPlaceholder: string;
    dataset: {
        description: string;
        fields: { name: string; type: string; desc: string }[];
    }[];
    initialCode: string;
    unitTestPath?: string;
};

/** Shape of the raw YAML after parsing (snake_case keys) */
interface RawYamlProblem {
    id: string;
    title: string;
    topic: string;
    description: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    objective_placeholder: string;
    constraint_placeholder: string;
    datasets: {
        description: string;
        fields: { name: string; type: string; desc: string }[];
    }[];
    initial_code: string;
    unit_test_path?: string;
}

/**
 * Fetches a single problem YAML from /problems/<id>.yaml
 * and converts it into a ProblemSet object.
 */
export async function loadProblemById(problemId: string): Promise<ProblemSet | null> {
    try {
        const response = await fetch(`/problems/problem_${problemId}.yaml`);
        if (!response.ok) return null;

        const rawText = await response.text();
        const parsed = yaml.load(rawText) as RawYamlProblem;

        return {
            id: parsed.id,
            title: parsed.title,
            topic: parsed.topic,
            description: parsed.description.trim(),
            difficulty: parsed.difficulty,
            objectivePlaceholder: parsed.objective_placeholder,
            constraintPlaceholder: parsed.constraint_placeholder,
            dataset: parsed.datasets ?? [],
            initialCode: parsed.initial_code,
            unitTestPath: parsed.unit_test_path ?? undefined,
        };
    } catch (error) {
        console.error(`Failed to load problem ${problemId}:`, error);
        return null;
    }
}

import yaml from "js-yaml";

export type ProblemSet = {
    id: string;
    title: string;
    topic: string;
    description: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    objectivePlaceholder: string;
    constraintPlaceholder: string;
    approachPlaceholder: string;
    dataset: {
        description: string;
        fields: { name: string; type: string; desc: string }[];
    }[];
    initialCode: string;
    unitTestPath?: string;
    quizPath?: string;
    lastModified: string;
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
    approach_placeholder?: string;
    datasets: {
        description: string;
        fields: { name: string; type: string; desc: string }[];
    }[];
    initial_code: string;
    unit_test_path?: string;
    quiz_path?: string;
}

/**
 * Fetches a single problem YAML from /problems/<instructorId>/<filename>
 * For convenience with existing logic, if problemId is just a number "1", it tries "problem_1.yaml"
 */
export async function loadProblemById(problemId: string, instructorId = "au2229"): Promise<ProblemSet | null> {
    try {
        // If they passed "1", convert to "problem_1.yaml". If they passed "problem_1.yaml", use as is.
        const filename = problemId.includes(".yaml") ? problemId : `problem_${problemId}.yaml`;
        const response = await fetch(`/problems/${instructorId}/${filename}`);
        if (!response.ok) return null;

        // Extract native file metadata via HTTP headers
        const lastModifiedHeader = response.headers.get('Last-Modified');
        let lastModified = "Recently";
        if (lastModifiedHeader) {
            const date = new Date(lastModifiedHeader);
            lastModified = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }

        const rawText = await response.text();
        const parsed = yaml.load(rawText) as RawYamlProblem;

        return {
            id: parsed.id,
            title: parsed.title,
            topic: parsed.topic,
            description: parsed.description?.trim() || "",
            difficulty: parsed.difficulty,
            objectivePlaceholder: parsed.objective_placeholder,
            constraintPlaceholder: parsed.constraint_placeholder,
            approachPlaceholder: parsed.approach_placeholder ?? "e.g. Describe your strategy for solving this problem...",
            dataset: parsed.datasets ?? [],
            initialCode: parsed.initial_code,
            unitTestPath: parsed.unit_test_path ?? undefined,
            quizPath: parsed.quiz_path ?? undefined,
            lastModified,
        };
    } catch (error) {
        console.error(`Failed to load problem ${problemId}:`, error);
        return null;
    }
}

/**
 * Fetches all problem sets for a given instructor by first loading
 * their index.json catalog, then fetching each YAML file.
 */
export async function loadInstructorProblems(instructorId = "au2229"): Promise<ProblemSet[]> {
    try {
        const response = await fetch(`/problems/${instructorId}/index.json`);
        if (!response.ok) return [];

        const fileList = await response.json() as string[];
        const loadPromises = fileList.map(filename => loadProblemById(filename, instructorId));
        const results = await Promise.all(loadPromises);

        // Filter out any nulls if a file failed to load
        return results.filter((p): p is ProblemSet => p !== null);
    } catch (error) {
        console.error(`Failed to load problems for instructor ${instructorId}:`, error);
        return [];
    }
}

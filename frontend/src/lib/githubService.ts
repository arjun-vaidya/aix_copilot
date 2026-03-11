export interface CommitResult {
    success: boolean;
    error?: string;
}

/**
 * Sends problem creation data to the secure Vercel API function
 * which commits the YAML to the GitHub repository using backend secrets.
 */
export async function createAndCommitProblem(instructorId: string, formData: any): Promise<CommitResult> {
    try {
        const response = await fetch('/api/github-commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instructorId, formData })
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || `HTTP ${response.status} Error.` };
        }

        return data as CommitResult;

    } catch (error: any) {
        console.error("Failed to connect to Vercel API Route:", error);
        return {
            success: false,
            error: "Network Error: To test API routes locally, please run `npx vercel dev` instead of `npm run dev`."
        };
    }
}

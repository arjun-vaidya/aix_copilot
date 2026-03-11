export const config = {
    runtime: 'edge',
};

const OWNER = "arjun-vaidya";
const REPO = "aix_copilot";
const BRANCH = "main";
const BASE_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

function utf8ToBase64(str: string) {
    // Edge runtime compatible base64 encoding
    return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str: string) {
    return decodeURIComponent(escape(atob(str)));
}

function generateYamlDefinition(data: any, id: string): string {
    return `id: "${id}"
title: "${data.title}"
topic: "${data.topic}"
description: >
  ${data.description.replace(/\n/g, '\n  ')}
difficulty: "${data.difficulty}"
objectivePlaceholder: "${data.objectivePlaceholder}"
constraintPlaceholder: "${data.constraintPlaceholder}"
dataPlaceholder: |
  ${data.initialCode.replace(/\n/g, '\n  ')}
`;
}

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405 });
    }

    // Backend securely reads the token from Vercel's environment variables (no VITE_ prefix needed)
    // @ts-ignore (process.env is provided securely by the Vercel Node runtime)
    const GITHUB_PAT = process.env.GITHUB_PAT || process.env.VITE_GITHUB_PAT || "PLACEHOLDER_GITHUB_PAT";

    if (GITHUB_PAT === "PLACEHOLDER_GITHUB_PAT") {
        return new Response(JSON.stringify({ success: false, error: "ERROR # 701 - PAT ERROR" }), { status: 500 });
    }

    const { instructorId, formData } = await req.json();

    try {
        const indexUrl = `${BASE_URL}/frontend/public/problems/${instructorId}/index.json?ref=${BRANCH}`;
        const indexRes = await fetch(indexUrl, {
            headers: { Authorization: `Bearer ${GITHUB_PAT}`, Accept: "application/vnd.github.v3+json" }
        });

        if (!indexRes.ok) {
            const errorText = await indexRes.text();
            throw new Error(`Failed to fetch the problem catalog from GitHub: HTTP ${indexRes.status}. GitHub Response: ${errorText}`);
        }
        const indexData = await indexRes.json();
        const currentFiles: string[] = JSON.parse(base64ToUtf8(indexData.content));
        const indexSha = indexData.sha;

        const nextId = currentFiles.length + 1;
        const newFileName = `problem_${nextId}.yaml`;
        const yamlContent = generateYamlDefinition(formData, nextId.toString());

        const newFileUrl = `${BASE_URL}/frontend/public/problems/${instructorId}/${newFileName}`;
        const newFileRes = await fetch(newFileUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${GITHUB_PAT}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `feat: Create new problem set ${newFileName}`,
                content: utf8ToBase64(yamlContent),
                branch: BRANCH
            })
        });

        if (!newFileRes.ok) throw new Error("Failed to commit the new YAML file to the repository.");

        currentFiles.push(newFileName);
        const updatedIndexRes = await fetch(indexUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${GITHUB_PAT}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `chore: Update index.json to include ${newFileName}`,
                content: utf8ToBase64(JSON.stringify(currentFiles, null, 2)),
                sha: indexSha, // Must provide the blob SHA to update an existing file
                branch: BRANCH
            })
        });

        if (!updatedIndexRes.ok) throw new Error("Failed to update the tracking index.json on GitHub.");

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error("GitHub Commit API Error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message || "An unknown network error occurred." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

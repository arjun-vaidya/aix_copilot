// Pre-load the global pyodide types
declare global {
    function importScripts(...urls: string[]): void;
    function loadPyodide(options?: any): Promise<any>;
}

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide: any = null;

// Where we mount student code on Pyodide's filesystem.
// Adding this to sys.path lets test files do `from main import ...`.
const WORKDIR = "/home/pyodide/workspace";

async function loadEngine() {
    if (!pyodide) {
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
        });

        pyodide.setStdout({ batched: (msg: string) => self.postMessage({ type: "stdout", text: msg }) });
        pyodide.setStderr({ batched: (msg: string) => self.postMessage({ type: "stderr", text: msg }) });

        // Create the workdir and put it on sys.path. Idempotent.
        try { pyodide.FS.mkdirTree(WORKDIR); } catch { /* exists */ }
        await pyodide.runPythonAsync(
            `import sys\nif ${JSON.stringify(WORKDIR)} not in sys.path:\n    sys.path.insert(0, ${JSON.stringify(WORKDIR)})\n`
        );
    }
}

// Sanitise a user-supplied filename into something safe to write to the FS.
function safeFilename(name: string, fallback: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9_.\-]/g, "_").replace(/^_+|_+$/g, "");
    if (!cleaned) return fallback;
    return cleaned.endsWith(".py") ? cleaned : `${cleaned}.py`;
}

self.onmessage = async (event: MessageEvent) => {
    const { code, id, testPath, testFiles } = event.data as {
        code: string;
        id: number;
        testPath?: string;
        testFiles?: Array<{ name: string; code: string }>;
    };

    if (!pyodide) {
        self.postMessage({ type: "system", text: "Initializing Python Engine (Pyodide v0.25)..." });
        await loadEngine();
        self.postMessage({ type: "system", text: "Engine Ready." });
    }

    try {
        const isTestRun = !!testPath || (Array.isArray(testFiles) && testFiles.length > 0);

        if (!isTestRun) {
            // ---- Simulation mode: run main code directly ----
            await pyodide.loadPackagesFromImports(code);
            const result = await pyodide.runPythonAsync(code);
            self.postMessage({ type: "success", id, result: result?.toString() });
            return;
        }

        // ---- Test mode ----

        // 1. Write main.py to disk so `from main import ...` works.
        pyodide.FS.writeFile(`${WORKDIR}/main.py`, code ?? "");

        // 2. Collect every test file: problem-supplied + student-authored.
        const allTests: Array<{ displayName: string; filePath: string }> = [];

        if (testPath) {
            const response = await fetch(testPath);
            if (!response.ok) throw new Error(`Failed to fetch ${testPath} (${response.status})`);
            const testCode = await response.text();
            const baseName = testPath.split("/").pop() || "unit_test.py";
            const safe = safeFilename(`provided_${baseName}`, "provided_unit_test.py");
            pyodide.FS.writeFile(`${WORKDIR}/${safe}`, testCode);
            allTests.push({ displayName: baseName, filePath: `${WORKDIR}/${safe}` });
        }

        if (Array.isArray(testFiles)) {
            testFiles.forEach((tf, idx) => {
                const safe = safeFilename(tf.name, `student_test_${idx}.py`);
                pyodide.FS.writeFile(`${WORKDIR}/${safe}`, tf.code);
                allTests.push({ displayName: tf.name, filePath: `${WORKDIR}/${safe}` });
            });
        }

        // 3. Pre-load packages mentioned anywhere across main + tests.
        const allCode = [code, ...(testFiles?.map(t => t.code) ?? [])].join("\n");
        await pyodide.loadPackagesFromImports(allCode);

        // 4. Build the Python runner. We pass the test list as a JSON literal — JSON's
        //    string/list/dict syntax is also valid Python, so Python parses it directly.
        const testsLiteral = JSON.stringify(
            allTests.map(t => ({ name: t.displayName, path: t.filePath }))
        );

        const runner = `
import sys, importlib.util, traceback

# Re-import main fresh on every run so edits to main.py take effect.
sys.modules.pop("main", None)

TESTS = ${testsLiteral}

passes = 0
failures = 0
failed_tests = []

for idx, tf in enumerate(TESTS):
    print("\\n=== Running " + tf["name"] + " ===")
    try:
        spec = importlib.util.spec_from_file_location(f"_aix_test_mod_{idx}", tf["path"])
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
    except Exception as load_err:
        failures += 1
        failed_tests.append(tf["name"] + " (failed to load)")
        print("  ERROR loading " + tf["name"] + ": " + type(load_err).__name__ + ": " + str(load_err))
        traceback.print_exc()
        continue

    test_names = [n for n in dir(mod) if n.startswith("test_") and callable(getattr(mod, n))]
    if not test_names:
        print("  (no test_* functions found)")
        continue

    for name in test_names:
        try:
            getattr(mod, name)()
            passes += 1
            print("  PASS " + name)
        except Exception as e:
            failures += 1
            failed_tests.append(tf["name"] + "::" + name)
            print("  FAIL " + name + ": " + type(e).__name__ + ": " + str(e))
            traceback.print_exc()

print("\\n=== Summary: " + str(passes) + " passed, " + str(failures) + " failed ===")

if failures > 0:
    raise AssertionError(str(failures) + " test(s) failed: " + ", ".join(failed_tests))
`;

        const result = await pyodide.runPythonAsync(runner);
        self.postMessage({ type: "success", id, result: result?.toString() });
    } catch (error: any) {
        self.postMessage({ type: "error", id, error: error.message || error.toString() });
    }
};

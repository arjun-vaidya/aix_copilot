// Pre-load the global pyodide types
declare global {
    function importScripts(...urls: string[]): void;
    function loadPyodide(options?: any): Promise<any>;
}

// Ensure the CDN is loaded into the classic worker context
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide: any = null;

async function loadEngine() {
    if (!pyodide) {
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
        });

        // Redirect stdout and stderr using the pyodide native callbacks
        pyodide.setStdout({ batched: (msg: string) => self.postMessage({ type: "stdout", text: msg }) });
        pyodide.setStderr({ batched: (msg: string) => self.postMessage({ type: "stderr", text: msg }) });
    }
}

self.onmessage = async (event: MessageEvent) => {
    const { code, id } = event.data;

    if (!pyodide) {
        self.postMessage({ type: "system", text: "Initializing Python Engine (Pyodide v0.25)..." });
        await loadEngine();
        self.postMessage({ type: "system", text: "Engine Ready. Executing simulation..." });
    }

    try {
        // Automatically fetch numeric packages like numpy, scipy, pandas if imported
        await pyodide.loadPackagesFromImports(code);

        // Execute the python string asynchronously
        const result = await pyodide.runPythonAsync(code);

        self.postMessage({ type: "success", id, result: result?.toString() });
    } catch (error: any) {
        // Send standard python tracebacks back to the frontend evaluation loop
        self.postMessage({ type: "error", id, error: error.message || error.toString() });
    }
};

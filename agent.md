# AI Agent Guidelines for AI4Numerics

All AI agents assisting in the development of this repository must strictly adhere to the following core principles:

1. **Keep It Simple & Readable**
   - Do NOT overcomplicate code logic. 
   - Write code that is straightforward, maintainable, and easy for human engineers to trace and understand. 
   - Avoid overly clever one-liners or unnecessarily deep abstractions when a simple approach suffices.

2. **Explicit & Descriptive Naming**
   - Use highly descriptive nomenclature for all files, functions, and variables.
   - **ABSOLUTELY NO one-letter variable names** (e.g., no `x`, `y`, `i`, `j` unless deeply constrained by mathematical formulas, and even then prefer descriptive contexts like `iteration_index`). 
   - File names must clearly denote their purpose.

3. **Workspace Minimalism**
   - Only create and keep files that are absolutely necessary for the application to function.
   - Do not clutter the workspace with redundant boilerplate, nested generic folders, or unused configuration files. 

4. **Align with the Product Vision**
   - Every feature must support the central mission of AI4Numerics: **Making learning with AI easier while fundamentally forcing students to reason through problems.**
   - Do not build features that automatically "do the work" for the student without incorporating guardrails (like the Gatekeeper constraints, Manual Audits, and Verification reasoning loops).
   - Prioritize UI/UX workflows that expose the physical and logic dependencies of the code being written.

5. **Mobile Responsiveness is Mandatory**
   - All UI designs must be built to function and look clean on mobile devices.
   - Fluidly wrap Flex and Grid layouts on smaller screens using Tailwind breakpoints (e.g. \`flex-col lg:flex-row\`).
   - Use responsive padding, margins, and font sizes to ensure elements are not truncated or squished off-screen.

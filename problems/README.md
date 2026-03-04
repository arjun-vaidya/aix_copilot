# Problem Definitions

This folder contains YAML problem files that instructors provide to define assignments for the AI4Numerics workspace.

## How to add a new problem

1. Copy `_template.yaml` and rename it (e.g., `problem_3.yaml`).
2. Fill in every field following the inline comments.
3. Place any associated unit test files in `frontend/public/unit_tests/`.
4. The application will eventually load these YAML files automatically.

## Current status

Problems are currently hardcoded in `frontend/src/lib/problems_mock.ts`.  
The migration to dynamic YAML loading is planned for a future release.

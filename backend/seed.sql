-- Dummy course to attach to
INSERT INTO courses (id, name, instructor_id, semester)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'APMA E4300 - Fall 2026',
    (SELECT id FROM profiles LIMIT 1), -- Needs at least one user to exist!
    'Fall 2026'
) ON CONFLICT DO NOTHING;

-- Dummy problem set mapping to problem "2"
INSERT INTO problem_sets (id, course_id, title, topic, difficulty, description, objective_placeholder, constraint_placeholder, approach_placeholder, initial_code)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Damped Harmonic Oscillator',
    'Differential Equations',
    'Intermediate',
    'Simulate a classical damped harmonic oscillator...',
    'e.g. Simulate the motion...',
    'e.g. Total energy must be conserved...',
    'e.g. I will define the second-order ODE...',
    'import numpy as np'
) ON CONFLICT DO NOTHING;

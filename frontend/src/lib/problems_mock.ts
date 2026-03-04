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

export const MOCK_PROBLEMS: Record<string, ProblemSet> = {
    "1": {
        id: "1",
        title: "1.2 Linear Regression on House Prices",
        topic: "Linear Algebra Basics",
        description: "In this problem, you will implement a simple Linear Regression model from scratch using numpy to find the line of best fit for a housing dataset. Your goal is to predict house prices based on Square Footage.",
        difficulty: "Beginner",
        objectivePlaceholder:
            "e.g. Find the line of best fit for the housing dataset...",
        constraintPlaceholder:
            "e.g. The Mean Squared Error (MSE) must be less than 500...",
        dataset: [
            {
                description:
                    "Below is a preview of house_data.csv containing 500 records of local real estate.",
                fields: [
                    { name: "Square_Footage (sq_ft)", type: "float", desc: "Size of the house in sq feet" },
                    { name: "Bedrooms", type: "int", desc: "Number of bedrooms" },
                    { name: "Price (USD)", type: "float", desc: "Target variable: sale price" },
                ],
            },
        ],
        initialCode: `# AI4Numerics Editor
# Use the Co-Pilot on the right to help write your script!

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 1. Load the dataset
df = pd.read_csv('house_data.csv')

# 2. Extract features and target
X = df['Square_Footage'].values
y = df['Price'].values

# TODO: Implement Linear Regression here...

`,
        unitTestPath: "/unit_tests/problem_1.py",
    },
    "2": {
        id: "2",
        title: "3.1 Damped Harmonic Oscillator",
        topic: "Differential Equations",
        description: "Simulate a classical damped harmonic oscillator using scipy's odeint. Model the position of a mass attached to a spring under the influence of friction over time.",
        difficulty: "Intermediate",
        objectivePlaceholder: "e.g. Simulate the motion of a spring over 10 seconds...",
        constraintPlaceholder: "e.g. Total energy must be conserved within 1% error...",
        dataset: [],
        initialCode: `# AI4Numerics Editor

import numpy as np
from scipy.integrate import odeint
import matplotlib.pyplot as plt

# Parameters
m = 1.0  # mass
k = 10.0 # spring constant
c = 0.5  # damping coefficient

# TODO: Define the ODE system and simulate
`,
        unitTestPath: "/unit_tests/problem_2.py",
    },
    "3": {
        id: "3",
        title: "2.1 CSTR Conversion Sensitivity",
        topic: "Finite-Difference Differentiation",
        description: "Estimate the temperature sensitivity of conversion dX/dT in a continuously-stirred tank reactor (CSTR) with first-order Arrhenius kinetics using the central-difference approximation. The conversion is X(T) = k(T)τ / (1 + k(T)τ), where k(T) = k₀ exp(−Eₐ/RT). Evaluate the derivative across a range of operating temperatures and validate your numerical results.",
        difficulty: "Intermediate",
        objectivePlaceholder: "e.g. Estimate the sensitivity dX/dT of a CSTR conversion using numerical differentiation...",
        constraintPlaceholder: "e.g. k₀ = 1.0e6 s⁻¹, Eₐ = 80000 J/mol, R = 8.314 J/(mol·K), τ = 2.0 s, T₀ = 300–500 K...",
        dataset: [
            {
                description:
                    "No external dataset is required. The model parameters are provided in the problem statement.",
                fields: [
                    { name: "k₀", type: "float", desc: "Pre-exponential factor (1/s)" },
                    { name: "Eₐ", type: "float", desc: "Activation energy (J/mol)" },
                    { name: "R", type: "float", desc: "Ideal gas constant (J/(mol·K))" },
                    { name: "τ", type: "float", desc: "Space time (s)" },
                    { name: "T₀", type: "float", desc: "Operating temperature range (K)" },
                ],
            },
        ],
        initialCode: `# AI4Numerics Editor
# CSTR Conversion Sensitivity via Central Differences

import numpy as np

# Given parameters
k0 = 1.0e6       # Pre-exponential factor [1/s]
Ea = 80000.0      # Activation energy [J/mol]
R  = 8.314        # Ideal gas constant [J/(mol*K)]
tau = 2.0         # Space time [s]

# Step 1: Implement k(T) — Arrhenius rate constant
def k_arrhenius(T):
    # TODO: return k0 * exp(-Ea / (R*T))
    pass

# Step 2: Implement X(T) — CSTR conversion
def X_CSTR(T):
    # TODO: return k(T)*tau / (1 + k(T)*tau)
    pass

# Step 3: Implement central-difference derivative
def central_difference(f, T_values, h):
    # TODO: return (f(T+h) - f(T-h)) / (2h)
    pass

# Step 4: Evaluate dX/dT over 300–500 K
T_grid = np.linspace(300, 500, 201)
h = 0.5  # step size [K]

# TODO: Compute X_vals and dXdT_vals using your functions above

`,
        unitTestPath: "/unit_tests/problem_3.py",
    },
};

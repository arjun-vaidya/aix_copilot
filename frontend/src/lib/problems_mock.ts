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
    },
};

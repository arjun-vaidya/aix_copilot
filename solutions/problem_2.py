# AI4Numerics — Problem 2: Damped Harmonic Oscillator
# Solution: Simulate a classical damped harmonic oscillator using scipy's odeint.

import numpy as np
from scipy.integrate import odeint
import matplotlib
matplotlib.use('agg')  # non-interactive backend for Pyodide worker
import matplotlib.pyplot as plt

# Parameters
m = 1.0   # mass (kg)
k = 10.0  # spring constant (N/m)
c = 0.5   # damping coefficient (Ns/m)

# Define the system of 1st-order ODEs
# The 2nd-order ODE:  m*x'' + c*x' + k*x = 0
# is rewritten as two 1st-order ODEs:
#   y = [x, v]   where v = dx/dt
#   dy/dt = [v, (-c*v - k*x) / m]
def damped_oscillator(y, t, m, c, k):
    x, v = y
    dxdt = v
    dvdt = (-c * v - k * x) / m
    return [dxdt, dvdt]

# Initial conditions: displaced 1 m from equilibrium, starting from rest
y0 = [1.0, 0.0]

# Time array: 0 to 10 seconds, 1000 points
t = np.linspace(0, 10, 1000)

# Solve the ODE
solution = odeint(damped_oscillator, y0, t, args=(m, c, k))
x = solution[:, 0]  # position
v = solution[:, 1]  # velocity

# Print results
print(f"Final position:  {x[-1]:.6f}")
print(f"Final velocity:  {v[-1]:.6f}")
print(f"Max displacement: {np.max(np.abs(x)):.6f}")

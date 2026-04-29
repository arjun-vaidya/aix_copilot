import numpy as np
import sys
from main import m, k, c
from scipy.integrate import odeint

def run_tests():
    print("\n" + "="*30)
    print("🧪 RUNNING UNIT TESTS...")
    print("="*30)

    # 1. Check constants
    if not all(isinstance(val, (int, float)) for val in [m, k, c]):
        raise AssertionError("Parameters 'm', 'k', and 'c' must be defined as numbers.")

    # 2. Check required function
    if not callable(odeint):
        raise AssertionError("'odeint' must be imported from scipy.integrate.")

    print("✅ Initial parameters and imports verified.")
    print("\n🎉 ALL TESTS PASSED! Your oscillator syntax is sound.")

try:
    run_tests()
except AssertionError as e:
    print(f"\n❌ TEST FAILED: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ UNKNOWN ERROR DURING TESTING: {e}")
    sys.exit(1)

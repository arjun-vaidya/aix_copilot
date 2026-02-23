import numpy as np
import sys

def run_tests():
    print("\n" + "="*30)
    print("🧪 RUNNING UNIT TESTS...")
    print("="*30)
    
    # 1. Check constants
    if 'm' not in globals() or 'k' not in globals() or 'c' not in globals():
        raise AssertionError("Parameters 'm', 'k', and 'c' must remain defined.")
        
    # 2. Check required module imports
    if 'odeint' not in globals():
        raise AssertionError("You must import 'odeint' from scipy.integrate to solve the system.")

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

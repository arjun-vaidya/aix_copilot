import numpy as np
import sys
from main import X, y, m, b

def run_tests():
    print("\n" + "="*30)
    print("🧪 RUNNING UNIT TESTS...")
    print("="*30)

    # 1. Check data extraction
    if len(X) == 0 or len(y) == 0:
        raise AssertionError("X and y arrays must not be empty.")

    if len(X) != len(y):
        raise AssertionError("X and y must have the exact same length to perform Linear Regression.")

    print("✅ Data validation: X and y correctly extracted.")

    # 2. Check for slope and intercept calculations
    if not isinstance(m, (int, float)) or not isinstance(b, (int, float)):
        raise AssertionError("Variables 'm' (slope) and 'b' (intercept) must be defined as numbers.")

    # Calculate truth using numpy
    m_actual, b_actual = np.polyfit(X, y, 1)

    # 10% tolerance is generous for mathematical drift based on their calculation algorithm
    if not np.isclose(m, m_actual, rtol=0.1):
        raise AssertionError(f"Slope (m) is mathematically incorrect. Expected ~{m_actual:.4f}, but got {m}")

    if not np.isclose(b, b_actual, rtol=0.1):
        raise AssertionError(f"Intercept (b) is mathematically incorrect. Expected ~{b_actual:.4f}, but got {b}")

    print("✅ Model validation: Slope (m) and Intercept (b) are accurate.")
    print("\n🎉 ALL TESTS PASSED! Your Linear Regression model is physically sound.")

try:
    run_tests()
except AssertionError as e:
    print(f"\n❌ TEST FAILED: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ UNKNOWN ERROR DURING TESTING: {e}")
    sys.exit(1)

import numpy as np
import sys

def run_tests():
    print("\n" + "="*30)
    print("🧪 RUNNING UNIT TESTS...")
    print("="*30)
    
    # 1. Check data extraction
    if 'X' not in globals() or 'y' not in globals():
        raise AssertionError("Variables 'X' and 'y' must be defined in the global scope.")
    
    X_student = globals()['X']
    y_student = globals()['y']
    
    if len(X_student) == 0 or len(y_student) == 0:
        raise AssertionError("X and y arrays must not be empty.")
        
    if len(X_student) != len(y_student):
        raise AssertionError("X and y must have the exact same length to perform Linear Regression.")

    print("✅ Data validation: X and y correctly extracted.")

    # 2. Check for slope and intercept calculations
    # We expect the student to define variables 'm' and 'b' for their line equation.
    if 'm' not in globals() or 'b' not in globals():
        raise AssertionError("You must define the variables 'm' (slope) and 'b' (intercept) for your model.")

    m_student = globals()['m']
    b_student = globals()['b']

    # Calculate truth using numpy
    m_actual, b_actual = np.polyfit(X_student, y_student, 1)

    # 10% tolerance is generous for mathematical drift based on their calculation algorithm
    if not np.isclose(m_student, m_actual, rtol=0.1):
        raise AssertionError(f"Slope (m) is mathematically incorrect. Expected ~{m_actual:.4f}, but got {m_student}")
        
    if not np.isclose(b_student, b_actual, rtol=0.1):
        raise AssertionError(f"Intercept (b) is mathematically incorrect. Expected ~{b_actual:.4f}, but got {b_student}")

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

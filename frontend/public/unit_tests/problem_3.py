import numpy as np
import sys

def run_tests():
    print("\n" + "="*30)
    print("🧪 RUNNING UNIT TESTS...")
    print("="*30)

    # 1. Check that the core functions are defined
    if 'k_arrhenius' not in globals() or not callable(globals()['k_arrhenius']):
        raise AssertionError("You must define a callable function 'k_arrhenius(T)'.")

    if 'X_CSTR' not in globals() or not callable(globals()['X_CSTR']):
        raise AssertionError("You must define a callable function 'X_CSTR(T)'.")

    if 'central_difference' not in globals() or not callable(globals()['central_difference']):
        raise AssertionError("You must define a callable function 'central_difference(f, T_values, h)'.")

    print("✅ Function definitions verified.")

    k_arrhenius = globals()['k_arrhenius']
    X_CSTR = globals()['X_CSTR']
    central_difference = globals()['central_difference']

    # 2. Validate k(T) at a known temperature
    # k(400) = 1e6 * exp(-80000 / (8.314 * 400))
    k_expected = 1.0e6 * np.exp(-80000.0 / (8.314 * 400.0))
    k_result = k_arrhenius(400.0)
    if k_result is None:
        raise AssertionError("k_arrhenius(400.0) returned None. Did you forget to return a value?")
    if not np.isclose(k_result, k_expected, rtol=0.01):
        raise AssertionError(f"k_arrhenius(400.0) is incorrect. Expected ~{k_expected:.6e}, got {k_result:.6e}")

    print("✅ k_arrhenius(T) returns correct values.")

    # 3. Validate X(T) at T=400 K
    kt = k_expected * 2.0
    X_expected = kt / (1.0 + kt)
    X_result = X_CSTR(400.0)
    if X_result is None:
        raise AssertionError("X_CSTR(400.0) returned None. Did you forget to return a value?")
    if not np.isclose(X_result, X_expected, rtol=0.01):
        raise AssertionError(f"X_CSTR(400.0) is incorrect. Expected ~{X_expected:.6f}, got {X_result:.6f}")

    print("✅ X_CSTR(T) returns correct conversion values.")

    # 4. Validate central_difference on a simple quadratic f(x) = x^2 => f'(x) = 2x
    test_f = lambda x: x**2
    test_T = np.array([3.0])
    test_h = 0.001
    cd_result = central_difference(test_f, test_T, test_h)
    if cd_result is None:
        raise AssertionError("central_difference() returned None. Did you forget to return a value?")
    cd_val = np.asarray(cd_result).flatten()[0]
    if not np.isclose(cd_val, 6.0, rtol=0.01):
        raise AssertionError(f"central_difference on f(x)=x² at x=3 should give ~6.0, got {cd_val:.6f}")

    print("✅ central_difference() is numerically accurate.")

    # 5. Check that dX/dT is positive across the temperature range (physical consistency)
    if 'dXdT_vals' not in globals():
        raise AssertionError("You must compute 'dXdT_vals' — the array of dX/dT values over T_grid.")

    dXdT_vals = globals()['dXdT_vals']
    if dXdT_vals is None or len(dXdT_vals) == 0:
        raise AssertionError("dXdT_vals must be a non-empty array.")

    if not np.all(np.asarray(dXdT_vals) >= 0):
        raise AssertionError("Physical check failed: dX/dT should be non-negative (conversion increases with T).")

    print("✅ Physical consistency: dX/dT ≥ 0 across the temperature range.")
    print("\n🎉 ALL TESTS PASSED! Your CSTR sensitivity analysis is correct.")

try:
    run_tests()
except AssertionError as e:
    print(f"\n❌ TEST FAILED: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ UNKNOWN ERROR DURING TESTING: {e}")
    sys.exit(1)

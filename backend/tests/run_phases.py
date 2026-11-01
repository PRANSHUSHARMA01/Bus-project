import sys
import inspect
from pathlib import Path

tests_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(tests_dir.parent))
sys.path.insert(0, str(tests_dir))

test_files = [
    "test_phase_a",
    "test_phase_b_auth",
    "test_phase_c_profile_realtime",
    "test_phase_d_conductor",
    "test_phase_e_design_system",
    "test_phase_f_anatomy",
    "test_phase_g_safety_sos",
]

total_passed = 0
total_failed = 0
failed_tests = []

for mod_name in test_files:
    print(f"=== {mod_name} ===")
    try:
        mod = __import__(mod_name)
    except Exception as e:
        print(f"  [ERROR] Could not import {mod_name}: {e}")
        total_failed += 1
        failed_tests.append((mod_name, str(e)))
        continue

    test_funcs = [
        (name, fn) for name, fn in inspect.getmembers(mod, inspect.isfunction)
        if name.startswith("test_")
    ]
    test_funcs.sort(key=lambda x: x[0])

    for name, fn in test_funcs:
        try:
            fn()
            print(f"  [PASS] {name}")
            total_passed += 1
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")
            total_failed += 1
            failed_tests.append((f"{mod_name}.{name}", str(e)))

print("\n" + "=" * 50)
print(f"SUMMARY: {total_passed} PASSED, {total_failed} FAILED")
if total_failed > 0:
    print("Failures:")
    for t, err in failed_tests:
        print(f"  - {t}: {err}")
    sys.exit(1)
else:
    print(">>> ALL TESTS PASSED! <<<")

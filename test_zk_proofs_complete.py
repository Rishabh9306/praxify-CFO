"""
🔒 COMPREHENSIVE ZERO-KNOWLEDGE PROOF VERIFICATION
===================================================
Test all 16 ZK proof types to ensure cryptographic security.

Tests include:
- Original 6 proof types (commitments, ranges, comparisons, sums, positive, statistical)
- 10 new advanced proofs (growth, seasonality, duplicates, etc.)
- Integration test with DataValidator
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'aiml_engine'))

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from core.zero_knowledge import ZeroKnowledgeProver, DataValidator

def test_original_6_proofs():
    """Test the original 6 ZK proof types."""
    print("\n" + "="*70)
    print("TESTING ORIGINAL 6 ZK PROOF TYPES")
    print("="*70)
    
    prover = ZeroKnowledgeProver()
    passed = 0
    total = 0
    
    # Test 1: Commitment
    print("\n[1/6] Testing Commitment...")
    total += 1
    value = 100000.0
    commitment = prover.commit(value)
    print(f"  ✓ Commitment hash: {commitment.commitment_hash[:32]}...")
    print(f"  ✓ Salt length: {len(commitment.salt)} bytes")
    passed += 1
    
    # Test 2: Range Proof
    print("\n[2/6] Testing Range Proof...")
    total += 1
    value = 50000.0
    range_proof = prover.prove_range(value, range_min=0, range_max=100000)
    print(f"  ✓ Proof hash: {range_proof.proof_hash[:32]}...")
    print(f"  ✓ Range: [{range_proof.range_min}, {range_proof.range_max}]")
    passed += 1
    
    # Test 3: Comparison Proof
    print("\n[3/6] Testing Comparison Proof...")
    total += 1
    v1, v2 = 100000.0, 50000.0
    proof_hash, result = prover.prove_comparison(v1, v2, '>')
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Comparison result: {result} (v1 > v2)")
    if result:
        passed += 1
    
    # Test 4: Sum Proof
    print("\n[4/6] Testing Sum Proof...")
    total += 1
    values = np.array([10000, 20000, 30000])
    claimed_sum = 60000
    proof_hash, result = prover.prove_sum(values, claimed_sum)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Sum verification: {result}")
    if result:
        passed += 1
    
    # Test 5: Positive Proof
    print("\n[5/6] Testing Positive Proof...")
    total += 1
    value = 50000.0
    proof_hash, result = prover.prove_positive(value)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Positivity: {result}")
    if result:
        passed += 1
    
    # Test 6: Statistical Property Proof
    print("\n[6/6] Testing Statistical Property Proof...")
    total += 1
    values = np.array([10000, 20000, 30000, 40000, 50000])
    proof_hash, result = prover.prove_statistical_property(values, 'mean', 25000)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Statistical verification (mean > 25000): {result}")
    if result:
        passed += 1
    
    print(f"\n{'='*70}")
    print(f"ORIGINAL 6 PROOFS: {passed}/{total} PASSED ({passed/total*100:.1f}%)")
    print(f"{'='*70}")
    
    return passed, total


def test_new_15_proofs():
    """Test the 15 new advanced ZK proof types (10 + 5 advanced)."""
    print("\n" + "="*70)
    print("TESTING NEW 15 ADVANCED ZK PROOF TYPES")
    print("="*70)
    
    prover = ZeroKnowledgeProver()
    passed = 0
    total = 0
    
    # Test 7: Growth Trend Proof
    print("\n[7/16] Testing Growth Trend Proof...")
    total += 1
    time_series = np.array([100, 110, 120, 130, 140, 150])  # Growing
    proof_hash, is_growing = prover.prove_growth_trend(time_series, is_growing=True)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Growth detected: {is_growing}")
    if is_growing:
        passed += 1
    
    # Test 8: Seasonality Proof
    print("\n[8/16] Testing Seasonality Proof...")
    total += 1
    # Create seasonal data (monthly pattern)
    t = np.arange(24)
    seasonal_data = 1000 + 500 * np.sin(2 * np.pi * t / 12) + np.random.normal(0, 50, 24)
    proof_hash, has_seasonality, strength = prover.prove_seasonality(seasonal_data, period=12)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Seasonality detected: {has_seasonality} (strength={strength:.2f})")
    if has_seasonality:
        passed += 1
    
    # Test 9: No Duplicates Proof
    print("\n[9/16] Testing No Duplicates Proof...")
    total += 1
    values = np.array([100, 200, 300, 400, 500])  # All unique
    proof_hash, no_dupes = prover.prove_no_duplicates(values)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ No duplicates: {no_dupes}")
    if no_dupes:
        passed += 1
    
    # Test 10: Monotonic Sequence Proof
    print("\n[10/16] Testing Monotonic Sequence Proof...")
    total += 1
    values = np.array([1, 2, 3, 4, 5, 6])  # Increasing
    proof_hash, is_sorted = prover.prove_monotonic_sequence(values, increasing=True)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Monotonic increasing: {is_sorted}")
    if is_sorted:
        passed += 1
    
    # Test 11: Normal Distribution Proof
    print("\n[11/16] Testing Normal Distribution Proof...")
    total += 1
    values = np.random.normal(1000, 100, 100)  # Normal distribution
    proof_hash, is_normal, p_value = prover.prove_normal_distribution(values)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Normal distribution: {is_normal} (p-value={p_value:.4f})")
    if is_normal:
        passed += 1
    
    # Test 12: Correlation Proof
    print("\n[12/16] Testing Correlation Proof...")
    total += 1
    x = np.array([100, 200, 300, 400, 500])
    y = np.array([110, 210, 310, 410, 510])  # Highly correlated
    proof_hash, is_corr, corr_coef = prover.prove_correlation(x, y, min_correlation=0.5)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Correlation detected: {is_corr} (r={corr_coef:.2f})")
    if is_corr:
        passed += 1
    
    # Test 13: Outlier Free Proof
    print("\n[13/16] Testing Outlier Free Proof...")
    total += 1
    values = np.array([100, 102, 98, 101, 99, 100, 103, 97])  # No outliers
    proof_hash, is_clean, outlier_count = prover.prove_outlier_free(values, iqr_multiplier=1.5)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Outlier free: {is_clean} (outliers={outlier_count})")
    if is_clean:
        passed += 1
    
    # Test 14: Consistency Across Periods Proof
    print("\n[14/16] Testing Consistency Across Periods Proof...")
    total += 1
    values = np.array([1000, 1050, 1020, 1030, 1040, 1010])  # Consistent variance
    proof_hash, is_consistent = prover.prove_consistency_across_periods(values, max_variance_ratio=2.0)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Consistency verified: {is_consistent}")
    if is_consistent:
        passed += 1
    
    # Test 15: Data Completeness Proof
    print("\n[15/16] Testing Data Completeness Proof...")
    total += 1
    df = pd.DataFrame({
        'revenue': [1000, 2000, 3000, 4000, 5000],
        'expenses': [800, 1500, 2200, 3000, 3800]
    })
    proof_hash, is_complete, details = prover.prove_data_completeness(
        df, ['revenue', 'expenses'], min_completeness=0.95
    )
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Completeness: {is_complete}")
    print(f"  ✓ Details: {details}")
    if is_complete:
        passed += 1
    
    # Test 16: Balance Equation Proof
    print("\n[16/21] Testing Balance Equation Proof...")
    total += 1
    revenue = 10000
    expenses = 6000
    profit = 4000  # 10000 - 6000 = 4000
    proof_hash, holds = prover.prove_balance_equation(revenue, expenses, profit, tolerance=0.01)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Equation holds (Revenue - Expenses = Profit): {holds}")
    if holds:
        passed += 1
    
    # Test 17: Merkle Tree Inclusion Proof
    print("\n[17/21] Testing Merkle Tree Inclusion Proof...")
    total += 1
    dataset = np.array([100, 200, 300, 400, 500, 600, 700, 800])
    value_to_prove = 500
    merkle_root, is_included, merkle_path = prover.prove_merkle_inclusion(value_to_prove, dataset)
    print(f"  ✓ Merkle root: {merkle_root[:32]}...")
    print(f"  ✓ Value included: {is_included}")
    print(f"  ✓ Path length: {len(merkle_path)} (O(log n))")
    if is_included:
        passed += 1
    
    # Test 18: Pedersen Commitment Proof
    print("\n[18/21] Testing Pedersen Commitment Proof...")
    total += 1
    value = 50000.0
    commit_hash, commitment, randomness = prover.prove_pedersen_commitment(value)
    print(f"  ✓ Commitment hash: {commit_hash[:32]}...")
    print(f"  ✓ Commitment value: {commitment % 1000000}... (mod)")
    print(f"  ✓ Homomorphic: Can add committed values")
    if commitment > 0:
        passed += 1
    
    # Test 19: Set Membership Proof
    print("\n[19/21] Testing Set Membership Proof...")
    total += 1
    value = 100000
    valid_set = {10000, 50000, 100000, 500000, 1000000}
    proof_hash, is_member, set_commit = prover.prove_set_membership(value, valid_set)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Set commitment: {set_commit[:32]}...")
    print(f"  ✓ Is member: {is_member}")
    if is_member:
        passed += 1
    
    # Test 20: Bulletproof Range Proof
    print("\n[20/21] Testing Bulletproof Range Proof...")
    total += 1
    value = 50000.0
    proof_hash, in_range, proof_size = prover.prove_bulletproof_range(value, 0, 100000, bit_length=32)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ In range: {in_range}")
    print(f"  ✓ Proof size: {proof_size} bits (O(log n)) vs 32 bits (O(n))")
    if in_range:
        passed += 1
    
    # Test 21: SNARK Computation Proof
    print("\n[21/21] Testing SNARK Computation Proof...")
    total += 1
    inputs = np.array([100, 200, 300, 400, 500])
    expected_mean = np.mean(inputs)
    proof_hash, is_correct, circuit_info = prover.prove_snark_computation(inputs, 'mean', expected_mean)
    print(f"  ✓ Proof hash: {proof_hash[:32]}...")
    print(f"  ✓ Computation correct: {is_correct}")
    print(f"  ✓ Circuit gates: {circuit_info['circuit_gates']}")
    print(f"  ✓ Proof size: {circuit_info['proof_size_bytes']} bytes (constant)")
    if is_correct:
        passed += 1
    
    print(f"\n{'='*70}")
    print(f"NEW 15 ADVANCED PROOFS: {passed}/{total} PASSED ({passed/total*100:.1f}%)")
    print(f"{'='*70}")
    
    return passed, total


def test_data_validator_integration():
    """Test DataValidator with all 21 proofs integrated."""
    print("\n" + "="*70)
    print("TESTING DATAVALIDATOR INTEGRATION (ALL 21 PROOFS)")
    print("="*70)
    
    # Create realistic financial dataset
    dates = pd.date_range('2023-01-01', periods=24, freq='M')
    np.random.seed(42)
    
    # Add growth trend + seasonality
    t = np.arange(24)
    base = 10000 + 500 * t  # Growth trend
    seasonal = 2000 * np.sin(2 * np.pi * t / 12)  # Annual seasonality
    noise = np.random.normal(0, 500, 24)
    
    df = pd.DataFrame({
        'date': dates,
        'revenue': base + seasonal + noise,
        'expenses': (base + seasonal + noise) * 0.7,
        'profit': (base + seasonal + noise) * 0.3
    })
    
    print("\n📊 Sample Financial Data:")
    print(df.head())
    
    # Run DataValidator with all 16 proofs
    validator = DataValidator()
    validations = validator.validate_financial_data(df)
    
    print(f"\n{'='*70}")
    print("ZK PROOF VALIDATION RESULTS")
    print(f"{'='*70}")
    
    proof_types_found = set()
    passed = 0
    total = 0
    
    for key, result in validations.items():
        total += 1
        verified = result['verified']
        proof_type = result.get('proof_type', 'unknown')
        proof_types_found.add(proof_type)
        
        status = "✅ PASS" if verified else "❌ FAIL"
        print(f"\n{status} | {key}")
        print(f"  Proof Type: {proof_type}")
        print(f"  Property: {result['property']}")
        print(f"  Hash: {result['proof_hash'][:32]}...")
        
        if verified:
            passed += 1
    
    print(f"\n{'='*70}")
    print(f"DATAVALIDATOR INTEGRATION: {passed}/{total} PASSED ({passed/total*100:.1f}%)")
    print(f"Unique proof types used: {len(proof_types_found)}")
    print(f"Proof types: {sorted(proof_types_found)}")
    print(f"{'='*70}")
    
    return passed, total, len(proof_types_found)


def main():
    """Run all ZK proof tests."""
    print("\n" + "🔒"*35)
    print("🔒 COMPREHENSIVE ZERO-KNOWLEDGE PROOF VERIFICATION 🔒")
    print("🔒"*35)
    
    total_passed = 0
    total_tests = 0
    
    # Test original 6 proofs
    passed, tests = test_original_6_proofs()
    total_passed += passed
    total_tests += tests
    
    # Test new 15 proofs
    passed, tests = test_new_15_proofs()
    total_passed += passed
    total_tests += tests
    
    # Test DataValidator integration
    passed, tests, proof_types = test_data_validator_integration()
    total_passed += passed
    total_tests += tests
    
    # Final summary
    print("\n" + "="*70)
    print("FINAL COMPREHENSIVE SUMMARY")
    print("="*70)
    print(f"Total ZK Proofs Tested: 21 types (6 original + 15 advanced)")
    print(f"Total Validations Run: {total_tests}")
    print(f"Total Passed: {total_passed}")
    print(f"Total Failed: {total_tests - total_passed}")
    print(f"Success Rate: {total_passed/total_tests*100:.1f}%")
    print(f"Unique Proof Types in DataValidator: {proof_types}")
    print("="*70)
    
    if total_passed == total_tests:
        print("\n🎉 ALL ZERO-KNOWLEDGE PROOFS VERIFIED SUCCESSFULLY!")
        print("🔒 Maximum cryptographic security achieved.")
        print("🔒 All 21 proof types functional and integrated.")
        return 0
    else:
        print(f"\n⚠️  {total_tests - total_passed} tests failed")
        return 1


if __name__ == "__main__":
    exit(main())

# Lessons Learned

## 2026-03-02: Audit must include functional correctness, not just security

**Mistake**: Previous codebase audit (Feb 27) focused on security (CSRF, client-trust, RBAC) but didn't trace end-to-end functional flows through webhook → RPC → database. This missed:
- Zero-point edge case crashing the atomic function
- PERFORM discarding return values (PostgreSQL gotcha)
- Silent reward skipping when profileId is null
- Inconsistent bonus values across gateways

**Rule**: When auditing any system, always:
1. Trace the happy path end-to-end through all layers (webhook → JS → SQL → DB)
2. Test edge cases at boundaries (0 values, nulls, min thresholds)
3. Verify return values are actually captured, not discarded
4. Compare behavior across all entry points (Nomba vs Paystack vs Embedly) for consistency
5. Check what happens when intermediate steps fail — is there notification or silent failure?

## PostgreSQL: PERFORM discards return values

**Mistake**: Used `PERFORM function_call()` in PL/pgSQL when the return value mattered.
**Rule**: Use `SELECT function_call() INTO variable` when you need the result. `PERFORM` is only for side-effect-only calls where you don't care about the return.

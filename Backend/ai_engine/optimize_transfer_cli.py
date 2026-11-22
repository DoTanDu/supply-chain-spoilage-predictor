# -*- coding: utf-8 -*-
"""
Google OR-Tools MILP Optimizer CLI cho bài toán Điều phối Hàng hóa Liên Chi nhánh (AI 3).
Đọc JSON từ stdin ({ "products": [...] }), giải bài toán Quy hoạch Tuyến tính Nguyên Hỗn hợp (MILP)
với SCIP (fallback CBC) nhằm tối đa hóa giá trị hàng hóa được cứu + ưu tiên FEFO, và xuất JSON ra stdout.
"""

import sys
import json
import ortools
from ortools.linear_solver import pywraplp


def solve_product_transfers(prod):
    product_id = int(prod.get("productId", 0))
    unit_cost = float(prod.get("unitCost", 0.0))
    min_qty = int(prod.get("minTransferQty", 6))
    surplus_batches = prod.get("surplusBatches") or []
    deficit_stores = prod.get("deficitStores") or []

    if not surplus_batches or not deficit_stores:
        return []

    solver = pywraplp.Solver.CreateSolver("SCIP")
    solver_used = "SCIP"
    if not solver:
        solver = pywraplp.Solver.CreateSolver("CBC")
        solver_used = "CBC"
    if not solver:
        raise RuntimeError("Không thể khởi tạo Google OR-Tools solver (SCIP/CBC).")

    solver.SetTimeLimit(2000)

    x = {}
    y = {}

    for bi, b in enumerate(surplus_batches):
        b_store = int(b.get("storeId", 0))
        b_qty = int(b.get("batchQty", 0))
        b_store_surplus = int(b.get("maxStoreSurplus", 0))
        if b_qty < min_qty or b_store_surplus < min_qty:
            continue

        for di, d in enumerate(deficit_stores):
            d_store = int(d.get("storeId", 0))
            d_need = int(d.get("deficitQty", 0))
            if b_store == d_store or d_need < min_qty:
                continue

            cap = min(b_qty, b_store_surplus, d_need)
            if cap < min_qty:
                continue

            x[(bi, di)] = solver.IntVar(0, cap, f"x_{bi}_{di}")
            y[(bi, di)] = solver.BoolVar(f"y_{bi}_{di}")
            solver.Add(x[(bi, di)] <= cap * y[(bi, di)])
            solver.Add(x[(bi, di)] >= min_qty * y[(bi, di)])

    if not x:
        return []

    # Ràng buộc 1: Không vượt tồn kho của từng lô nguồn
    for bi, b in enumerate(surplus_batches):
        vars_for_b = [x[(bi, di)] for di in range(len(deficit_stores)) if (bi, di) in x]
        if vars_for_b:
            solver.Add(sum(vars_for_b) <= int(b.get("batchQty", 0)))

    # Ràng buộc 2: Tổng lượng xuất đi từ mỗi chi nhánh dư không vượt quá lượng dư của chi nhánh đó
    store_surplus_map = {}
    store_batches_idx = {}
    for bi, b in enumerate(surplus_batches):
        sid = int(b.get("storeId", 0))
        store_surplus_map[sid] = int(b.get("maxStoreSurplus", 0))
        store_batches_idx.setdefault(sid, []).append(bi)

    for sid, b_indices in store_batches_idx.items():
        vars_for_store = [
            x[(bi, di)]
            for bi in b_indices
            for di in range(len(deficit_stores))
            if (bi, di) in x
        ]
        if vars_for_store:
            solver.Add(sum(vars_for_store) <= store_surplus_map[sid])

    # Ràng buộc 3: Tổng lượng nhận vào của mỗi chi nhánh thiếu không vượt quá lượng thiếu
    for di, d in enumerate(deficit_stores):
        vars_for_d = [x[(bi, di)] for bi in range(len(surplus_batches)) if (bi, di) in x]
        if vars_for_d:
            solver.Add(sum(vars_for_d) <= int(d.get("deficitQty", 0)))

    # Hàm mục tiêu: Tối đa hóa giá trị cứu hàng + hệ số ưu tiên FEFO lô cận date (daysLeft nhỏ)
    objective = solver.Objective()
    eff_cost = unit_cost if unit_cost > 0 else 10000.0
    for (bi, di), x_var in x.items():
        b = surplus_batches[bi]
        d = deficit_stores[di]
        days_left = max(1, int(b.get("daysLeft", 7)))
        fefo_bonus = eff_cost * 0.05 / float(days_left)
        shipping_cost = float(d.get("shippingCost", b.get("shippingCost", 0.0)))
        objective.SetCoefficient(x_var, eff_cost + fefo_bonus)
        if shipping_cost > 0:
            objective.SetCoefficient(y[(bi, di)], -shipping_cost)
    objective.SetMaximization()

    status = solver.Solve()
    if status not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        return []

    proposals = []
    for (bi, di), x_var in x.items():
        qty = int(round(x_var.solution_value()))
        if qty >= min_qty:
            b = surplus_batches[bi]
            d = deficit_stores[di]
            shipping_cost = float(d.get("shippingCost", b.get("shippingCost", 0.0)))
            saved_value = round(qty * unit_cost)
            proposals.append({
                "productId": product_id,
                "fromStoreId": int(b["storeId"]),
                "fromStoreCode": b.get("storeCode", ""),
                "fromStoreName": b.get("storeName", ""),
                "toStoreId": int(d["storeId"]),
                "toStoreCode": d.get("storeCode", ""),
                "toStoreName": d.get("storeName", ""),
                "sourceBatchId": int(b["batchId"]),
                "sourceBatchCode": b.get("batchCode", ""),
                "sourceBatchDaysLeft": int(b.get("daysLeft", 0)),
                "transferQuantity": qty,
                "shippingCost": shipping_cost,
                "savedSpoilageValue": saved_value,
                "netFinancialBenefit": saved_value - shipping_cost,
                "solverBackend": solver_used
            })

    proposals.sort(key=lambda p: (p["sourceBatchDaysLeft"], -p["transferQuantity"]))
    return proposals


def main():
    raw_stdin = sys.stdin.read()
    if not raw_stdin.strip():
        print(json.dumps({"success": False, "message": "Empty JSON payload for OR-Tools optimizer"}))
        sys.exit(1)

    payload = json.loads(raw_stdin)
    products = payload.get("products") or []
    proposals_by_product = {}
    solver_used = "SCIP"

    for prod in products:
        pid_key = str(prod.get("productId", ""))
        sol = solve_product_transfers(prod)
        if sol:
            solver_used = sol[0].get("solverBackend", solver_used)
        proposals_by_product[pid_key] = sol

    out = {
        "success": True,
        "optimizerEngine": f"Google-OR-Tools-MILP ({solver_used})",
        "ortoolsVersion": getattr(ortools, "__version__", "unknown"),
        "proposalsByProduct": proposals_by_product
    }
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()

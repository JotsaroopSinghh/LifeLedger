"""
Core Monte Carlo simulation engine for LifeLedger.

Each path updates cash, investments, debt, income, and expenses month-by-month.
A path becomes insolvent when it cannot cover expenses or a required debt payment
even after liquidating its investments.
"""

import numpy as np
from .models import SimulationRequest, MonteCarloSummary


def annual_to_monthly_rate(annual: float) -> float:
    """Convert an annual compound rate to its equivalent monthly rate."""
    return (1.0 + annual) ** (1.0 / 12.0) - 1.0


def run_monte_carlo(req: SimulationRequest) -> MonteCarloSummary:
    p = req.profile
    a = req.assumptions
    mc = req.monte_carlo

    months_total = a.years * 12

    mu_m = annual_to_monthly_rate(a.annual_return)
    sigma_m = mc.return_volatility_annual / np.sqrt(12.0)
    r_income_m = annual_to_monthly_rate(a.annual_income_growth)
    r_infl_m = annual_to_monthly_rate(a.annual_inflation)
    r_debt_m = annual_to_monthly_rate(a.annual_debt_interest)

    rng = np.random.default_rng(mc.seed)

    insolvency_months = []
    finals = []

    for _ in range(mc.simulations):
        cash = float(p.start_cash)
        inv = float(p.start_investments)
        debt = float(p.start_debt)

        income = float(p.monthly_income)
        rent = float(p.rent)
        groceries = float(p.groceries)
        transport = float(p.transport)
        subs = float(p.subscriptions)
        misc = float(p.misc)

        insolvent = False

        for month in range(1, months_total + 1):
            cash += income
            cash -= rent + groceries + transport + subs + misc

            # Sell investments when cash cannot cover expenses.
            if cash < 0:
                needed = -cash
                sell = min(inv, needed)
                inv -= sell
                cash += sell

                if cash < 0:
                    insolvent = True
                    insolvency_months.append(month)
                    break

            if debt > 0:
                debt *= 1.0 + r_debt_m

            required_payment = min(a.monthly_debt_payment, debt) if debt > 0 else 0.0

            if required_payment > 0:
                if cash < required_payment:
                    needed = required_payment - cash
                    sell = min(inv, needed)
                    inv -= sell
                    cash += sell

                if cash < required_payment:
                    insolvent = True
                    insolvency_months.append(month)
                    break

                cash -= required_payment
                debt -= required_payment

            if cash > 0:
                invest_amt = cash * a.invest_rate
                cash -= invest_amt
                inv += invest_amt

            # A monthly loss cannot exceed the full investment balance.
            monthly_return = max(float(rng.normal(mu_m, sigma_m)), -1.0)
            if inv > 0:
                inv *= 1.0 + monthly_return

            income *= 1.0 + r_income_m
            rent *= 1.0 + r_infl_m
            groceries *= 1.0 + r_infl_m
            transport *= 1.0 + r_infl_m
            subs *= 1.0 + r_infl_m
            misc *= 1.0 + r_infl_m

        if not insolvent:
            finals.append(cash + inv - debt)

    insolvent_paths = len(insolvency_months)
    surviving_paths = len(finals)
    p_insolvency = insolvent_paths / mc.simulations

    if surviving_paths:
        finals_array = np.array(finals, dtype=float)
        p10 = round(float(np.percentile(finals_array, 10)), 2)
        median = round(float(np.percentile(finals_array, 50)), 2)
        p90 = round(float(np.percentile(finals_array, 90)), 2)
    else:
        p10 = None
        median = None
        p90 = None

    median_insolvency_month = (
        round(float(np.median(insolvency_months)), 1) if insolvency_months else None
    )

    return MonteCarloSummary(
        probability_of_insolvency=round(p_insolvency, 4),
        final_net_worth_p10=p10,
        final_net_worth_median=median,
        final_net_worth_p90=p90,
        insolvent_paths=insolvent_paths,
        surviving_paths=surviving_paths,
        median_time_to_insolvency_months=median_insolvency_month,
    )

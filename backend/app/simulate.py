"""
simulate.py

Core simulation engine for LifeLedger.

This module implements two modes:
1) Deterministic simulation:
   - Uses fixed monthly growth rates (no randomness).
   - Produces a time-series of cash, investments, debt, and net worth.

2) Monte Carlo simulation:
   - Runs many independent simulations (N paths).
   - Adds randomness to investment returns each month.
   - Reports distribution summaries and the key risk metric: Probability of Insolvency.

Key definitions:
- Net worth = cash + investments - debt
- Insolvency event occurs if you fail either:
  (1) to cover monthly expenses even after liquidating investments, OR
  (2) to make the required monthly debt payment in full even after liquidating investments.
"""


import numpy as np
from .models import SimulationRequest, SimulationResult, MonteCarloSummary



def annual_to_monthly_rate(annual: float) -> float:
    """We convert the annual compound rate to monthly compound rate
    Math:
        (1 + r_annual) = (1 + r_month) ^ 12
        => r_month = (1 + r_annual)^(1/12) - 1"""
    return (1.0 + annual) ** (1.0 / 12.0) - 1.0


def run_deterministic(req: SimulationRequest) -> SimulationResult:
    p = req.profile
    a = req.assumptions

    months_total = a.years * 12
    r_return_m = annual_to_monthly_rate(a.annual_return)
    r_income_m = annual_to_monthly_rate(a.annual_income_growth)
    r_infl_m = annual_to_monthly_rate(a.annual_inflation)
    r_debt_m = annual_to_monthly_rate(a.annual_debt_interest)

    cash = float(p.start_cash)
    inv = float(p.start_investments)
    debt = float(p.start_debt)

    income = float(p.monthly_income)
    rent = float(p.rent)
    groceries = float(p.groceries)
    transport = float(p.transport)
    subs = float(p.subscriptions)
    misc = float(p.misc)

    months = []
    cash_series = []
    inv_series = []
    debt_series = []
    nw_series = []

    for m in range(1, months_total + 1):
        cash += income
        total_expenses = rent + groceries + transport + subs + misc
        cash -= total_expenses

        if cash < 0:
            needed = -cash
            sell = min(inv, needed)
            inv -= sell
            cash += sell

            # Still negative after liquidating all investments -> insolvency
            if cash < 0:
                break
        if debt > 0:
            debt *= (1.0 + r_debt_m)

        required_payment = min(a.monthly_debt_payment, debt) if debt > 0 else 0.0

        if required_payment > 0:
            if cash < required_payment:
                # Try liquidating investments to cover the payment shortfall
                needed = required_payment - cash
                sell = min(inv, needed)
                inv -= sell
                cash += sell

            # Still can't pay in full -> insolvency event
            if cash < required_payment:
                break

            cash -= required_payment
            debt -= required_payment


        # 6) Invest savings
        if cash > 0:
            invest_amount = cash * a.invest_rate
            cash -= invest_amount
            inv += invest_amount

        # 7) Investments interest
        if inv > 0:
            inv *= (1.0 + r_return_m)

        # 8) Update the world (income rises, expenses inflate)
        income *= (1.0 + r_income_m)
        rent *= (1.0 + r_infl_m)
        groceries *= (1.0 + r_infl_m)
        transport *= (1.0 + r_infl_m)
        subs *= (1.0 + r_infl_m)
        misc *= (1.0 + r_infl_m)

        # Record series
        months.append(m)
        cash_series.append(round(cash, 2))
        inv_series.append(round(inv, 2))
        debt_series.append(round(debt, 2))
        nw_series.append(round(cash + inv - debt, 2))

    return SimulationResult(
        months=months,
        cash=cash_series,
        investments=inv_series,
        debt=debt_series,
        net_worth=nw_series,
    )

def run_monte_carlo(req: SimulationRequest) -> MonteCarloSummary:
    """
    Run Monte Carlo simulation to estimate the distribution of outcomes.

    We run N independent simulation paths. Each month, investment returns are sampled:
        r_month ~ Normal(mu_month, sigma_month)

    - mu_month is derived from annual expected return via compound conversion.
    - sigma_month is derived from annual volatility using sqrt(time):
        sigma_month ≈ sigma_annual / sqrt(12)

    Insolvency metric:
    - A path is counted as insolvent if it cannot cover expenses or make the required debt payment
      even after liquidating investments.
    - Probability of Insolvency = (# insolvent paths) / N

    Returns:
    - probability_of_insolvency
    - final net worth percentiles: p10, median, p90
    """

    if req.monte_carlo is None:
        raise ValueError("monte_carlo params required when mode='monte_carlo'")

    p = req.profile
    a = req.assumptions
    mc = req.monte_carlo
    if mc.simulations <= 0:
        raise ValueError("simulations must be > 0")


    months_total = a.years * 12

    # Convert annual rates to monthly
    mu_m = annual_to_monthly_rate(a.annual_return)
    sigma_m = mc.return_volatility_annual / np.sqrt(12.0) 

    r_income_m = annual_to_monthly_rate(a.annual_income_growth)
    r_infl_m = annual_to_monthly_rate(a.annual_inflation)
    r_debt_m = annual_to_monthly_rate(a.annual_debt_interest)

    rng = np.random.default_rng(mc.seed)

    insolvency_count = 0
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

        for _m in range(months_total):
            cash += income
            cash -= (rent + groceries + transport + subs + misc)

            # Option 1: If expenses push cash below 0, sell investments to cover
            if cash < 0:
                needed = -cash
                sell = min(inv, needed)
                inv -= sell
                cash += sell

# Still can't cover expenses after liquidation -> insolvency event
                if cash < 0:
                    insolvent = True
                    break

            # Debt grows (interest)
            if debt > 0:
                debt *= (1.0 + r_debt_m)

            # Required debt payment (must be paid in full)
            required_payment = min(a.monthly_debt_payment, debt) if debt > 0 else 0.0

            if required_payment > 0:
                if cash < required_payment:
                    needed = required_payment - cash
                    sell = min(inv, needed)
                    inv -= sell
                    cash += sell

# Still can't make required payment after liquidation -> insolvency event
                if cash < required_payment:
                    insolvent = True
                    break

                cash -= required_payment
                debt -= required_payment


            if cash > 0:
                invest_amt = cash * a.invest_rate
                cash -= invest_amt
                inv += invest_amt

            # Random return
            r = rng.normal(mu_m, sigma_m)
            if inv > 0:
                inv *= (1.0 + r)

            income *= (1.0 + r_income_m)
            rent *= (1.0 + r_infl_m)
            groceries *= (1.0 + r_infl_m)
            transport *= (1.0 + r_infl_m)
            subs *= (1.0 + r_infl_m)
            misc *= (1.0 + r_infl_m)

        if insolvent:
            insolvency_count += 1

        final_nw = cash + inv - debt
        finals.append(final_nw)


    finals = np.array(finals, dtype=float)
    p_insolvency = insolvency_count / mc.simulations

    return MonteCarloSummary(
        probability_of_ruin=round(p_insolvency, 4),
        final_net_worth_p10=round(float(np.percentile(finals, 10)), 2),
        final_net_worth_median=round(float(np.percentile(finals, 50)), 2),
        final_net_worth_p90=round(float(np.percentile(finals, 90)), 2),
    )


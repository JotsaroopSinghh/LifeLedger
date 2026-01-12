from .models import SimulationRequest, SimulationResult
import numpy as np
from .models import MonteCarloSummary



def annual_to_monthly_rate(annual: float) -> float:
    # Compounded conversion: (1+r)^(1/12) - 1
    return (1.0 + annual) ** (1.0 / 12.0) - 1.0


def run_deterministic(req: SimulationRequest) -> SimulationResult:
    p = req.profile
    a = req.assumptions

    months_total = a.years * 12

    # Convert annual assumptions to monthly rates
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
        # 1) Income arrives
        cash += income

        # 2) Expenses leave
        total_expenses = rent + groceries + transport + subs + misc
        cash -= total_expenses

        # 3) Debt grows (interest)
        if debt > 0:
            debt *= (1.0 + r_debt_m)

        # 4) Debt payment (can’t pay more than available cash)
        payment = min(cash, a.monthly_debt_payment, debt) if debt > 0 else 0.0
        cash -= payment
        debt -= payment

        # 5) If cash is negative, we assume you borrow to cover it
        # (keeps simulation running and makes “bad choices” show up as debt)
        if cash < 0:
            debt += (-cash)
            cash = 0.0

        # 6) Invest savings (only if you have leftover cash)
        if cash > 0:
            invest_amount = cash * a.invest_rate
            cash -= invest_amount
            inv += invest_amount

        # 7) Investments grow
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
    if req.monte_carlo is None:
        raise ValueError("monte_carlo params required when mode='monte_carlo'")

    p = req.profile
    a = req.assumptions
    mc = req.monte_carlo

    months_total = a.years * 12

    # Convert annual rates to monthly
    mu_m = annual_to_monthly_rate(a.annual_return)
    sigma_m = mc.return_volatility_annual / np.sqrt(12.0) 

    r_income_m = annual_to_monthly_rate(a.annual_income_growth)
    r_infl_m = annual_to_monthly_rate(a.annual_inflation)
    r_debt_m = annual_to_monthly_rate(a.annual_debt_interest)

    rng = np.random.default_rng(mc.seed)

    ruin_count = 0
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

        ruined = False

        for _m in range(months_total):
            cash += income
            cash -= (rent + groceries + transport + subs + misc)

            if debt > 0:
                debt *= (1.0 + r_debt_m)

            pay = min(cash, a.monthly_debt_payment, debt) if debt > 0 else 0.0
            cash -= pay
            debt -= pay

            if cash < 0:
                debt += (-cash)
                cash = 0.0

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

            nw = cash + inv - debt
            if nw < 0:
                ruined = True

        if ruined:
            ruin_count += 1

        finals.append(cash + inv - debt)

    finals = np.array(finals, dtype=float)
    p_ruin = ruin_count / mc.simulations

    return MonteCarloSummary(
        probability_of_ruin=round(p_ruin, 4),
        final_net_worth_p10=round(float(np.percentile(finals, 10)), 2),
        final_net_worth_median=round(float(np.percentile(finals, 50)), 2),
        final_net_worth_p90=round(float(np.percentile(finals, 90)), 2),
    )


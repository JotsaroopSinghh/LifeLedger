from pydantic import BaseModel, Field
from typing import Literal, List, Optional


class LifeProfile(BaseModel):
    "User's life setup, the factors that affect monthly cashflow"
    age: int = Field(22, ge=14, le=80, description="Starting age for the simulation")
    start_cash: float = Field(6000, ge=0, description="Starting cash (liquid)")
    start_investments: float = Field(500, ge=0, description="Starting invested assets")
    start_debt: float = Field(4000, ge=0, description="Starting debt balance")

    monthly_income: float = Field(3200, ge=0, description="Monthly take-home income at start")

    rent: float = Field(1350, ge=0)
    groceries: float = Field(420, ge=0)
    transport: float = Field(320, ge=0)
    subscriptions: float = Field(60, ge=0)
    misc: float = Field(260, ge=0)



class EconomicAssumptions(BaseModel):
    """Macroeconomic assumptions used to evolve income, expenses, and debt over time."""
    years: int = Field(25, ge=1, le=60)

    annual_return: float = Field(
        0.06, ge=-0.5, le=0.5, description="Expected annual investment return"
    )

    annual_income_growth: float = Field(
        0.025, ge=-0.2, le=0.5, description="Income growth rate per year"
    )
    annual_inflation: float = Field(
        0.025, ge=-0.1, le=0.3, description="Expense inflation rate per year"
    )

    annual_debt_interest: float = Field(0.06, ge=0.0, le=1.0)
    monthly_debt_payment: float = Field(200, ge=0)
    invest_rate: float = Field(
        0.55, ge=0.0, le=1.0, description="Fraction of remaining cash invested each month"
    )

class MonteCarloParams(BaseModel):
    simulations: int = Field(3000, ge=100, le=20000)
    return_volatility_annual: float = Field(0.18, ge=0.0, le=1.0)
    seed: Optional[int] = Field(42, description="RNG seed for reproducibility")


class SimulationRequest(BaseModel):
    profile: LifeProfile
    assumptions: EconomicAssumptions
    mode: Literal["deterministic", "monte_carlo"] = "deterministic"
    monte_carlo: Optional[MonteCarloParams] = None



class SimulationResult(BaseModel):
    months: List[int]
    cash: List[float]
    investments: List[float]
    debt: List[float]
    net_worth: List[float]

class MonteCarloSummary(BaseModel):
    probability_of_ruin: float
    final_net_worth_p10: float
    final_net_worth_median: float
    final_net_worth_p90: float


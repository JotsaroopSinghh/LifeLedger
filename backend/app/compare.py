from .models import CompareRequest, CompareResult, ScenarioResult
from .simulate import run_monte_carlo


def compare_scenarios(req: CompareRequest) -> CompareResult:
    if req.baseline.mode != "monte_carlo":
        raise ValueError("baseline must use mode='monte_carlo'")
    if req.baseline.monte_carlo is None:
        raise ValueError("baseline requires monte_carlo params")

    base_summary = run_monte_carlo(req.baseline)
    baseline_result = ScenarioResult(name="baseline", summary=base_summary)

    scenario_results = []
    delta_ruin = []
    delta_median = []

    for i, s in enumerate(req.scenarios):
        if s.mode != "monte_carlo":
            raise ValueError("all scenarios must use mode='monte_carlo'")
        if s.monte_carlo is None:
            raise ValueError("all scenarios require monte_carlo params")

        summary = run_monte_carlo(s)
        name = f"scenario_{i+1}"
        scenario_results.append(ScenarioResult(name=name, summary=summary))

        delta_ruin.append(round(summary.probability_of_ruin - base_summary.probability_of_ruin, 4))
        delta_median.append(round(summary.final_net_worth_median - base_summary.final_net_worth_median, 2))

    return CompareResult(
        baseline=baseline_result,
        scenarios=scenario_results,
        delta_probability_of_ruin=delta_ruin,
        delta_median_final_net_worth=delta_median,
    )

import { useMemo, useState } from "react";
import "./styles.css";

export default function App() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // These are the inputs controlled by the users
  const [monthlyIncome, setMonthlyIncome] = useState(3000);
  const [rent, setRent] = useState(1200);
  const [groceries, setGroceries] = useState(350);
  const [transport, setTransport] = useState(250);
  const [subscriptions, setSubscriptions] = useState(40);
  const [misc, setMisc] = useState(200);


  const [startCash, setStartCash] = useState(5000);
  const [startInvestments, setStartInvestments] = useState(0);
  const [startDebt, setStartDebt] = useState(0);

  // Assumptions (world settings)
  const [years, setYears] = useState(30);
  const [annualReturn, setAnnualReturn] = useState(0.06);
  const [annualIncomeGrowth, setAnnualIncomeGrowth] = useState(0.03);
  const [annualInflation, setAnnualInflation] = useState(0.02);
  const [annualDebtInterest, setAnnualDebtInterest] = useState(0.05);
  const [monthlyDebtPayment, setMonthlyDebtPayment] = useState(0);
  const [investRate, setInvestRate] = useState(1.0);

  // Monte Carlo Simulation settings
  const [simulations, setSimulations] = useState(1000);
  const [returnVolAnnual, setReturnVolAnnual] = useState(0.15);
  const [seed, setSeed] = useState(42);


  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);


  const requestBody = useMemo(() => {
    return {
      profile: {
        age: 22,
        start_cash: Number(startCash),
        start_investments: Number(startInvestments),
        start_debt: Number(startDebt),
        monthly_income: Number(monthlyIncome),
        rent: Number(rent),
        groceries: Number(groceries),
        transport: Number(transport),
        subscriptions: Number(subscriptions),
        misc: Number(misc),
      },
      assumptions: {
        years: Number(years),
        annual_return: Number(annualReturn),
        annual_income_growth: Number(annualIncomeGrowth),
        annual_inflation: Number(annualInflation),
        annual_debt_interest: Number(annualDebtInterest),
        monthly_debt_payment: Number(monthlyDebtPayment),
        invest_rate: Number(investRate),
      },
      mode: "monte_carlo",
      monte_carlo: {
        simulations: Number(simulations),
        return_volatility_annual: Number(returnVolAnnual),
        seed: Number(seed),
      },
    };
  }, [
    startCash,
    startInvestments,
    startDebt,
    monthlyIncome,
    rent,
    groceries,
    transport,
    subscriptions,
    misc,
    years,
    annualReturn,
    annualIncomeGrowth,
    annualInflation,
    annualDebtInterest,
    monthlyDebtPayment,
    investRate,
    simulations,
    returnVolAnnual,
    seed,
  ]);

  async function runSimulation() {
    setIsRunning(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        // FastAPI errors usually come as { detail: ... }
        const msg =
          typeof data?.detail === "string"
            ? data.detail
            : JSON.stringify(data, null, 2);
        setError(msg);
        setIsRunning(false);
        return;
      }

      setResult(data);
      setIsRunning(false);
    } catch (e) {
      setError("Could not reach backend. Is FastAPI running on http://127.0.0.1:8000 ?");
      setIsRunning(false);
    }
  }

  function formatMoney(x) {
    if (x === null || x === undefined) return "—";
    return x.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  }
  
  function applyPreset(name) {
    setError("");
    setResult(null);

    if (name === "baseline") {
      setStartCash(5000);
      setStartInvestments(0);
      setStartDebt(0);

      setMonthlyIncome(3000);
      setRent(1200);
      setGroceries(350);
      setTransport(250);
      setSubscriptions(40);
      setMisc(200);

      setYears(30);
      setAnnualReturn(0.06);
      setAnnualIncomeGrowth(0.03);
      setAnnualInflation(0.02);
      setAnnualDebtInterest(0.05);
      setMonthlyDebtPayment(0);
      setInvestRate(1.0);

      setSimulations(1000);
      setReturnVolAnnual(0.15);
      setSeed(42);
      return;
    }

    if (name === "high_rent") {
      setRent(1900);
      return;
    }

    if (name === "car_payment") {
      // car = higher monthly cost + maybe some debt
      setTransport(450);
      setStartDebt(8000);
      setMonthlyDebtPayment(200);
      return;
    }

    if (name === "income_shock") {
      setMonthlyIncome(2400);
      return;
    }
  }



  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">LL</div>
          <div>
            <div className="brandTitle">LifeLedger</div>
            <div className="brandSub">Stochastic Financial Decision Engine</div>
          </div>
        </div>

        <div className="tagRow">
          <span className="tag">Monte Carlo</span>
          <span className="tag">Probability of Ruin</span>
          <span className="tag">FastAPI</span>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h2 className="h2">Scenario Builder</h2>
          <p className="muted">
            Set your life inputs and assumptions. We’ll run thousands of simulated futures and
            estimate the chance you go negative at any point.
          </p>
          <div className="sectionTitle">Presets</div>
<div className="presetRow">
  <button className="btnGhost" type="button" onClick={() => applyPreset("baseline")}>
    Baseline
  </button>
  <button className="btnGhost" type="button" onClick={() => applyPreset("high_rent")}>
    High Rent City
  </button>
  <button className="btnGhost" type="button" onClick={() => applyPreset("car_payment")}>
    Buy a Car
  </button>
  <button className="btnGhost" type="button" onClick={() => applyPreset("income_shock")}>
    Low Income Shock
  </button>
</div>


          <div className="sectionTitle">Starting State</div>
          <div className="row3">
            <Field label="Start Cash ($)" value={startCash} onChange={setStartCash} />
            <Field label="Start Investments ($)" value={startInvestments} onChange={setStartInvestments} />
            <Field label="Start Debt ($)" value={startDebt} onChange={setStartDebt} />
          </div>

          <div className="sectionTitle">Monthly Cashflow</div>
          <div className="row3">
            <Field label="Income ($/mo)" value={monthlyIncome} onChange={setMonthlyIncome} />
            <Field label="Rent ($/mo)" value={rent} onChange={setRent} />
            <Field label="Groceries ($/mo)" value={groceries} onChange={setGroceries} />
            <Field label="Transport ($/mo)" value={transport} onChange={setTransport} />
            <Field label="Subscriptions ($/mo)" value={subscriptions} onChange={setSubscriptions} />
            <Field label="Misc ($/mo)" value={misc} onChange={setMisc} />
          </div>
          <div className="advHeader">
  <div className="sectionTitle" style={{ margin: 0 }}>Advanced Settings</div>
  <button
    className="btnGhost"
    type="button"
    onClick={() => setShowAdvanced((v) => !v)}
  >
    {showAdvanced ? "Hide" : "Show"}
  </button>
</div>

{showAdvanced ? (
  <>
    <div className="sectionTitle">Assumptions</div>
    <div className="row3">
      <Field label="Horizon (years)" value={years} onChange={setYears} step="1" />
      <Field label="Annual Return (μ)" value={annualReturn} onChange={setAnnualReturn} step="0.01" />
      <Field label="Income Growth" value={annualIncomeGrowth} onChange={setAnnualIncomeGrowth} step="0.01" />
      <Field label="Inflation" value={annualInflation} onChange={setAnnualInflation} step="0.01" />
      <Field label="Debt Interest" value={annualDebtInterest} onChange={setAnnualDebtInterest} step="0.01" />
      <Field label="Debt Payment ($/mo)" value={monthlyDebtPayment} onChange={setMonthlyDebtPayment} step="10" />
      <Field label="Invest Rate (0–1)" value={investRate} onChange={setInvestRate} step="0.05" />
    </div>

    <div className="sectionTitle">Monte Carlo</div>
    <div className="row3">
      <Field label="Simulations (N)" value={simulations} onChange={setSimulations} step="100" />
      <Field label="Annual Volatility (σ)" value={returnVolAnnual} onChange={setReturnVolAnnual} step="0.01" />
      <Field label="Seed" value={seed} onChange={setSeed} step="1" />
    </div>
  </>
) : (
  <p className="muted" style={{ marginTop: 10 }}>
    Using default assumptions and Monte Carlo settings. Click <b>Show</b> to adjust volatility,
    horizon, inflation, and number of simulations.
  </p>
)}
<div className="actionRow">
  <button
    className="btnPrimary"
    type="button"
    onClick={runSimulation}
    disabled={isRunning}
  >
    {isRunning ? "Running..." : "Run Simulation"}
  </button>

  <div className="actionHint">
    Runs Monte Carlo and estimates Probability of Ruin.
  </div>
</div>

{isRunning ? <div className="loadingBar" /> : null}



        </section>

        <aside className="card">
          <h2 className="h2">Request Preview</h2>
          <p className="muted">
            -
          </p>

          <pre className="code">
{JSON.stringify(requestBody, null, 2)}
          </pre>
          <div style={{ height: 14 }} />

          <h2 className="h2">Simulation Results</h2>
<p className="muted">
  These results summarize thousands of possible futures under uncertainty.
</p>

{error ? <pre className="code codeError">{error}</pre> : null}

{result ? (
  <div className="resultsGrid">
    <div className="resultCard danger">
      <div className="resultLabel">Probability of Ruin</div>
      <div className="resultValue">
        {(result.probability_of_ruin * 100).toFixed(1)}%
      </div>
      <div className="resultHint">
        Chance net worth goes negative at any point
      </div>
    </div>

    <div className="resultCard">
      <div className="resultLabel">Downside (10th percentile)</div>
      <div className="resultValue">
        ${formatMoney(result.final_net_worth_p10)}
      </div>
    </div>

    <div className="resultCard highlight">
      <div className="resultLabel">Median Outcome</div>
      <div className="resultValue">
        ${formatMoney(result.final_net_worth_median)}
      </div>
    </div>

    <div className="resultCard">
      <div className="resultLabel">Upside (90th percentile)</div>
      <div className="resultValue">
        ${formatMoney(result.final_net_worth_p90)}
      </div>
    </div>
  </div>
) : (
  <div className="emptyState">Run a simulation to see results.</div>
)}


        </aside>
      </main>

      <footer className="footer">
        Not financial advice. This tool is for learning and decision comparison.
      </footer>
    </div>
  );
}

function Field({ label, value, onChange, step = "1" }) {
  return (
    <label className="field">
      <span className="fieldLabel">{label}</span>
      <input
        className="input"
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

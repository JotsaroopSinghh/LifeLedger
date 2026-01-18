import { useMemo, useState } from "react";
import "./styles.css";

export default function App() {
  const [view, setView] = useState("landing");
  const [showInfo, setShowInfo] = useState(false);

// Inputs (default = baseline)
const [monthlyIncome, setMonthlyIncome] = useState(2550);
const [rent, setRent] = useState(1550);
const [groceries, setGroceries] = useState(450);
const [transport, setTransport] = useState(320);
const [subscriptions, setSubscriptions] = useState(60);
const [misc, setMisc] = useState(320);

const [startCash, setStartCash] = useState(0);
const [startInvestments, setStartInvestments] = useState(10000);
const [startDebt, setStartDebt] = useState(0);

const [years, setYears] = useState(5);
const [annualReturn, setAnnualReturn] = useState(0.06);
const [annualIncomeGrowth, setAnnualIncomeGrowth] = useState(0.025);
const [annualInflation, setAnnualInflation] = useState(0.025);
const [annualDebtInterest, setAnnualDebtInterest] = useState(0.07);
const [monthlyDebtPayment, setMonthlyDebtPayment] = useState(320);
const [investRate, setInvestRate] = useState(0.45);

const [simulations, setSimulations] = useState(4000);
const [returnVolAnnual, setReturnVolAnnual] = useState(0.20);
const [seed, setSeed] = useState(42);



  const [showAdvanced, setShowAdvanced] = useState(false);

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
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

        const res = await fetch(`${API_BASE}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
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
      setError(
        "Could not reach backend. Is FastAPI running on http://127.0.0.1:8000 ?"
      );
      setIsRunning(false);
    }
  }

  function applyPreset(name) {
    setError("");
    setResult(null);

    if (name === "baseline") {
      setMonthlyIncome(2550);
      setRent(1550);
      setGroceries(450);
      setTransport(320);
      setSubscriptions(60);
      setMisc(320);
    
      setStartCash(0);
      setStartInvestments(10000);
      setStartDebt(0);
    
      setYears(5);
      setAnnualReturn(0.06);
      setAnnualIncomeGrowth(0.025);
      setAnnualInflation(0.025);
      setAnnualDebtInterest(0.07);
      setMonthlyDebtPayment(320);
      setInvestRate(0.45);
    
      setSimulations(4000);
      setReturnVolAnnual(0.20);
      setSeed(42);
      return;
    }
    
    

    if (name === "car_payment") {
      applyPreset("baseline");
      setStartDebt(16000);
      setMonthlyDebtPayment(450);
      setTransport(450); 
      setMisc(380);
      return;
      
    }
    
    if (name === "income_shock") {
      applyPreset("baseline");
      setMonthlyIncome(3000);
      return;
      
    }
    
  }

  function formatMoney(x) {
    if (x === null || x === undefined) return "—";
    return Number(x).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  return (
    <div className="page">
      <TopNav
  onGoLanding={() => setView("landing")}
  onOpenInfo={() => setShowInfo(true)}
  showBack={view === "simulator"}
  onGoBack={() => setView("landing")}
/>


      {view === "landing" ? (
      <Landing onEnter={() => setView("simulator")} />

      ) : (
        <Simulator
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          applyPreset={applyPreset}
          requestBody={requestBody}
          runSimulation={runSimulation}
          isRunning={isRunning}
          error={error}
          result={result}
          formatMoney={formatMoney}
          // fields
          startCash={startCash}
          setStartCash={setStartCash}
          startInvestments={startInvestments}
          setStartInvestments={setStartInvestments}
          startDebt={startDebt}
          setStartDebt={setStartDebt}
          monthlyIncome={monthlyIncome}
          setMonthlyIncome={setMonthlyIncome}
          rent={rent}
          setRent={setRent}
          groceries={groceries}
          setGroceries={setGroceries}
          transport={transport}
          setTransport={setTransport}
          subscriptions={subscriptions}
          setSubscriptions={setSubscriptions}
          misc={misc}
          setMisc={setMisc}
          years={years}
          setYears={setYears}
          annualReturn={annualReturn}
          setAnnualReturn={setAnnualReturn}
          annualIncomeGrowth={annualIncomeGrowth}
          setAnnualIncomeGrowth={setAnnualIncomeGrowth}
          annualInflation={annualInflation}
          setAnnualInflation={setAnnualInflation}
          annualDebtInterest={annualDebtInterest}
          setAnnualDebtInterest={setAnnualDebtInterest}
          monthlyDebtPayment={monthlyDebtPayment}
          setMonthlyDebtPayment={setMonthlyDebtPayment}
          investRate={investRate}
          setInvestRate={setInvestRate}
          simulations={simulations}
          setSimulations={setSimulations}
          returnVolAnnual={returnVolAnnual}
          setReturnVolAnnual={setReturnVolAnnual}
          seed={seed}
          setSeed={setSeed}
        />
      )}

        <footer className="footer">
          <span>By Jotsaroop Singh</span>
          <span className="footerSep">•</span>
          <a
            href="https://github.com/JotsaroopSinghh/LifeLedger.git"
            target="_blank"
            rel="noopener noreferrer"
            className="footerLink"
          >
            View source on GitHub
          </a>
        </footer>


      {showInfo ? <InfoModal onClose={() => setShowInfo(false)} /> : null}
    </div>
  );
}

function TopNav({ onGoLanding, onOpenInfo, showBack, onGoBack }) {
  return (
    <header className="topbar">
      <div className="brand" role="button" tabIndex={0} onClick={onGoLanding}>
        <div className="logo">LL.</div>
        <div>
          <div className="brandTitle">LifeLedger</div>
          <div className="brandSub">Stochastic Financial Decision Engine</div>
        </div>
      </div>

      <div className="navActions">
        {showBack ? (
          <button className="navLink active" type="button" onClick={onGoBack}>
            ← Back
          </button>
        ) : null}

        <button
          className="iconBtn"
          type="button"
          onClick={onOpenInfo}
          title="How it works"
        >
          ⓘ
        </button>
      </div>
    </header>
  );
}


function Landing({ onEnter }) {
  return (
    <main className="landingNew">
      <section className="gate">
        <div className="gateTop">
          <div className="gateTitle">LifeLedger</div>
          <div className="gateSub">
            Stochastic Financial Decision Engine
          </div>
        </div>

        <div className="gateGrid">
          <div className="gatePanel">
            <div className="panelHeader">What it does</div>
            <div className="panelBody">
              <p className="panelLine">
                • Simulates your finances month-by-month over a chosen horizon.
              </p>
              <p className="panelLine">
                • Adds randomness to investment returns (Monte Carlo).
              </p>
              <p className="panelLine">
                • Outputs a risk metric: <b>Probability of Insolvency</b>.
              </p>
            </div>

            <div className="panelFooter">
              <span className="chip">Python</span>
              <span className="chip">FastAPI</span>
              <span className="chip">React</span>
            </div>
          </div>

          <div className="gateCenter">
            <div className="centerGlow" />
            <button className="ctaBig" type="button" onClick={onEnter}>
              Start Simulation
            </button>
            <div className="centerHint">
              One click → scenario presets → run simulation → understand risk.
            </div>
          </div>

          <div className="gatePanel">
            <div className="panelHeader">Engine spec</div>
            <div className="panelBody mono">
              <div className="specRow">
                <span className="specKey">Primary metric</span>
                <span className="specVal">P(insolvency)</span>
              </div>
              <div className="specRow">
                <span className="specKey">Summary stats</span>
                <span className="specVal">p10 / median / p90</span>
              </div>
              <div className="specRow">
                <span className="specKey">Model</span>
                <span className="specVal">cash + invest − debt</span>
              </div>
              <div className="specRow">
                <span className="specKey">Inputs</span>
                <span className="specVal">income, rent, debt…</span>
              </div>
            </div>

            <div className="panelFooter subtle">
              <span className="muted" style={{ fontSize: 12 }}>
                Use the ⓘ button for definitions and how it works.
              </span>
            </div>
          </div>
        </div>

        <div className="gateBottom muted">
          Not financial advice.
        </div>
      </section>
    </main>
  );
}



function Simulator(props) {
  const {
    showAdvanced,
    setShowAdvanced,
    applyPreset,
    requestBody,
    runSimulation,
    isRunning,
    error,
    result,
    formatMoney,
  } = props;

  return (
    <main className="grid">
      <section className="card">
        <h2 className="h2">Scenario Builder</h2>
        <p className="muted">
        Build a scenario, run Monte Carlo, and view downside outcomes + Probability of Insolvency.
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
            Income Shock
          </button>
        </div>

        <div className="sectionTitle">Starting State</div>
        <div className="row3">
          <Field label="Start Cash ($)" value={props.startCash} onChange={props.setStartCash} />
          <Field label="Start Investments ($)" value={props.startInvestments} onChange={props.setStartInvestments} />
          <Field label="Start Debt ($)" value={props.startDebt} onChange={props.setStartDebt} />
        </div>

        <div className="sectionTitle">Monthly Cashflow</div>
        <div className="row3">
          <Field label="Income ($/mo)" value={props.monthlyIncome} onChange={props.setMonthlyIncome} />
          <Field label="Rent ($/mo)" value={props.rent} onChange={props.setRent} />
          <Field label="Groceries ($/mo)" value={props.groceries} onChange={props.setGroceries} />
          <Field label="Transport ($/mo)" value={props.transport} onChange={props.setTransport} />
          <Field label="Subscriptions ($/mo)" value={props.subscriptions} onChange={props.setSubscriptions} />
          <Field label="Misc ($/mo)" value={props.misc} onChange={props.setMisc} />
        </div>

        <div className="advHeader">
          <div className="sectionTitle" style={{ margin: 0 }}>
            Advanced Settings
          </div>
          <button className="btnGhost" type="button" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? "Hide" : "Show"}
          </button>
        </div>

        {showAdvanced ? (
          <>
            <div className="sectionTitle">Assumptions</div>
            <div className="row3">
              <Field label="Horizon (years)" value={props.years} onChange={props.setYears} step="1" />
              <Field label="Annual Return (μ)" value={props.annualReturn} onChange={props.setAnnualReturn} step="0.01" />
              <Field label="Income Growth" value={props.annualIncomeGrowth} onChange={props.setAnnualIncomeGrowth} step="0.01" />
              <Field label="Inflation" value={props.annualInflation} onChange={props.setAnnualInflation} step="0.01" />
              <Field label="Debt Interest" value={props.annualDebtInterest} onChange={props.setAnnualDebtInterest} step="0.01" />
              <Field label="Debt Payment ($/mo)" value={props.monthlyDebtPayment} onChange={props.setMonthlyDebtPayment} step="10" />
              <Field label="Invest Rate (0–1)" value={props.investRate} onChange={props.setInvestRate} step="0.05" />
            </div>

            <div className="sectionTitle">Monte Carlo</div>
            <div className="row3">
              <Field label="Simulations (N)" value={props.simulations} onChange={props.setSimulations} step="100" />
              <Field label="Annual Volatility (σ)" value={props.returnVolAnnual} onChange={props.setReturnVolAnnual} step="0.01" />
              <Field label="Seed" value={props.seed} onChange={props.setSeed} step="1" />
            </div>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 10 }}>
            Using default assumptions and Monte Carlo settings for investment returns. Click <b>Show</b> to adjust volatility,
            horizon, inflation, and number of simulations.
          </p>
        )}

        <div className="actionRow">
          <button className="btnPrimary" type="button" onClick={runSimulation} disabled={isRunning}>
            {isRunning ? "Running..." : "Run Simulation"}
          </button>
        </div>

        {isRunning ? <div className="loadingBar" /> : null}

        <div style={{ height: 10 }} />
      </section>

      <aside className="card">
        <h2 className="h2">Results</h2>
        <p className="muted">Summary of thousands of futures.</p>

        {error ? <pre className="code codeError">{error}</pre> : null}

        {result ? (
          <div className="resultsGrid">
            <div className="resultCard danger">
              <div className="resultLabel">Probability of Insolvency</div>
              <div className="resultValue">
                {(result.probability_of_ruin * 100).toFixed(1)}%
              </div>
              <div className="resultHint">
              Chance you can't cover expenses or required debt payments (even after liquidating investments)
              </div>
            </div>

            <div className="resultCard">
              <div className="resultLabel">Downside (10th percentile)</div>
              <div className="resultValue">${formatMoney(result.final_net_worth_p10)}</div>
            </div>

            <div className="resultCard highlight">
              <div className="resultLabel">Median Outcome</div>
              <div className="resultValue">${formatMoney(result.final_net_worth_median)}</div>
            </div>

            <div className="resultCard">
              <div className="resultLabel">Upside (90th percentile)</div>
              <div className="resultValue">${formatMoney(result.final_net_worth_p90)}</div>
            </div>

            <div className="cardSub">
              <div className="cardSubTitle">Request Preview</div>
              <pre className="code">{JSON.stringify(requestBody, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="emptyState">Run a simulation to see results.</div>
        )}
      </aside>
    </main>
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

function InfoModal({ onClose }) {
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modalTop">
          <div>
            <div className="modalTitle">How LifeLedger works</div>
          </div>
          <button className="iconBtn" type="button" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="modalSection">
            <div className="modalH">What is being simulated?</div>
            <div className="muted">
              Each month, we update a financial state: cash, investments, debt, income, expenses, and net worth.
              Investments grow with a random monthly return.
            </div>
          </div>

          <div className="modalSection">
            <div className="modalH">Probability of Insolvency</div>
            <div className="muted">
              We run N simulated futures. A path is counted as insolvent if it cannot cover monthly
              expenses or make the required debt payment, even after liquidating investments.
              Probability of Insolvency = insolvent_paths / total_paths.
            </div>
          </div>


          <div className="modalSection">
            <div className="modalH">Percentiles (p10 / median / p90)</div>
            <div className="muted">
              Final net worth varies across futures. p10 is a bad-case outcome, median is typical, p90 is a great-case.
            </div>
          </div>

          <div className="modalSection">
            <div className="modalH">Why this is useful</div>
            <div className="muted">
              It compares decisions by risk, not just average return. For example: “How much does buying a car increase insolvency risk?”
            </div>
          </div>
        </div>

        <div className="modalBottom">
          <button className="btnPrimary" type="button" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

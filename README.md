# LifeLedger

LifeLedger is a full-stack financial simulation web application that helps users evaluate long-term financial decisions by modeling cash flow, investments, and debt over time. Rather than simple budgeting, the app uses **Monte Carlo simulation** to quantify financial risk and sustainability using the key metric of risk of insolvency.

The system projects a user’s financial trajectory month-by-month and estimates the probability of insolvency under uncertain market conditions.

---

## Live Demo
🔗 https://lifeledger-1.onrender.com  
(Deployed on Render)

---

## What the Project Does

LifeLedger simulates a user’s financial life on a **monthly timeline**, tracking:

- Cash balance  
- Investments  
- Debt  
- Net worth  

Each simulation accounts for:
- Income growth
- Inflation-adjusted expenses
- Stochastic investment returns
- Debt interest and required payments
- Automatic investment liquidation when cash is insufficient

A simulation **terminates early upon insolvency**, defined as the inability to meet expenses or debt obligations even after liquidating investments.

---

## Risk Modeling (Monte Carlo)

LifeLedger runs thousands of independent simulation paths, where monthly investment returns are randomly sampled from a probability distribution. From these simulations, the system computes:

- Probability of insolvency
- Distribution of final net worth (e.g., p10, median, p90)
- Expected long-term financial stability under uncertainty

This allows users to reason about **downside risk**, not just expected outcomes.

---

## Tech Stack

**Frontend**
- React (Vite)
- JavaScript, HTML, CSS

**Backend**
- Python
- FastAPI
- NumPy

**Deployment**
- Render

---

## Local Developement 
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python -m app.main


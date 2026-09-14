from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import SimulationRequest
from .simulate import run_monte_carlo


app = FastAPI(
    title="LifeLedger API",
    version="0.1.0",
    description="Backend for a LifeLedger"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lifeledger-1.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/schema")
def schema_example():
    """
    Returns an example SimulationRequest using model default values.
    Useful for frontend integration, testing, and API inspection.
    """
    example = SimulationRequest(
        profile={},
        assumptions={},
        monte_carlo={}
    )
    return example.model_dump()


@app.post("/simulate")
def simulate(req: SimulationRequest):
    """Run a Monte Carlo financial simulation."""
    return run_monte_carlo(req)

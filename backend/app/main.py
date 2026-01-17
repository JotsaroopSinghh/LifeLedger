from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import SimulationRequest
from .simulate import run_deterministic, run_monte_carlo


app = FastAPI(
    title="LifeLedger API",
    version="0.1.0",
    description="Backend for a LifeLedger"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://lifeledger-1.onrender.com"],
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
        assumptions={}
    )
    return example.model_dump()

@app.post("/simulate")
def simulate(req: SimulationRequest):
    """
    Run a financial simulation.

    """
    if req.mode == "deterministic":
        return run_deterministic(req)

    if req.mode == "monte_carlo":
        if req.monte_carlo is None:
            raise HTTPException(status_code=422, detail="monte_carlo params required for monte_carlo mode")
        return run_monte_carlo(req)

    raise HTTPException(status_code=400, detail="Invalid mode")


from fastapi import FastAPI, HTTPException
from .models import SimulationRequest
from .simulate import run_deterministic, run_monte_carlo



app = FastAPI(
    title="LifeLedger API",
    version="0.1.0",
    description="Backend for a life decision financial simulator."
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/schema")
def schema_example():
    """
    Returns an example request payload using default values.
    This is useful for frontend later and for verifying the model is correct.
    """
    example = SimulationRequest(
        profile={},
        assumptions={}
    )
    return example.model_dump()

@app.post("/simulate")
def simulate(req: SimulationRequest):
    if req.mode == "deterministic":
        return run_deterministic(req)

    if req.mode == "monte_carlo":
        if req.monte_carlo is None:
            raise HTTPException(status_code=422, detail="monte_carlo params required for monte_carlo mode")
        return run_monte_carlo(req)

    raise HTTPException(status_code=400, detail="Invalid mode")

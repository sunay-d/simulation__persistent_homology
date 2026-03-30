from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal
import gudhi as gd
import numpy as np
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev için
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean(val, scale=1):
    if math.isinf(val):
        return None  # ya da büyük sayı
    if math.isnan(val):
        return None
    return val*scale

# ---- Request schema ----
class TDARequest(BaseModel):
    points: List[List[float]]
    complex_type: Literal["rips", "cech"]
    max_edge_length: float = 1.0
    max_dimension: int = 2

# ---- Endpoint ----
@app.post("/tda")
def compute_tda(req: TDARequest):
    try:
        points = np.array(req.points)
        # max_points = np.max(points)
        # points = points / max_points if max_points != 0 else points  # 0-1 aralığına çek

        # Kompleks seçimi
        if req.complex_type == "rips":
            complex_obj = gd.RipsComplex(
                points=points,
                max_edge_length=req.max_edge_length
            )
        elif req.complex_type == "cech":
            complex_obj = gd.CechComplex(
                points=points,
                max_radius=req.max_edge_length
            )
        else:
            return {"error": "Invalid complex type"}

        simplex_tree = complex_obj.create_simplex_tree(
            max_dimension=req.max_dimension
        )

        # Persistence
        persistence = simplex_tree.persistence()

        persistence = [
            {"dim": dim, "birth": clean(pair[0]), "death": clean(pair[1])}
            for dim, pair in persistence
        ]
        print(persistence)
        return {
            "num_simplices": simplex_tree.num_simplices(),
            "persistence": persistence
        }
        
    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}

def __main__():
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
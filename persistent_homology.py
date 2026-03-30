import numpy as np
import gudhi as gd
import json

# Rastgele noktalar (HTML'deki gibi)
np.random.seed(42)
points = np.random.rand(50, 2) * 360

# Vietoris-Rips kompleks
rips_complex = gd.RipsComplex(points=points, max_edge_length=180)
simplex_tree = rips_complex.create_simplex_tree(max_dimension=2)

# Persistent homology
diag = simplex_tree.persistence()

# H1 intervals çıkar
h1_intervals = [pair for dim, pair in diag if dim == 1]

# JSON olarak kaydet
with open('h1_intervals.json', 'w') as f:
    json.dump(h1_intervals, f)

print("H1 intervals saved to h1_intervals.json")
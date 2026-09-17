import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
SRC = BACKEND / "src"
for entry in (str(BACKEND), str(SRC)):
    if entry not in sys.path:
        sys.path.insert(0, entry)
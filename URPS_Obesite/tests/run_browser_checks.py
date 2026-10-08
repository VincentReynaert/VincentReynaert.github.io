"""Run all browser checks, or pass suite names (layout lifecycle journey bilan questions cache)."""
import subprocess
import sys
from pathlib import Path

SUITES = ("layout", "lifecycle", "journey", "bilan", "questions", "cache", "csv")
selected = sys.argv[1:] or SUITES
for suite in selected:
    if suite not in SUITES:
        raise SystemExit(f"Unknown suite {suite}; choose from {', '.join(SUITES)}")
    print(f"\n--- {suite} ---", flush=True)
    subprocess.run([sys.executable, str(Path(__file__).with_name(f"check_{suite}.py"))], check=True)

"""Repeatable in-process API benchmark (NOT Android/network latency)."""
from __future__ import annotations
import json, os, statistics, tempfile, time, sys
from pathlib import Path
from fastapi.testclient import TestClient
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend import app as module

repo=Path(__file__).resolve().parents[1]
out=repo/'docs/evidence/api_microbenchmark.json'
with tempfile.TemporaryDirectory() as tmp:
    module.reset_connection_for_tests(str(Path(tmp)/'benchmark.db'))
    with TestClient(module.app) as client:
        results={}
        for path in ['/health','/cows','/tasks']:
            # warm-up to reduce first-request artefacts
            for _ in range(5): assert client.get(path).status_code==200
            times=[]
            for _ in range(60):
                start=time.perf_counter()
                r=client.get(path)
                times.append((time.perf_counter()-start)*1000)
                assert r.status_code==200
            samples=sorted(times)
            results[path]={
                'trials':len(samples),
                'mean_ms':round(statistics.mean(samples),3),
                'median_ms':round(statistics.median(samples),3),
                'p95_ms':round(samples[int(.95*(len(samples)-1))],3),
                'max_ms':round(samples[-1],3),
            }
    out.parent.mkdir(parents=True,exist_ok=True)
    meta={'environment':'FastAPI TestClient in-process, single machine, seeded SQLite test database',
          'limitation':'No phone, Wi-Fi, camera, TLS, DNS, or true network overhead; not a mobile benchmark.',
          'results':results}
    out.write_text(json.dumps(meta,indent=2)+'\n')
    print(json.dumps(meta,indent=2))

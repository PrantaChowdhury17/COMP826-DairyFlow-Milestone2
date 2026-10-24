"""Small reproducible REST backend for the COMP826 prototype.

SQLite is the demo server persistence layer; production PostgreSQL was proposed in Milestone 1.
Role selection in the app is a demo stub, NOT production authentication.
"""
from __future__ import annotations
import os
import sqlite3
from contextlib import contextmanager, asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

DATABASE_PATH = Path(os.environ.get('DAIRYFARM_SERVER_DB', str(Path(__file__).resolve().parent / 'farm_server.db')))
@asynccontextmanager
async def lifespan(_app):
    initialize()
    yield

app = FastAPI(title='DairyFlow task sync API', version='0.1.0', lifespan=lifespan)

COWS = [
    ('COW-101', 'Daisy', 'Holstein', 'Health observation due', '12.6'),
    ('COW-102', 'Bella', 'Friesian', 'Normal', '16.1'),
    ('COW-103', 'Luna', 'Jersey', 'Feeding follow-up', '9.4'),
]
TASKS = [
    ('TASK-001','COW-101','Check temperature','Follow up on recent health observation','critical','open','morning','2026-10-23T06:00:00.000Z','worker-1'),
    ('TASK-002','COW-101','Record morning milk','Record latest yield in cow profile','normal','open','morning','2026-10-26T10:00:00.000Z','worker-1'),
    ('TASK-003','COW-102','Inspect hooves','Routine inspection','high','open','afternoon','2026-10-25T09:00:00.000Z','worker-1'),
    ('TASK-004','COW-103','Check feed intake','Check issue reported by previous shift','high','open','night','2026-10-23T20:00:00.000Z','worker-1'),
]

@contextmanager
def connection():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DATABASE_PATH)
    con.row_factory = sqlite3.Row
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()

def reset_connection_for_tests(path: str):
    global DATABASE_PATH
    DATABASE_PATH = Path(path)
    initialize()

def initialize():
    with connection() as db:
        db.executescript('''
        CREATE TABLE IF NOT EXISTS cows(id TEXT PRIMARY KEY,name TEXT,breed TEXT,health_note TEXT,last_milk_litres TEXT);
        CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,cow_id TEXT,title TEXT,note TEXT,priority TEXT,status TEXT,shift TEXT,due_at TEXT,assigned_to TEXT,updated_at TEXT);
        CREATE TABLE IF NOT EXISTS applied_operations(operation_id TEXT PRIMARY KEY,task_id TEXT,applied_at TEXT);
        ''')
        db.executemany('INSERT OR IGNORE INTO cows VALUES(?,?,?,?,?)', COWS)
        db.executemany('INSERT OR IGNORE INTO tasks(id,cow_id,title,note,priority,status,shift,due_at,assigned_to) VALUES(?,?,?,?,?,?,?,?,?)', TASKS)

class SyncOperation(BaseModel):
    operationId: str = Field(min_length=8, max_length=100)
    taskId: str
    status: Literal['done', 'open']
    updatedAt: str

class SyncRequest(BaseModel):
    operations: list[SyncOperation] = Field(max_length=200)

@app.get('/health')
def health():
    return {'status':'ok', 'serverTime':datetime.now(timezone.utc).isoformat()}

@app.get('/cows')
def cows():
    with connection() as db:
        return [dict(row) for row in db.execute('SELECT * FROM cows ORDER BY id')]

@app.get('/tasks')
def tasks():
    with connection() as db:
        return [dict(row) for row in db.execute('SELECT * FROM tasks ORDER BY id')]

@app.get('/bootstrap')
def bootstrap():
    return {'cows': cows(), 'tasks': tasks()}

@app.post('/sync')
def sync(payload: SyncRequest):
    """Idempotent operation IDs prevent duplicate application on network retries."""
    acknowledged: list[str] = []
    rejected: list[dict] = []
    with connection() as db:
        for op in payload.operations:
            if db.execute('SELECT 1 FROM applied_operations WHERE operation_id=?',(op.operationId,)).fetchone():
                acknowledged.append(op.operationId)
                continue
            if not db.execute('SELECT 1 FROM tasks WHERE id=?',(op.taskId,)).fetchone():
                rejected.append({'operationId':op.operationId,'reason':'Unknown task'})
                continue
            db.execute('UPDATE tasks SET status=?,updated_at=? WHERE id=?',(op.status,op.updatedAt,op.taskId))
            db.execute('INSERT INTO applied_operations(operation_id,task_id,applied_at) VALUES(?,?,?)',(op.operationId,op.taskId,datetime.now(timezone.utc).isoformat()))
            acknowledged.append(op.operationId)
    return {'acknowledged':acknowledged,'rejected':rejected}

@app.get('/metrics')
def metrics():
    with connection() as db:
        return {'totalTasks':db.execute('SELECT COUNT(*) FROM tasks').fetchone()[0],
                'completedTasks':db.execute("SELECT COUNT(*) FROM tasks WHERE status='done'").fetchone()[0],
                'operationsApplied':db.execute('SELECT COUNT(*) FROM applied_operations').fetchone()[0]}

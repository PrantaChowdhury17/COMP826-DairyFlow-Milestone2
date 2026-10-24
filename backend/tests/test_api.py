import pytest
from fastapi.testclient import TestClient
from backend import app as module

@pytest.fixture
def client(tmp_path):
    module.reset_connection_for_tests(str(tmp_path/'demo.db'))
    with TestClient(module.app) as api:
        yield api

def test_health_and_seed_data(client):
    assert client.get('/health').status_code == 200
    data = client.get('/bootstrap').json()
    assert len(data['cows']) == 3
    assert len(data['tasks']) == 4

def test_valid_sync_updates_server_once_even_when_retried(client):
    op = {'operationId':'offline-op-0001','taskId':'TASK-001','status':'done','updatedAt':'2026-10-24T08:00:00Z'}
    for _ in range(2):
        resp=client.post('/sync',json={'operations':[op]})
        assert resp.status_code == 200
        assert resp.json()['acknowledged']==['offline-op-0001']
    assert client.get('/metrics').json()['operationsApplied']==1
    row = next(t for t in client.get('/tasks').json() if t['id']=='TASK-001')
    assert row['status']=='done'

def test_unknown_task_rejected_without_acknowledgement(client):
    op={'operationId':'offline-op-0002','taskId':'UNKNOWN','status':'done','updatedAt':'2026-10-24T08:00:00Z'}
    out=client.post('/sync',json={'operations':[op]}).json()
    assert out['acknowledged']==[]
    assert out['rejected'][0]['reason']=='Unknown task'
    assert client.get('/metrics').json()['operationsApplied']==0

def test_malformed_payload_fails_validation(client):
    resp=client.post('/sync',json={'operations':[{'operationId':'short','taskId':'TASK-001','status':'invalid','updatedAt':'x'}]})
    assert resp.status_code == 422

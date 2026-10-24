# DairyFlow — COMP826 Milestone 2

**Context-Aware Mobile Dairy Farm Monitoring and Task Coordination System**  
**Course:** COMP826 Mobile Systems Development, AUT, Semester 2, 2026  
**Student:** Pranta Chowdhury (25311773)  
**Project role:** Developer  
**Platform:** Android, React Native / Expo SDK 58

## 1. Project overview

I developed DairyFlow as a mobile prototype to help dairy-farm workers find a cow's information and respond to relevant tasks without relying on continuous connectivity. The main workflow combines QR-based cow identification, a locally cached cow profile, explainable context-based task ordering, offline task completion and subsequent server synchronisation.

The prototype uses three demonstration cows and four demonstration tasks. It focuses on one end-to-end workflow rather than attempting to implement a production farm-management platform.

The workflow is:

1. Select a demonstration role (Farm Worker or Farm Manager).
2. Scan a cow QR code or enter a test cow ID.
3. View its local profile and context-prioritised tasks.
4. Complete a task while disconnected from the network.
5. Reopen the application and confirm the locally stored task update remains pending.
6. Reconnect, open Sync Centre and select **Sync now**.
7. Check the acknowledgement and server state.

### Implemented capabilities

- Role-based **demonstration selection** and a dashboard with context-prioritised tasks.
- QR scanning using the Android camera, with manual cow-code input as a fallback.
- Cached cow profiles including breed, health note and last recorded milk quantity.
- Deterministic task scoring that considers urgency, due date, cow, shift and role.
- On-device SQLite storage, with task completion and a pending operation recorded together.
- User-triggered synchronisation through a FastAPI REST backend.
- Duplicate-operation handling through stored operation IDs on the server.

**Scope:** Selecting a role is not secure authentication. Synchronisation is manually initiated rather than an automatic background service. The backend uses SQLite for a single-machine demonstration rather than the PostgreSQL deployment proposed in Milestone 1. This prototype is not suitable for storing production farm or personal data.

## 2. Repository structure

```text
mobile/
  App.tsx                    App screens and navigation state
  src/components/UI.tsx      Shared UI elements
  src/domain/rules.ts        QR parsing and context-based task ranking
  src/domain/rules.test.ts   TypeScript domain tests
  src/data/database.ts       Local SQLite records and pending operations
  src/data/sync.ts           REST communication and sync acknowledgement
backend/
  app.py                     FastAPI endpoints and server-side operation ledger
  requirements.txt           Python dependencies
  tests/test_api.py          Backend API tests
docs/
  architecture.png           Component/architecture diagram
  offline_sequence.png       Offline workflow sequence diagram
  qr-codes/                 Cow QR images and a printable test sheet
  postman/                  API collection
.github/workflows/           Automated workflow configuration
tools/                       Benchmark and smoke-test utilities
```

## 3. Prerequisites

- Windows computer with Node.js and npm; I tested the app with Node.js **24.22.1**.
- Python **3.10 or later**.
- Android phone with **Expo Go compatible with Expo SDK 58**.
- Phone and laptop connected to the same local Wi-Fi network for REST synchronisation.
- Camera access to scan a test QR code.

The app can show cached records and save task completion while offline once it has been set up. Reaching the backend requires the laptop and phone to be connected to a network where the local FastAPI server is accessible.

## 4. Run the backend (PowerShell)

Open PowerShell in the repository's top-level folder (the folder containing `backend` and `mobile`). Run:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

Keep this window open. Check these URLs in the laptop browser:

- `http://localhost:8000/health` — backend availability
- `http://localhost:8000/docs` — API documentation
- `http://localhost:8000/cows` — demonstration cow profiles
- `http://localhost:8000/tasks` — server-side task states
- `http://localhost:8000/metrics` — counts of tasks and applied operations

The server listens on port 8000 and is intended only for local demonstration. Do not expose this unauthenticated demo server to the public internet.

## 5. Run the mobile app (PowerShell)

Open a **second PowerShell window** in the repository's `mobile` folder:

```powershell
npm install
npx.cmd expo install --fix
```

Find the laptop's active Wi-Fi IPv4 address using `ipconfig`. Create `mobile/.env` from the supplied example:

```powershell
Copy-Item .env.example .env
```

Open `mobile/.env` in a text editor and set the address to your laptop's current Wi-Fi IPv4 address, for example:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:8000
```

Replace the example IP with **your own laptop's actual address**; `localhost` will not work as the laptop address from a physical phone. Save the file, then start Expo:

```powershell
npx.cmd expo start --clear --port 8082
```

Keep this window open. In **Expo Go (SDK 58)** on your Android phone, scan the newly displayed QR code. If the phone cannot reach the app, verify that phone and laptop use the same Wi-Fi and that Windows Firewall allows Python on **private networks** when prompted.

During testing, I used port 8082 because an earlier Metro session on the default port had caused Expo Go to open the outdated SDK project. The FastAPI backend remains on port 8000.

## 6. Demonstration procedure

The test QR images are in `docs/qr-codes/`, including `QR_Test_Sheet.png`.

1. Open the app and select **Continue as Farm Worker**.
2. Choose **Scan cow QR** and scan **COW-101** from the test sheet. Daisy's Holstein profile should appear with a health note, milk record and relevant tasks.
3. Open **Check temperature** (TASK-001).
4. Turn **off Wi-Fi and mobile data** on the phone and select **Complete & save offline**.
5. Verify the task is removed from the open list and Sync Centre reports **one pending operation**.
6. Fully close and reopen the app. Check that the completion and pending operation remain.
7. Restore Wi-Fi and verify that `http://<laptop-ip>:8000/health` is accessible from the phone browser.
8. In Sync Centre, tap **Sync now**. Verify one acknowledgement and zero pending changes.
9. Refresh `http://localhost:8000/tasks` on the laptop: TASK-001 should have `status: done`.
10. Refresh `http://localhost:8000/metrics` to inspect `completedTasks` and `operationsApplied`.
11. For error handling, enter `COW-999` in the manual field; the application should reject this unknown ID.
12. Switch to **Farm Manager** and inspect the role-labelled dashboard.

The sample server retains completed-task state between runs. If repeating the demonstration from the beginning, use another open test task or reset the demonstration dataset using a deliberate local development procedure rather than assuming TASK-001 is still open. Never delete live data unintentionally.

## 7. Automated tests

From the repository root, run the Python tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q backend\tests
```

If `pytest` is not installed in that environment, install the dependencies from `backend/requirements.txt` before retrying.

Then, from the `mobile` folder, run the TypeScript tests:

```powershell
node --experimental-strip-types --test src/domain/rules.test.ts
```

**Verified on 25 October 2026:** 7/7 TypeScript domain tests passed and 4/4 Python backend tests passed. The Python run reported one non-blocking Starlette/httpx deprecation warning. These tests support the isolated domain and API logic; the mobile workflow was checked separately on a physical Android device.

## 8. Device observations and evaluation

I tested the application on my Samsung Android phone with Expo SDK 58. The offline task completion persisted after reopening the app, and synchronisation changed TASK-001 from `open` to `done` on the FastAPI backend. The Sync Centre cleared its pending queue after the server acknowledged the operation. I also replayed a deliberately repeated operation ID: the first request increased `operationsApplied` from 1 to 2, while the second did not increase it to 3.

For a small usability timing exercise, I measured **three** complete QR-scanning attempts and **three** complete manual-entry attempts on the same phone and cow ID (COW-101):

| Trial | QR scan to profile | Manual entry to profile |
|---|---:|---:|
| 1 | 1.25 s | 10 s |
| 2 | 1.30 s | 9 s |
| 3 | 1.20 s | 8 s |
| **Mean** | **1.25 s** | **9.00 s** |

Both methods succeeded in 3/3 trials. In this small developer-run evaluation, the QR workflow required approximately 86.1% less time. These readings are indicative only: they were collected on one device with three trials per method, rather than in a study involving farm workers.

An Android status-bar overlap was detected during testing and corrected using safe-area handling. The corrected header was visually verified on the device.

## 9. Limitations and next steps

The application is an independently testable prototype, not a production platform. Known limitations include:

- No authenticated accounts, secure farm permissions or production API security.
- SQLite demonstration backend rather than a multi-user PostgreSQL deployment.
- No automatic background connectivity monitor or background sync scheduling.
- No general conflict resolution when two different users update the same task.
- Three demonstration cows and four seeded tasks; no sensor integrations or machine-learning predictions.
- Limited device coverage and a small, developer-run usability sample.

For a future iteration I would prioritise authentication and permission enforcement, HTTPS, a version-aware multi-device synchronisation protocol, wider device compatibility testing and usability studies with actual farm workers. I would retain the simple, explainable prioritisation rules until there is a demonstrated reason to introduce more complex models.

## 10. Project context and references

I developed this prototype for COMP826 Milestone 2 using the design proposed in Milestone 1. Third-party frameworks and libraries are acknowledged through the repository dependencies and official documentation.

Documentation: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [Expo Camera](https://docs.expo.dev/versions/v58.0.0/sdk/camera/), [Expo SQLite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/), [FastAPI](https://fastapi.tiangolo.com/).

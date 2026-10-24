# DairyFlow — Evidence checklist

This record lists the evidence I captured during development and Android verification. The screenshots are unmodified copies of my source images, retained in `docs/evidence/`.

- [x] Worker dashboard after Android safe-area correction
- [x] Farm Manager dashboard
- [x] Daisy profile with critical task outstanding
- [x] Daisy profile after offline task completion
- [x] One pending change after app restart
- [x] Server-acknowledged sync and zero pending changes
- [x] Empty-queue resync feedback
- [x] Invalid COW-999 error
- [x] Backend task state before and after sync
- [x] Backend metrics after sync
- [x] All seven Node/TypeScript tests passing
- [x] All four Python API tests passing
- [x] Same operation ID replayed twice with only one additional application
- [x] Public GitHub repository showing the README
- [ ] Screenshot of the role-selection screen (not yet supplied here)
- [ ] Independent farm-user evaluation (not conducted)
- [ ] Second Android device or emulator compatibility test (not conducted)

I distinguish between real device observations, automated tests and future work in the report. The screenshots document observations, but do not by themselves establish general reliability outside this test setup.

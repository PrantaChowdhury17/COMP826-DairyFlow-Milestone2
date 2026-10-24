# DairyFlow evaluation evidence

These files record the prototype demonstration and testing performed on the developer's Samsung Android phone and Windows laptop for COMP826 Milestone 2.

- `qr_manual_timings.csv`: three comparable task times per method. Mean QR = 1.25 s; mean manual = 9.00 s.
- `worker_dashboard_after_header_fix.jpg`, `manager_dashboard.jpg`: role and display evidence.
- `daisy_profile_before_completion.jpg`, `daisy_profile_after_local_completion.jpg`: local task-completion evidence.
- `sync_pending_after_restart.jpg`, `sync_acknowledged_zero_pending.jpg`, `sync_empty_queue_retry.jpg`: local queue and sync results.
- `invalid_cow_id_rejected.jpg`: input validation response.
- `backend_tasks_before_sync.png`, `backend_tasks_after_sync.png`, `backend_metrics_after_first_sync.png`: backend state before and after upload.
- `node_seven_tests_pass.png`, `python_four_tests_pass.png`: automated-test outputs.
- `backend_duplicate_operation_replay.png`: repeat-ID acceptance without double application.
- `github_public_repository_readme.png`: repository-access evidence.

The benchmark is limited to one device, one developer and three runs per method. It does not establish real-farm usability or a general performance guarantee. Manual synchronisation was used; automatic background sync was not implemented.

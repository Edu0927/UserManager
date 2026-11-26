import os
import json
import time
import base64
import sqlite3
import urllib.request
import urllib.error

from datetime import datetime, timezone

REPOSITORY = os.getenv(
    "GITHUB_REPOSITORY", "Edu0927/UserManager"
)

INTERVAL = int(os.getenv("POLL_INTERVAL", "120"))

OO_URL = os.getenv(
    "OPENOBSERVE_URL", "http://127.0.0.1:5080"
)

OO_ORG = os.getenv("OPENOBSERVE_ORG", "default")
OO_STREAM = os.getenv("OPENOBSERVE_STREAM", "usermanager_pipeline")

OO_USER = os.environ["ZO_ROOT_USER_EMAIL"]
OO_PASSWORD = os.environ["ZO_ROOT_USER_PASSWORD"]

API = f"https://api.github.com/repos/{REPOSITORY}/actions"

AUTH = base64.b64encode(
    f"{OO_USER}:{OO_PASSWORD}".encode()
).decode()

DB = sqlite3.connect("/data/pipeline.db")

DB.execute("""
    CREATE TABLE IF NOT EXISTS processed_events (
        event_id TEXT PRIMARY KEY
    )
""")

DB.commit()


def log(message):
    print(
        f"{datetime.now(timezone.utc).isoformat()} {message}",
        flush=True
    )


def github_get(path):
    request = urllib.request.Request(
        f"{API}/{path}",
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "UserManager-Pipeline-Monitor",
            "X-GitHub-Api-Version": "2022-11-28"
        }
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read())


def send_event(event):
    url = f"{OO_URL}/api/{OO_ORG}/{OO_STREAM}/_json"

    request = urllib.request.Request(
        url,
        data=json.dumps([event]).encode(),
        headers={
            "Authorization": f"Basic {AUTH}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.loads(response.read())

        for stream in result.get("status", []):
            if stream.get("failed", 0) > 0:
                raise RuntimeError("OpenObserve rejected event")


def processed(event_id):
    return DB.execute(
        "SELECT 1 FROM processed_events WHERE event_id = ?",
        (event_id,)
    ).fetchone() is not None


def mark_processed(event_id):
    DB.execute(
        "INSERT OR IGNORE INTO processed_events VALUES (?)",
        (event_id,)
    )
    DB.commit()


def normalize(value):
    return {
        "success": "SUCCESS",
        "failure": "FAILED",
        "skipped": "SKIPPED",
        "cancelled": "CANCELLED",
        "timed_out": "FAILED"
    }.get(value, "UNKNOWN")


def duration_ms(start, end):
    if not start or not end:
        return 0

    start_date = datetime.fromisoformat(
        start.replace("Z", "+00:00")
    )

    end_date = datetime.fromisoformat(
        end.replace("Z", "+00:00")
    )

    return max(
        0,
        int((end_date - start_date).total_seconds() * 1000)
    )


def process_run(run, attempt):
    run_id = run["id"]
    event_id = f"{run_id}-{attempt}"

    if processed(event_id):
        return

    if attempt != run["run_attempt"]:
        run = github_get(
            f"runs/{run_id}/attempts/{attempt}"
        )

    if run["status"] != "completed":
        return

    jobs = github_get(
        f"runs/{run_id}/attempts/{attempt}/jobs?per_page=100"
    ).get("jobs", [])

    backend_status = "NOT_EXECUTED"
    frontend_status = "NOT_EXECUTED"
    tests_status = "NOT_EXECUTED"
    deployment_status = "NOT_CONFIGURED"

    for job in jobs:
        name = job["name"].lower()

        if "pruebas automatizadas" in name:
            tests_status = normalize(job.get("conclusion"))

            for step in job.get("steps", []):
                step_name = step["name"].lower()

                if "ejecutar pruebas backend" in step_name:
                    backend_status = normalize(
                        step.get("conclusion")
                    )

                if "ejecutar pruebas frontend" in step_name:
                    frontend_status = normalize(
                        step.get("conclusion")
                    )

        if "despliegue automatico" in name:
            deployment_status = normalize(
                job.get("conclusion")
            )

    # Recuperar el resultado de las pruebas anteriores
    # cuando solamente se reejecuta el despliegue.
    if attempt > 1 and tests_status == "NOT_EXECUTED":
        for previous in range(attempt - 1, 0, -1):
            previous_jobs = github_get(
                f"runs/{run_id}/attempts/{previous}/jobs?per_page=100"
            ).get("jobs", [])

            found = False

            for job in previous_jobs:
                if "pruebas automatizadas" in job["name"].lower():
                    tests_status = normalize(job.get("conclusion"))

                    for step in job.get("steps", []):
                        name = step["name"].lower()

                        if "ejecutar pruebas backend" in name:
                            backend_status = normalize(
                                step.get("conclusion")
                            )

                        if "ejecutar pruebas frontend" in name:
                            frontend_status = normalize(
                                step.get("conclusion")
                            )

                    found = True
                    break

            if found:
                break

    status = normalize(run.get("conclusion"))

    event = {
        "event_id": event_id,
        "timestamp": run["updated_at"],
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "service_name": "usermanager-pipeline",
        "event_type": "PIPELINE_COMPLETED",
        "level": "INFO" if status == "SUCCESS" else "ERROR",
        "repository": REPOSITORY,
        "workflow": run["name"],
        "pipeline_status": status,
        "commit_sha": run["head_sha"],
        "commit_message": run.get("display_title", ""),
        "branch": run["head_branch"],
        "actor": run.get("actor", {}).get("login", ""),
        "run_id": run_id,
        "run_number": run["run_number"],
        "run_attempt": attempt,
        "trigger": run["event"],
        "duration_ms": duration_ms(
            run.get("run_started_at"),
            run.get("updated_at")
        ),
        "tests_status": tests_status,
        "backend_tests_status": backend_status,
        "frontend_tests_status": frontend_status,
        "deployment_status": deployment_status,
        "run_url": run["html_url"],
        "message": f"Pipeline {status}"
    }

    send_event(event)
    mark_processed(event_id)

    log(
        f"Event sent | Run: {run_id} | "
        f"Attempt: {attempt} | "
        f"Pipeline: {status} | "
        f"Deployment: {deployment_status}"
    )


def monitor():
    result = github_get(
        "workflows/usermanager-ci-cd.yml/runs?per_page=30"
    )

    for run in reversed(result.get("workflow_runs", [])):
        for attempt in range(1, run["run_attempt"] + 1):
            process_run(run, attempt)


log("UserManager Pipeline Monitor started")

while True:
    wait = INTERVAL

    try:
        monitor()

    except urllib.error.HTTPError as error:
        log(f"HTTP error: {error.code}")

        if error.code in (403, 429):
            reset = error.headers.get("X-RateLimit-Reset")
            retry = error.headers.get("Retry-After")

            wait = 300

            if reset and reset.isdigit():
                wait = max(wait, int(reset) - int(time.time()) + 5)

            if retry and retry.isdigit():
                wait = max(wait, int(retry))

    except Exception as error:
        log(f"Monitor error: {type(error).__name__}")

    time.sleep(wait)

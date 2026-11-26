import time
import json
import random
import urllib.request
from datetime import datetime, timezone

OTLP_URL = "http://172.18.0.1:4318/v1/metrics"
INTERVAL = 30


def read_cpu():
    with open("/proc/stat", "r") as file:
        values = list(map(int, file.readline().split()[1:9]))

    idle = values[3] + values[4]
    total = sum(values)

    return idle, total


def get_cpu_usage():
    idle1, total1 = read_cpu()

    time.sleep(1)

    idle2, total2 = read_cpu()

    idle_delta = idle2 - idle1
    total_delta = total2 - total1

    if total_delta <= 0:
        return 0.0

    usage = 100 * (1 - idle_delta / total_delta)

    return max(0.0, min(100.0, usage))


def simulate_temperature(cpu_usage):
    base_temperature = 38.0
    variation = random.uniform(-1.5, 1.5)

    temperature = (
        base_temperature
        + cpu_usage * 0.45
        + variation
    )

    return round(temperature, 2)


def send_metric(temperature):
    payload = {
        "resourceMetrics": [
            {
                "resource": {
                    "attributes": [
                        {
                            "key": "service.name",
                            "value": {
                                "stringValue": "usermanager-temperature"
                            }
                        },
                        {
                            "key": "host.name",
                            "value": {
                                "stringValue": "UserManager-Server"
                            }
                        }
                    ]
                },
                "scopeMetrics": [
                    {
                        "scope": {
                            "name": "temperature-monitor"
                        },
                        "metrics": [
                            {
                                "name": "system_cpu_temperature",
                                "description": "Simulated CPU temperature based on real CPU utilization",
                                "unit": "Cel",
                                "gauge": {
                                    "dataPoints": [
                                        {
                                            "timeUnixNano": str(time.time_ns()),
                                            "asDouble": temperature,
                                            "attributes": [
                                                {
                                                    "key": "source",
                                                    "value": {
                                                        "stringValue": "simulated"
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }

    request = urllib.request.Request(
        OTLP_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(request, timeout=10) as response:
        return response.status


def main():
    print("UserManager - Temperature Monitor", flush=True)
    print("Temperature source: SIMULATED", flush=True)

    while True:
        start = time.monotonic()

        try:
            cpu_usage = get_cpu_usage()
            temperature = simulate_temperature(cpu_usage)

            status = send_metric(temperature)

            timestamp = datetime.now(timezone.utc).isoformat()

            print(
                f"{timestamp} | "
                f"CPU: {cpu_usage:.2f}% | "
                f"Temperature: {temperature:.2f} C | "
                f"Source: SIMULATED | "
                f"HTTP: {status}",
                flush=True
            )

        except Exception as error:
            print(f"ERROR: {error}", flush=True)

        time.sleep(max(0, INTERVAL - (time.monotonic() - start)))


if __name__ == "__main__":
    main()

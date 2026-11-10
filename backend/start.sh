#!/bin/sh
set -eu

PORT="${PORT:-8000}"

if [ "${ENABLE_SIMULATOR:-true}" = "true" ]; then
    (
        i=0
        while [ "$i" -lt 30 ]; do
            if curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
                exec python simulator.py --hour "${SIM_HOUR:-9}" --api "http://127.0.0.1:${PORT}"
            fi
            i=$((i + 1))
            sleep 1
        done
    ) &
fi

exec uvicorn main:app --host 0.0.0.0 --port "${PORT}" --workers 1 --proxy-headers --forwarded-allow-ips "*"

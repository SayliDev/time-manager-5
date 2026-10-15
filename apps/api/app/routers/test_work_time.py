from datetime import datetime, timedelta

from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse

from app.repositories import work_session
from app.services.time_service import (
    PARIS,
    calc_work_time,
    calc_ongoing_week,
    calc_past_time_week,
    show_past_date,
    format_work_time,
)


router = APIRouter(prefix="/test-work-time", tags=["Tests temps de travail"])


@router.get("/data")
def get_chart_data(user_id: int = Query(..., gt=0)):
    sessions = list(work_session.get_all_by_user_id(user_id))# Date de référence pour tester les données de démonstration
    today = datetime(2026, 10, 2).date()

    def bar(label, duration):
        return {
            "label": label,
            "hours": duration.total_seconds() / 3600,
            "formatted": format_work_time(duration),
        }

    summary = [
        bar(
            "Day · aujourd'hui",
            calc_work_time(sessions, today, today + timedelta(days=1)),
        ),
        bar(
            "Ongoing · semaine en cours",
            calc_ongoing_week(sessions, today),
        ),
        bar(
            "Week · semaine précédente",
            calc_past_time_week(
                sessions,
                week_date=today - timedelta(days=7),
                today=today,
            ),
        ),
    ]

    history = show_past_date(
        sessions,
        start_date=today - timedelta(days=7),
        today=today,
    )

    return {
        "user_id": user_id,
        "date": today.isoformat(),
        "session_count": len(sessions),
        "summary": summary,
        "daily": [
            bar(day.strftime("%d/%m"), duration)
            for day, duration in history.items()
        ],
    }


@router.get("", response_class=HTMLResponse)
def test_page():
    return HTML_PAGE


HTML_PAGE = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Test des temps de travail</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 32px 20px;
            background: #f1f5f9;
            color: #172033;
            font-family: system-ui, sans-serif;
        }
        main { max-width: 1050px; margin: auto; }
        h1 { margin-bottom: 8px; }
        .muted { color: #64748b; }
        form {
            display: flex;
            align-items: end;
            flex-wrap: wrap;
            gap: 12px;
            margin: 24px 0;
        }
        label { display: grid; gap: 6px; }
        input, button {
            padding: 11px 16px;
            font: inherit;
            border-radius: 8px;
        }
        input { border: 1px solid #cbd5e1; width: 160px; }
        button {
            border: 0;
            color: white;
            background: #2563eb;
            cursor: pointer;
        }
        button:disabled { opacity: .6; cursor: wait; }
        section {
            background: white;
            padding: 24px;
            border-radius: 16px;
            margin-top: 24px;
            box-shadow: 0 4px 20px #17203308;
        }
        h2 { margin: 0 0 12px; font-size: 20px; }
        .chart { overflow-x: auto; }
        svg { display: block; width: 100%; min-width: 650px; }
        #status { min-height: 24px; }
        .error { color: #b91c1c; }
    </style>
</head>
<body>
<main>
    <h1>Temps de travail</h1>
    <p class="muted">
        Sessions terminées uniquement · Fuseau Europe/Paris
    </p>

    <form id="form">
        <label>
            Identifiant utilisateur
            <input id="user-id" type="number" min="1" value="5" required>
        </label>
        <button id="load" type="submit">Afficher les heures</button>
    </form>

    <p id="status" role="status" aria-live="polite"></p>

    <section>
        <h2>Day / Ongoing / Week</h2>
        <div id="summary-chart" class="chart"></div>
    </section>

    <section>
        <h2>Les sept derniers jours, hors aujourd'hui</h2>
        <div id="daily-chart" class="chart"></div>
    </section>
</main>

<script>
const svgNS = "http://www.w3.org/2000/svg";

function svgElement(tag, attributes, text) {
    const element = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    if (text !== undefined) element.textContent = text;
    return element;
}

function drawChart(containerId, items) {
    const container = document.getElementById(containerId);
    container.replaceChildren();

    const width = 960;
    const height = 350;
    const left = 60;
    const right = 20;
    const top = 45;
    const bottom = 65;
    const plotHeight = height - top - bottom;
    const plotWidth = width - left - right;

    const maxHours = Math.max(1, ...items.map(item => item.hours));
    const step = Math.max(1, Math.ceil(maxHours / 5));
    const ceiling = step * 5;

    const svg = svgElement("svg", {
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": items.map(
            item => `${item.label} : ${item.formatted}`
        ).join(", ")
    });

    for (let i = 0; i <= 5; i++) {
        const value = i * step;
        const y = top + plotHeight - value / ceiling * plotHeight;

        svg.appendChild(svgElement("line", {
            x1: left, y1: y, x2: width - right, y2: y,
            stroke: "#e2e8f0"
        }));

        svg.appendChild(svgElement("text", {
            x: left - 10, y: y + 5,
            "text-anchor": "end",
            fill: "#64748b",
            "font-size": 13
        }, `${value} h`));
    }

    const slotWidth = plotWidth / items.length;
    const barWidth = Math.min(100, slotWidth * 0.55);
    const colors = ["#2563eb", "#14b8a6", "#8b5cf6"];

    items.forEach((item, index) => {
        const x = left + slotWidth * (index + 0.5);
        const barHeight = item.hours / ceiling * plotHeight;
        const y = top + plotHeight - barHeight;

        svg.appendChild(svgElement("rect", {
            x: x - barWidth / 2,
            y: y,
            width: barWidth,
            height: barHeight,
            rx: 6,
            fill: colors[index % colors.length]
        }));

        svg.appendChild(svgElement("text", {
            x: x, y: y - 10,
            "text-anchor": "middle",
            "font-size": 16,
            "font-weight": 700,
            fill: "#172033"
        }, item.formatted));

        svg.appendChild(svgElement("text", {
            x: x, y: top + plotHeight + 30,
            "text-anchor": "middle",
            "font-size": 13,
            fill: "#475569"
        }, item.label));
    });

    container.appendChild(svg);
}

document.getElementById("form").addEventListener("submit", async event => {
    event.preventDefault();

    const status = document.getElementById("status");
    const button = document.getElementById("load");
    const userId = document.getElementById("user-id").value;

    button.disabled = true;
    status.className = "muted";
    status.textContent = "Chargement…";

    document.getElementById("summary-chart").replaceChildren();
    document.getElementById("daily-chart").replaceChildren();

    try {
        const basePath = window.location.pathname.replace(/\\/$/, "");
        const response = await fetch(
            `${basePath}/data?user_id=${encodeURIComponent(userId)}`
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const data = await response.json();

        drawChart("summary-chart", data.summary);
        drawChart("daily-chart", data.daily);

        status.textContent =
            `Utilisateur ${data.user_id} · ${data.date} · ` +
            `${data.session_count} session(s) récupérée(s)` +
            (data.session_count === 0 ? " · Aucune session disponible." : "");
    } catch (error) {
        status.className = "error";
        status.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

document.getElementById("form").requestSubmit();
</script>
</body>
</html>
"""
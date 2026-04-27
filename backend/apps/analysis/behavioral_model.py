"""
Python port of src/lib/behavioralModel.ts

Provides spending habit analysis, anomaly detection, and forecasting
based on a user's transaction history.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any


EXAM_WEEK_KEYWORDS = {"exam", "midterm", "final", "quiz", "project"}


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


@dataclass
class HabitProfile:
    avg_spend_by_day_of_week: dict[int, float] = field(default_factory=dict)
    avg_spend_by_month: dict[int, float] = field(default_factory=dict)
    exam_week_delta: float = 0.0


@dataclass
class CategoryForecast:
    category: str
    amount: float


@dataclass
class HabitualPrediction:
    date: str  # ISO-8601
    predicted_spend: float


@dataclass
class SpendingAnomaly:
    transaction_id: str
    category: str
    amount: float
    z_score: float


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def _std_dev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    avg = _mean(values)
    variance = sum((v - avg) ** 2 for v in values) / len(values)
    return math.sqrt(variance)


def _only_expenses(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [t for t in transactions if t.get("type") == "EXPENSE"]


def _normalize_category(category: str | None) -> str:
    return (category or "Other").strip()


def _is_exam_week_transaction(tx: dict[str, Any]) -> bool:
    text = f"{tx.get('description', '')} {tx.get('category', '')}".lower()
    return any(kw in text for kw in EXAM_WEEK_KEYWORDS)


def _get_category_stats(transactions: list[dict[str, Any]]) -> dict[str, dict[str, float]]:
    grouped: dict[str, list[float]] = {}
    for tx in transactions:
        cat = _normalize_category(tx.get("category"))
        grouped.setdefault(cat, []).append(float(tx.get("amount", 0)))

    return {
        cat: {"mean": _mean(vals), "std_dev": _std_dev(vals)}
        for cat, vals in grouped.items()
    }


def _to_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
            try:
                dt = datetime.strptime(value, fmt)
                return dt.replace(tzinfo=timezone.utc)
            except ValueError:
                continue
        # Fallback: isoformat with timezone info
        from dateutil import parser as dateutil_parser  # type: ignore
        try:
            return dateutil_parser.parse(value)
        except Exception:
            return datetime.now(tz=timezone.utc)
    return datetime.now(tz=timezone.utc)


# ---------------------------------------------------------------------------
# Public functions (matching behavioralModel.ts API)
# ---------------------------------------------------------------------------


def learn_habits(transactions: list[dict[str, Any]]) -> HabitProfile:
    """Compute average spending by day-of-week and month, plus exam-week delta."""
    expenses = _only_expenses(transactions)
    day_buckets: dict[int, list[float]] = {i: [] for i in range(7)}
    month_buckets: dict[int, list[float]] = {i: [] for i in range(12)}

    for tx in expenses:
        dt = _to_datetime(tx.get("date"))
        day_buckets[dt.weekday()].append(float(tx.get("amount", 0)))
        month_buckets[dt.month - 1].append(float(tx.get("amount", 0)))

    avg_by_dow = {i: _mean(day_buckets[i]) for i in range(7)}
    avg_by_month = {i: _mean(month_buckets[i]) for i in range(12)}

    exam_expenses = [float(t["amount"]) for t in expenses if _is_exam_week_transaction(t)]
    non_exam_expenses = [float(t["amount"]) for t in expenses if not _is_exam_week_transaction(t)]
    delta = _mean(exam_expenses) - _mean(non_exam_expenses)
    exam_week_delta = delta if math.isfinite(delta) else 0.0

    return HabitProfile(
        avg_spend_by_day_of_week=avg_by_dow,
        avg_spend_by_month=avg_by_month,
        exam_week_delta=exam_week_delta,
    )


def detect_anomalies(
    transactions: list[dict[str, Any]], z_threshold: float = 2.0
) -> list[SpendingAnomaly]:
    """Return transactions that are statistical outliers within their category."""
    expenses = _only_expenses(transactions)
    stats = _get_category_stats(expenses)
    anomalies: list[SpendingAnomaly] = []

    for tx in expenses:
        cat = _normalize_category(tx.get("category"))
        s = stats.get(cat, {})
        std = s.get("std_dev", 0)
        if std == 0:
            continue

        z = (float(tx.get("amount", 0)) - s["mean"]) / std
        if abs(z) >= z_threshold:
            anomalies.append(
                SpendingAnomaly(
                    transaction_id=str(tx.get("id", "")),
                    category=cat,
                    amount=float(tx.get("amount", 0)),
                    z_score=z,
                )
            )

    return anomalies


def predict_habitual_expenses(
    transactions: list[dict[str, Any]],
    future_dates: list[datetime],
) -> list[HabitualPrediction]:
    """Predict daily spend for each future date based on learned habits."""
    habits = learn_habits(transactions)
    expenses = _only_expenses(transactions)

    now = datetime.now(tz=timezone.utc)
    cutoff = now - timedelta(days=30)
    recent_amounts = [
        float(t["amount"])
        for t in expenses
        if _to_datetime(t.get("date")) >= cutoff
    ]
    recent_avg = _mean(recent_amounts)

    predictions: list[HabitualPrediction] = []
    for dt in future_dates:
        # Python weekday(): Mon=0 … Sun=6; JS getDay(): Sun=0 … Sat=6
        # Map Python weekday to JS convention for consistency
        py_wd = dt.weekday()
        js_wd = (py_wd + 1) % 7

        day_mean = habits.avg_spend_by_day_of_week.get(js_wd, 0)
        month_mean = habits.avg_spend_by_month.get(dt.month - 1, 0)
        baseline = (day_mean + month_mean + recent_avg) / 3

        # Weekend exam-week boost (Sat/Sun in JS = 0 or 6)
        exam_boost = (
            habits.exam_week_delta * 0.15
            if habits.exam_week_delta > 0 and js_wd in (0, 6)
            else 0.0
        )

        predictions.append(
            HabitualPrediction(
                date=dt.isoformat(),
                predicted_spend=max(0.0, baseline + exam_boost),
            )
        )

    return predictions


def forecast_by_category(
    transactions: list[dict[str, Any]], days: int = 30
) -> list[CategoryForecast]:
    """Forecast spending per category for the next `days` days."""
    expenses = _only_expenses(transactions)
    now = datetime.now(tz=timezone.utc)
    window_start = now - timedelta(days=90)

    grouped: dict[str, list[float]] = {}
    for tx in expenses:
        dt = _to_datetime(tx.get("date"))
        if dt < window_start:
            continue
        cat = _normalize_category(tx.get("category"))
        grouped.setdefault(cat, []).append(float(tx.get("amount", 0)))

    day_multiplier = days / 30
    forecasts = [
        CategoryForecast(
            category=cat,
            amount=_mean(vals) * max(1, len(vals) / 6) * day_multiplier,
        )
        for cat, vals in grouped.items()
    ]
    forecasts.sort(key=lambda f: f.amount, reverse=True)
    return forecasts


def generate_future_dates(days: int = 30) -> list[datetime]:
    now = datetime.now(tz=timezone.utc)
    return [now + timedelta(days=i + 1) for i in range(days)]

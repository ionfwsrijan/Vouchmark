from __future__ import annotations

import json

import pytest

from src import ddb


class FakeTable:
    def __init__(self, items: list[dict]):
        self._items = list(items)
        self.by_key = {it["caseId"]: it for it in items}
        self.query_kwargs: dict | None = None

    def query(self, **kwargs: object) -> dict:
        self.query_kwargs = kwargs
        last = self._items[-1]["caseId"] if len(self._items) >= 3 else None
        return {
            "Items": self._items,
            "LastEvaluatedKey": (
                {"deviceId": "dev-1", "caseId": last} if last else {}
            ),
        }

    def get_item(self, Key: dict, **kwargs: object) -> dict:
        return {"Item": self.by_key.get(Key["caseId"])}


@pytest.fixture
def fake_table(monkeypatch):
    item = {
        "deviceId": "dev-1",
        "caseId": "c-1",
        "createdAt": "2026-09-01T00:00:00+00:00",
        "verdictLabel": "LIKELY_INVALID",
        "fightScore": 78,
        "language": "English",
        "digest": json.dumps({"headline": "On paper, 1 of the rejection grounds look weak"}),
        "analysis": json.dumps({"verdict": {"label": "LIKELY_INVALID"}}),
    }
    table = FakeTable([item])
    monkeypatch.setattr(
        ddb,
        "_ddb",
        lambda: type("Resource", (), {"Table": lambda self, n: table})(),
    )
    return table


def test_list_cases_returns_items_and_no_cursor(fake_table):
    items, cursor = ddb.list_cases("dev-1")
    assert items[0]["caseId"] == "c-1"
    assert cursor is None


def test_list_cases_forwards_cursor_as_exclusive_start_key(fake_table):
    ddb.list_cases("dev-1", cursor="c-9")
    assert fake_table.query_kwargs is not None
    assert fake_table.query_kwargs["ExclusiveStartKey"] == {
        "deviceId": "dev-1",
        "caseId": "c-9",
    }


def test_get_case_parses_stored_analysis(fake_table):
    case = ddb.get_case("dev-1", "c-1")
    assert case["analysis"]["verdict"]["label"] == "LIKELY_INVALID"
    assert case["digest"]["headline"]


def test_get_case_missing_returns_none(fake_table):
    assert ddb.get_case("dev-1", "missing") is None


def test_list_cases_empty_device_returns_empty():
    assert ddb.list_cases("") == ([], None)
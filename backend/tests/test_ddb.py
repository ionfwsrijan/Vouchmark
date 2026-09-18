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


def _payload_for_case() -> dict:
    return {
        "analysis": {
            "verdict": {"label": "LIKELY_INVALID", "fight_score": 60, "headline": "On paper"},
            "language": "English",
            "generatedVia": "demo",
            "extraction": {"insurer": "X", "diagnosis": "D", "amount_rejected": 1000},
            "assessments": [{"category": "delayed_intimation"}],
        }
    }


@pytest.fixture
def no_dynamodb(monkeypatch):
    ddb._memory = {}
    monkeypatch.setattr(ddb, "_ddb", lambda: (_ for _ in ()).throw(RuntimeError("no creds")))
    yield
    ddb._memory = {}


def test_memory_fallback_saves_and_lists(no_dynamodb):
    ddb.save_case("dev-mem", "c-1", _payload_for_case())
    items, _cursor = ddb.list_cases("dev-mem")
    assert items[0]["caseId"] == "c-1"
    assert items[0]["digest"]["headline"] == "On paper"


def test_memory_fallback_reopens_case_with_analysis(no_dynamodb):
    ddb.save_case("dev-mem", "c-2", _payload_for_case())
    case = ddb.get_case("dev-mem", "c-2")
    assert case["analysis"]["verdict"]["label"] == "LIKELY_INVALID"


def test_memory_fallback_is_scoped_per_device_and_paginates(no_dynamodb):
    for i in range(5):
        ddb.save_case("dev-a", f"c-{i}", _payload_for_case())
        ddb.save_case("dev-b", f"c-{i}", _payload_for_case())
    items_a, cursor_a = ddb.list_cases("dev-a", limit=2)
    assert [i["caseId"] for i in items_a] == ["c-4", "c-3"]
    assert cursor_a == "c-3"
    page2, cursor_b = ddb.list_cases("dev-a", limit=2, cursor=cursor_a)
    assert [i["caseId"] for i in page2] == ["c-2", "c-1"]
    assert cursor_b == "c-1"
    page3, cursor_c = ddb.list_cases("dev-a", limit=2, cursor=cursor_b)
    assert [i["caseId"] for i in page3] == ["c-0"]
    assert cursor_c is None
    items_b, _ = ddb.list_cases("dev-b")
    assert len(items_b) == 5
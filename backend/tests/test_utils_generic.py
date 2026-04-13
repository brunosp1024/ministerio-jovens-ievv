import pytest
from app.utils.generic import parse_bool, parse_date
from datetime import datetime, date


def test_parse_bool_true_cases():
    assert parse_bool(True) is True
    assert parse_bool("sim") is True
    assert parse_bool("true") is True
    assert parse_bool("1") is True
    assert parse_bool("ativo") is True
    assert parse_bool("habilitado") is True
    assert parse_bool(1) is True
    assert parse_bool("  Sim  ") is True

def test_parse_bool_false_cases():
    assert parse_bool(False) is False
    assert parse_bool("não") is False
    assert parse_bool("0") is False
    assert parse_bool(0) is False
    assert parse_bool(2) is False
    assert parse_bool("") is False
    assert parse_bool(None) is False
    assert parse_bool("desativado") is False

def test_parse_date_valid():
    assert parse_date("2024-04-13") == date(2024, 4, 13)
    assert parse_date("13/04/2024") == date(2024, 4, 13)
    assert parse_date(datetime(2024, 4, 13)) == date(2024, 4, 13)
    assert parse_date(" 2024-04-13 ") == date(2024, 4, 13)
    assert parse_date(" 13/04/2024 ") == date(2024, 4, 13)

def test_parse_date_invalid():
    assert parse_date("") is None
    assert parse_date(None) is None
    assert parse_date("data inválida") is None
    assert parse_date("32/13/2024") is None
    assert parse_date("2024-13-32") is None

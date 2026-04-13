from datetime import datetime

def parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("sim", "true", "1", "ativo", "habilitado")
    if isinstance(value, int):
        return value == 1
    return False

def parse_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    try:
        # Aceita formatos: YYYY-MM-DD, DD/MM/YYYY, etc.
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
            # Tenta YYYY-MM-DD
            try:
                return datetime.strptime(value, "%Y-%m-%d").date()
            except ValueError:
                pass
            # Tenta DD/MM/YYYY
            try:
                return datetime.strptime(value, "%d/%m/%Y").date()
            except ValueError:
                pass
        return None
    except Exception:
        return None

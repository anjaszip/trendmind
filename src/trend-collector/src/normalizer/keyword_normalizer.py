import re
import unicodedata


def normalize_keyword(term: str) -> str:
    """Lowercase, trim, remove punctuation, and reduce to singular-like form."""
    normalized = term.strip().lower()
    normalized = unicodedata.normalize("NFKD", normalized)
    normalized = re.sub(r"[^\w\s-]", "", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    normalized = _to_simple_singular(normalized)
    return normalized


def _to_simple_singular(term: str) -> str:
    """Remove common English plural suffixes for basic deduplication."""
    if term.endswith("sses") or term.endswith("xes") or term.endswith("zes"):
        return term[:-2]
    if term.endswith("ies") and len(term) > 3:
        return term[:-3] + "y"
    if term.endswith("s") and not term.endswith("ss") and len(term) > 2:
        return term[:-1]
    return term

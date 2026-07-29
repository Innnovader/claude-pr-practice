from app.dedup import content_hash, cosine_similarity, is_near_duplicate, normalize_text


def test_normalize_text_collapses_whitespace_and_case():
    assert normalize_text("  Reforma   Tributaria!!  ") == "reforma tributaria"


def test_content_hash_is_stable_for_equivalent_titles():
    a = content_hash("Reforma Tributaria pasa primer debate", "El Tiempo")
    b = content_hash("reforma tributaria pasa primer debate", "el tiempo")
    assert a == b


def test_content_hash_differs_for_different_source():
    a = content_hash("Reforma Tributaria pasa primer debate", "El Tiempo")
    b = content_hash("Reforma Tributaria pasa primer debate", "Semana")
    assert a != b


def test_cosine_similarity_identical_vectors_is_one():
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0


def test_cosine_similarity_orthogonal_vectors_is_zero():
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0


def test_is_near_duplicate_detects_similar_embedding_above_threshold():
    candidate = [1.0, 0.0]
    existing = [[0.99, 0.01]]
    assert is_near_duplicate(candidate, existing, threshold=0.9) is True


def test_is_near_duplicate_false_when_below_threshold():
    candidate = [1.0, 0.0]
    existing = [[0.0, 1.0]]
    assert is_near_duplicate(candidate, existing, threshold=0.9) is False

from app.services.puzzle_factory import _parse_binary_verdict


def test_parse_binary_verdict_from_json():
    assert _parse_binary_verdict('{"verdict":"YES"}') is True
    assert _parse_binary_verdict('{"verdict":"NO"}') is False


def test_parse_binary_verdict_rejects_ambiguous_thinking_text():
    text = "Yes, the student first seems right, but final verdict is no."
    assert _parse_binary_verdict(text) is None


def test_parse_binary_verdict_from_verdict_line_only():
    assert _parse_binary_verdict("VERDICT: YES") is True
    assert _parse_binary_verdict("VERDICT: NO") is False

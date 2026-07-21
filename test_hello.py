from hello import greet


def test_greet():
    assert greet("mundo") == "Hola, mundo!"


def test_greet_empty_name():
    assert greet("") == "Hola, !"

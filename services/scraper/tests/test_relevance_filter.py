from app.relevance_filter import is_relevant


def test_blocks_real_kienyke_entretenimiento_incident():
    # Caso real que llegó al panel el 2026-07-30: sin nombre de famoso en la
    # lista, pero KienyKe SÍ marca la sección en URL y categoría RSS.
    assert (
        is_relevant(
            "Jhon Álex Castaño reveló por qué decidió vivir solo pese a tener pareja",
            "El cantante dijo que prefiere vivir solo porque la convivencia ya no hace parte de su proyecto de vida.",
            "https://www.kienyke.com/entretenimiento/jhon-alex-castano-hablo-de-su-relacion",
            "Entretenimiento",
        )
        is False
    )


def test_blocks_real_kienyke_futbol_incident():
    # Caso real: "/futbol/" no estaba en la lista de segmentos irrelevantes
    # (solo "/deportes/"), así que se coló.
    assert (
        is_relevant(
            "¿Cómo formaría Santa Fe y a qué horas juega ante Caracas en Copa Sudamericana?",
            "El equipo 'Cardenal' ganó 2-0 en la ida.",
            "https://www.kienyke.com/futbol/caracas-fc-vs-santa-fe-horario-alineaciones",
            "Fútbol",
        )
        is False
    )


def test_blocks_by_category_when_url_is_flat():
    # Las2Orillas no marca sección en la URL, pero sí en la categoría RSS.
    assert (
        is_relevant(
            "Así pasa la vejez Pambelé, el campeón mundial al que se le apagaron las luces del éxito",
            None,
            "https://www.las2orillas.co/asi-pasa-la-vejez-pambele",
            "Actualidad, boxeo, Congreso de la república, deportes, Kid Pambelé",
        )
        is False
    )


def test_blocks_generic_entertainment_without_named_celebrity():
    # Infobae no expone <category> en su RSS (tags vacíos) — este patrón
    # genérico no depende de una lista de nombres propios.
    assert (
        is_relevant(
            "La Oreja de Van Gogh vuelve a Colombia con un concierto que hace parte de su gira",
            "Fechas de preventa de boletas ya están disponibles.",
            "https://www.infobae.com/colombia/2026/07/30/la-oreja-de-van-gogh-vuelve-a-colombia",
            None,
        )
        is False
    )


def test_blocks_hyperlocal_traffic_incident_reported_by_user():
    # Caso real reportado por la usuaria el 2026-07-30 (captura de pantalla):
    # sucesos de tránsito individual sin ángulo institucional, sourced solo
    # en un post de redes sociales del propio afectado. Infobae no marca
    # categoría en su RSS, así que no matcheaba ningún patrón previo.
    assert (
        is_relevant(
            "Conductor del Chevrolet Spark azul denunció abuso de autoridad "
            "durante la inmovilización del vehículo en Cajicá: lo publicó en "
            "sus redes sociales",
            "La intervención se ejecutó el jueves 30 de julio de 2026 en "
            "Cundinamarca, luego de reportes por conducción riesgosa.",
            "https://www.infobae.com/colombia/2026/07/30/conductor-del-chevrolet-spark-azul",
            None,
        )
        is False
    )


def test_allows_real_political_news():
    assert (
        is_relevant(
            "Congreso aprobó en primer debate la reforma tributaria",
            "La plenaria del Senado avanzó el proyecto presentado por el Gobierno.",
            "https://www.eltiempo.com/politica/congreso-aprobo-reforma-tributaria",
            "Política",
        )
        is True
    )


def test_allows_news_with_no_category_or_matching_keyword():
    assert (
        is_relevant(
            "Contraloría adelanta inspección en el MinHacienda por alertas fiscales",
            "La entidad alertó por riesgos fiscales.",
            "https://www.lasillavacia.com/en-vivo/contraloria-adelanta-inspeccion",
            "En Vivo, Contraloría",
        )
        is True
    )

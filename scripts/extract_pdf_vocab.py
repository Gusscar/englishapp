"""
Extrae vocabulario de "El curso más completo de inglés" (221 páginas, 76 capítulos)
y genera un archivo SQL listo para importar en Supabase.

Formato en el PDF:  English (pronunciation) (Spanish meaning).
Salida:             INSERT INTO phrases (english, spanish, category, level) VALUES ...
"""

import pdfplumber
import re
import sys

PDF_PATH = r"C:\Users\Gustavo\Downloads\El curso más completo de inglés.pdf"

# ── Mapeo de rangos de páginas a (categoría, nivel CEFR) ─────────────────────
# Las páginas están en base-1 (igual que en el PDF)
PAGE_RANGES = [
    # (page_start, page_end, category, level)
    (8,  12, "Vocabulario del salón",    "A1"),
    (10, 12, "Saludos y presentaciones", "A1"),
    (13, 16, "Verbos y pronombres",      "A1"),
    (17, 21, "Sustantivos",              "A1"),
    (22, 28, "Adverbios y artículos",    "A1"),
    (29, 37, "Verbos regulares",         "A1"),
    (34, 38, "Verbos irregulares",       "A2"),
    (38, 52, "Adjetivos y opuestos",     "A2"),
    (41, 52, "Preposiciones",            "A2"),
    (53, 65, "Pronombres posesivos",     "A2"),
    (56, 58, "Pronombres demostrativos", "A2"),
    (62, 65, "Uso del -ing",             "A2"),
    (66, 80, "Presente progresivo",      "A2"),
    (68, 80, "Presente simple",          "A2"),
    (72, 80, "Palabras interrogativas",  "A2"),
    (81, 95, "Adverbios de frecuencia",  "B1"),
    (84, 95, "Comparativos",             "B1"),
    (93, 95, "Superlativos",             "B1"),
    (96, 121,"Pronombres",               "B1"),
    (106,121,"Cuantificadores",          "B1"),
    (121,158,"Futuro y pasado",          "B1"),
    (124,128,"Do and make",              "B1"),
    (147,154,"Conectores",               "B1"),
    (159,182,"Presente/Pasado perfecto", "B2"),
    (165,175,"Verbos modales",           "B2"),
    (176,178,"Voz pasiva",               "B2"),
    (179,185,"Condicionales",            "B2"),
    (183,204,"Estructuras avanzadas",    "B2"),
    (195,200,"Prefijos",                 "B2"),
    (200,203,"Phrasal Verbs",            "B2"),
    (203,204,"Expresiones comunes",      "B2"),
]

def get_category_level(page_1based: int):
    """Retorna (category, level) para una página dada. Usa el rango más específico."""
    best = (None, None, 999)  # (category, level, range_size)
    for (ps, pe, cat, lvl) in PAGE_RANGES:
        if ps <= page_1based <= pe:
            size = pe - ps
            if size < best[2]:
                best = (cat, lvl, size)
    return best[0] or "Vocabulario", best[1] or "A1"


def clean_text(s: str) -> str:
    """Normaliza texto extraído del PDF."""
    s = re.sub(r'\s+', ' ', s).strip()
    # Elimina puntos y espacios al final (ej: "friend. . ." → "friend")
    s = re.sub(r'[\s.]+$', '', s).strip()
    return s


# Correcciones de palabras inglesas que el PDF escribió con acentos fonéticos
ENGLISH_FIXES = {
    'Péncil':           'Pencil',
    'Péncil case':      'Pencil case',
    'Péncil sharpener': 'Pencil sharpener',
    'péncil':           'pencil',
}

def fix_english(s: str) -> str:
    return ENGLISH_FIXES.get(s, s)


# Entradas meta del curso que no son vocabulario real
META_ENTRIES = {
    'example', 'word', 'pronunciation', 'meaning',
    'classroom vocabulary', 'vocabulary', 'introductions',
}

def is_meta(english: str) -> bool:
    return english.lower() in META_ENTRIES


# Patrón principal:  English stuff (pronunciation) (spanish meaning)
# Variantes:
#   Teacher (ti...cher) (maestro, profesor).
#   What is your name? (Jwat is iur neim?) (¿Cuál es tu nombre?)
#   In pencil (in péncil) (a lápiz).
# El patrón es: texto_inglés (pron) (español)
# Nota: la pronunciación puede tener puntos internos (ti...cher) pero la
# anotación española siempre empieza con minúscula o ¿ y va entre paréntesis.

VOCAB_RE = re.compile(
    r'([A-Z][^\(]{1,60}?)'       # English: empieza con mayúscula, hasta 60 chars
    r'\s*\([^)]{2,40}\)'          # (pronunciation) — ignoramos esto
    r'\s*\(([^)]{2,100})\)',      # (Spanish meaning) — este sí lo guardamos
    re.UNICODE
)

# Patrón alternativo para dos palabras por línea (columnas):
# Work (work) (trabajo). Baby (beibi) (bebe).
# El regex principal ya debería capturarlas si las líneas están en orden.


def extract_vocab(pdf_path: str):
    entries = []   # list of (english, spanish, category, level)
    seen = set()   # para desduplicar

    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for idx, page in enumerate(pdf.pages):
            page_num = idx + 1          # base-1
            if page_num < 8 or page_num > 204:
                continue                # Intro/outro — sin vocabulario
            text = page.extract_text()
            if not text:
                continue

            category, level = get_category_level(page_num)

            # Busca todos los matches en la página
            for m in VOCAB_RE.finditer(text):
                english_raw = m.group(1).strip().rstrip('.')
                spanish_raw = m.group(2).strip().rstrip('.')

                # Filtros básicos
                if len(english_raw) < 2 or len(spanish_raw) < 2:
                    continue
                # Descarta si parece una frase de ejemplo muy larga (> 60 chars)
                if len(english_raw) > 65:
                    continue
                # Descarta líneas que son instrucciones del curso
                if any(w in english_raw.lower() for w in ['mailxmail', 'curso', 'leccion', 'unidad']):
                    continue

                english = fix_english(clean_text(english_raw))
                spanish = clean_text(spanish_raw)

                if is_meta(english):
                    continue

                # Filtra entradas que no son vocabulario real
                # 1) Tablas de conjugación: "Go. Went. Gone" o "Stopping. omit"
                if re.search(r'\.\s+\S', english):
                    continue
                # 2) Etiquetas con dos puntos
                if ':' in english:
                    continue
                # 3) Empieza en español (instrucciones mezcladas)
                if re.match(r'^(Se |El |La |Los |Las |Un |Una )', english):
                    continue
                # 4) Demasiadas palabras (probablemente oración de ejemplo larga)
                if len(english.split()) > 8:
                    continue
                # 5) Contiene números de lista tipo "2)"
                if re.search(r'\d\)', english):
                    continue
                # 6) Fill-in-the-blank con puntos suspensivos del libro
                if ' . ' in english or english.endswith(' .'):
                    continue
                # 7) Meta-título (ej: "Abreviaturas Abbreviations")
                if re.search(r'(Abreviatura|Abbreviation)', english, re.I):
                    continue
                # 8) Comillas dobles en la entrada (garbled)
                if '"' in english:
                    continue

                # Deduplica por texto inglés
                key = english.lower()
                if key in seen:
                    continue
                seen.add(key)

                entries.append((english, spanish, category, level))

    return entries


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def generate_sql(entries):
    lines = [
        "-- Vocabulario extraído de 'El curso más completo de inglés' (Omar Ali Caldela)",
        "-- Importar en Supabase → SQL Editor",
        "",
        "INSERT INTO phrases (english, spanish, category, level) VALUES",
    ]
    rows = []
    for english, spanish, category, level in entries:
        e = sql_escape(english)
        s = sql_escape(spanish)
        c = sql_escape(category)
        rows.append(f"  ('{e}', '{s}', '{c}', '{level}')")
    lines.append(",\n".join(rows) + ";")
    return "\n".join(lines)


if __name__ == "__main__":
    print("Extrayendo vocabulario del PDF...", file=sys.stderr)
    entries = extract_vocab(PDF_PATH)
    print(f"Total de entradas: {len(entries)}", file=sys.stderr)

    # Muestra resumen por nivel
    from collections import Counter
    levels = Counter(e[3] for e in entries)
    cats   = Counter(e[2] for e in entries)
    print("\nPor nivel:", dict(sorted(levels.items())), file=sys.stderr)
    print("Por categoría:", dict(cats.most_common(10)), file=sys.stderr)

    sql = generate_sql(entries)
    out_path = r"C:\Users\Gustavo\Documents\ProyectoEnglish\english-app\scripts\vocab_import.sql"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(sql)
    print(f"\nSQL guardado en: {out_path}", file=sys.stderr)

    # Muestra las primeras 20 entradas como preview
    print("\n── Preview (primeras 20) ──", file=sys.stderr)
    for e, s, c, l in entries[:20]:
        print(f"  [{l}] {c} | {e!r} → {s!r}", file=sys.stderr)

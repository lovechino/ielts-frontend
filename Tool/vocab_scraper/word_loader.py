import os
import csv
import urllib.request
from .constants import OXFORD_CSV_URL

def load_word_list(level: str) -> list[str]:
    """Load words from the txt file for the given CEFR level."""
    # Path relative to the backend project structure
    vocab_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend", "app", "scripts", "vocab"))
    os.makedirs(vocab_dir, exist_ok=True)
    vocab_file = os.path.join(vocab_dir, f"words_{level.lower()}.txt")
    
    words = []
    if os.path.exists(vocab_file):
        words = _read_local_words(vocab_file)
            
    if len(words) < 500:
        words = _fetch_and_cache_oxford(level, vocab_file, words)

    if not words:
        raise FileNotFoundError(f"Word list not found and fetch failed for level: {level}")

    return words

def _read_local_words(file_path: str) -> list[str]:
    with open(file_path, "r", encoding="utf-8") as f:
        return [
            line.strip().lower()
            for line in f
            if line.strip() and not line.startswith("#")
        ]

def _fetch_and_cache_oxford(level: str, vocab_file: str, existing_words: list) -> list[str]:
    print(f"  [+] Fetching Oxford 5000 for {level}...")
    try:
        req = urllib.request.Request(OXFORD_CSV_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            lines = response.read().decode('utf-8').splitlines()
            reader = csv.reader(lines)
            next(reader)  # skip header
            
            fetched_words = set(existing_words)
            for row in reader:
                if len(row) == 3 and row[2].strip().lower() == level.lower():
                    fetched_words.add(row[0].strip().lower())
            
            words = sorted(list(fetched_words))
            _save_to_cache(vocab_file, words)
            return words
    except Exception as e:
        print(f"  [!] Failed to fetch Oxford 5000: {e}")
        return existing_words

def _save_to_cache(file_path: str, words: list):
    with open(file_path, "w", encoding="utf-8") as f:
        for w in words:
            f.write(w + "\n")
    print(f"  [+] Updated cache: {file_path}")

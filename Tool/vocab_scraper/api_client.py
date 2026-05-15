import httpx
import asyncio
from .constants import DICT_API, MAX_RETRIES, RETRY_DELAY, TOPIC_MAP

async def fetch_word_details(word: str, client: httpx.AsyncClient) -> dict | None:
    """Fetch word details from dictionaryapi.dev with retry logic."""
    url = DICT_API.format(word=word)
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 404:
                return None
            if response.status_code == 429:
                await asyncio.sleep(RETRY_DELAY * attempt)
                continue
            if response.status_code != 200:
                return None
            return _parse_api_response(word, response.json())
        except (httpx.TimeoutException, httpx.ConnectError):
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY)
    return None

def _parse_api_response(word: str, data: list) -> dict | None:
    """Extract relevant fields from dictionaryapi.dev response."""
    if not data or not isinstance(data, list):
        return None
    entry = data[0]
    meanings = entry.get("meanings", [])
    if not meanings:
        return None
    
    result = _initialize_result(word, entry)
    first_meaning = meanings[0]
    result["part_of_speech"] = first_meaning.get("partOfSpeech", "")
    
    _extract_definitions(result, first_meaning)
    result["synonyms"] = first_meaning.get("synonyms", [])[:5]
    result["antonyms"] = first_meaning.get("antonyms", [])[:5]
    
    return result if result["definition"] else None

def _initialize_result(word: str, entry: dict) -> dict:
    return {
        "word": entry.get("word", word).lower(),
        "definition": "",
        "example": "",
        "pronunciation": _extract_phonetic(entry),
        "part_of_speech": "",
        "synonyms": [],
        "antonyms": [],
        "topic": TOPIC_MAP.get(word.lower(), "General"),
    }

def _extract_definitions(result: dict, meaning: dict):
    definitions = meaning.get("definitions", [])
    if definitions:
        first_def = definitions[0]
        result["definition"] = first_def.get("definition", "")
        result["example"] = first_def.get("example", "")

def _extract_phonetic(entry: dict) -> str:
    """Get the best phonetic text from an API entry."""
    if entry.get("phonetic"):
        return entry["phonetic"]
    for p in entry.get("phonetics", []):
        if p.get("text"):
            return p["text"]
    return ""

async def fetch_replacement_words(word: str, client: httpx.AsyncClient) -> list[str]:
    """Fetch similar words from Datamuse API to use as replacements."""
    url = f"https://api.datamuse.com/words?ml={word}&max=15"
    try:
        response = await client.get(url, timeout=5.0)
        if response.status_code == 200:
            return [item["word"] for item in response.json() if " " not in item["word"]]
    except Exception:
        pass
    return []

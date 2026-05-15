import asyncio
import httpx
from .api_client import fetch_word_details, fetch_replacement_words
from .db_handler import get_session_maker, save_vocabulary
from .word_loader import load_word_list

async def run_scraper(level: str, test_mode: bool, delay: float) -> None:
    """Main scraping orchestrator."""
    words = load_word_list(level)
    if test_mode:
        words = words[:10]

    session_maker = get_session_maker()
    stats = {"saved": 0, "skipped": 0, "failed": 0}
    failed_words = []
    processed_words = set(words)

    _print_header(level, len(words), test_mode, delay)

    async with httpx.AsyncClient() as client:
        # Phase 1: Primary Words
        for i, word in enumerate(words, 1):
            await _process_word(word, i, len(words), level, session_maker, client, stats, failed_words, delay)
            
        # Phase 2: Replacements
        if failed_words:
            await _process_replacements(failed_words, level, session_maker, client, stats, processed_words, delay)

    _print_summary(stats, len(words))

def _print_header(level, total, test_mode, delay):
    print(f"\n{'='*50}")
    print(f"  CEFR Level : {level} | Total: {total} | Test: {test_mode} | Delay: {delay}s")
    print(f"{'='*50}\n")

async def _process_word(word, idx, total, level, session_maker, client, stats, failed_words, delay):
    print(f"  [{idx:>4}/{total}] {word:<25}", end="", flush=True)
    details = await fetch_word_details(word, client)
    
    if not details:
        stats["failed"] += 1
        print("✗ not found")
        failed_words.append(word)
    else:
        async with session_maker() as session:
            inserted = await save_vocabulary(session, details, level)
        if inserted:
            stats["saved"] += 1
            print(f"✓ saved  [{details['topic']}]")
        else:
            stats["skipped"] += 1
            print("~ exists")
            
    await asyncio.sleep(delay)

async def _process_replacements(failed_words, level, session_maker, client, stats, processed, delay):
    print(f"\n  [!] Attempting replacements for {len(failed_words)} words...\n")
    while failed_words:
        original = failed_words.pop(0)
        print(f"  [+] Replacing '{original}'... ", end="", flush=True)
        replacements = await fetch_replacement_words(original, client)
        
        found = False
        for rep in replacements:
            if rep in processed: continue
            processed.add(rep)
            
            details = await fetch_word_details(rep, client)
            if not details: continue
                
            async with session_maker() as session:
                if await save_vocabulary(session, details, level):
                    print(f"✓ Replaced with '{rep}' [{details['topic']}]")
                    stats["saved"] += 1
                    stats["failed"] -= 1
                    found = True
                    break
        if not found: print(f"✗ No replacement found.")
        await asyncio.sleep(delay)

def _print_summary(stats, total):
    print(f"\n{'='*50}")
    print(f"  ✓ Saved   : {stats['saved']}")
    print(f"  ~ Skipped : {stats['skipped']}")
    print(f"  ✗ Failed  : {stats['failed']}")
    print(f"  Total     : {total}")
    print(f"{'='*50}\n")

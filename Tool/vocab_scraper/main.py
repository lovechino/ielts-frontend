import asyncio
import argparse
import sys
from .engine import run_scraper
from .constants import VALID_LEVELS

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scrape vocabulary by CEFR level using dictionaryapi.dev"
    )
    parser.add_argument(
        "--level", "-l",
        default="A1",
        choices=VALID_LEVELS,
        help="CEFR level (A1, A2, B1, B2, C1)"
    )
    parser.add_argument(
        "--test", "-t",
        action="store_true",
        help="Test mode: only process first 10 words"
    )
    parser.add_argument(
        "--delay", "-d",
        type=float,
        default=1.0,
        help="Delay between API calls in seconds (default: 1.0)"
    )
    args = parser.parse_args()
    
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(run_scraper(args.level, args.test, args.delay))

if __name__ == "__main__":
    main()

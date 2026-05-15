@echo off
:: Vocabulary Scraper Shortcut
:: Usage: .\run [level] [additional_args]
:: Example: .\run B2 --test

set LEVEL=%1
if "%LEVEL%"=="" set LEVEL=A1

:: Shift arguments to pass the rest to the python script
shift
set REST_ARGS=%1 %2 %3 %4 %5

echo [+] Running Scraper for Level: %LEVEL% %REST_ARGS%
echo.

:: Run using the venv python
.\venv\Scripts\python.exe -m vocab_scraper.main --level %LEVEL% %REST_ARGS%

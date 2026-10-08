"""Setup: python -m pip install -r tests/requirements.txt
Install browsers: python -m playwright install chromium webkit

Run: python tests/run_browser_checks.py
Optional: URPS_TEST_ENGINES=chromium or webkit; URPS_TEST_ARTIFACTS=/path/to/screenshots.
Tests use a local server and isolated browser profiles, never production storage.
"""
import os
import tempfile
import threading
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ENGINES = os.environ.get("URPS_TEST_ENGINES", "chromium,webkit").split(",")
ARTIFACTS = Path(os.environ.get("URPS_TEST_ARTIFACTS", tempfile.mkdtemp(prefix="urps-checks-")))
ARTIFACTS.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@contextmanager
def environment():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            yield playwright, f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        server.server_close()

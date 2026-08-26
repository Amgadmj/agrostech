"""Static server for site/ with HTTP Range support.

Python's stdlib SimpleHTTPRequestHandler ignores Range headers, so a browser
cannot seek inside a video it serves. The hero video has to start at 8 s, which
is a seek, so it silently stayed at 0. This adds 206 Partial Content.

    python serve_site.py [port]
"""
import os
import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")


class RangeRequestHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        size = os.fstat(f.fileno()).st_size
        m = RANGE_RE.fullmatch(rng.strip())
        if not m:
            f.close()
            self.send_error(400, "Malformed Range header")
            return None

        start_s, end_s = m.group(1), m.group(2)
        if start_s:
            start = int(start_s)
            end = int(end_s) if end_s else size - 1
        else:
            # suffix form: bytes=-N means the last N bytes
            if not end_s:
                f.close()
                self.send_error(400, "Malformed Range header")
                return None
            start = max(0, size - int(end_s))
            end = size - 1

        if start >= size:
            f.close()
            self.send_response(416, "Requested Range Not Satisfiable")
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        end = min(end, size - 1)
        f.seek(start)
        self.send_response(206, "Partial Content")
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()  # adds Accept-Ranges
        return _Bounded(f, end - start + 1)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def copyfile(self, source, outputfile):
        # A browser scrubbing or re-seeking a video aborts the connection mid-stream.
        # That is normal, not a server fault, so it must not surface as a traceback.
        try:
            super().copyfile(source, outputfile)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def log_message(self, fmt, *args):
        pass


class _Bounded:
    """File wrapper that stops after `remaining` bytes, for copyfile()."""

    def __init__(self, fp, remaining):
        self.fp = fp
        self.remaining = remaining

    def read(self, n=-1):
        if self.remaining <= 0:
            return b""
        if n is None or n < 0 or n > self.remaining:
            n = self.remaining
        chunk = self.fp.read(n)
        self.remaining -= len(chunk)
        return chunk

    def close(self):
        self.fp.close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")
    handler = partial(RangeRequestHandler, directory=root)
    print(f"serving {root} on http://localhost:{port}")
    # Threading matters here: streaming a large video on a single-threaded server
    # blocks every other request, including the page itself.
    ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()

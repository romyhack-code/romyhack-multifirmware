#!/usr/bin/env python3
"""Servidor local para Termux o Kali con los tipos MIME de AppCache correctos."""
import argparse
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class HostHandler(SimpleHTTPRequestHandler):
    extensions_map = dict(SimpleHTTPRequestHandler.extensions_map, **{
        '.manifest': 'text/cache-manifest',
        '.appcache': 'text/cache-manifest',
        '.js': 'application/javascript',
        '.bin': 'application/octet-stream',
    })

    def end_headers(self):
        if self.path.split('?', 1)[0].lower().endswith(('.manifest', '.appcache')):
            self.send_header('Cache-Control', 'no-cache')
        return super().end_headers()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=8092)
    ap.add_argument('--bind', default='0.0.0.0')
    args = ap.parse_args()
    handler = partial(HostHandler, directory=str(ROOT))
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print('ROMYHACK Multi-Firmware: http://IP-DEL-DISPOSITIVO:%d/' % args.port, flush=True)
        print('Sirviendo desde: %s' % ROOT, flush=True)
        print('Para detener: Ctrl + C', flush=True)
        server.serve_forever()


if __name__ == '__main__':
    main()

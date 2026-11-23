#!/usr/bin/env python3
"""Importa hosts upstream sin mezclar ni modificar sus ejecutables.

Uso:
    python bootstrap.py              # versiones verificadas al crear este paquete
    python bootstrap.py --latest     # nuevas versiones upstream (revisar antes de usar)
    python bootstrap.py --force      # reemplazar hosts importados
    python bootstrap.py --latest --force
"""
import argparse
import pathlib
import shutil
import subprocess
import tempfile
import sys
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent
HOSTS = ROOT / 'hosts'
UPSTREAMS = (
    {
        'name': 'MPS ROMYHACK 14.00',
        'url': 'https://github.com/romyhack-code/mps.git',
        'commit': 'c5274fd80dcf3eb908e00baa5f4a182e31db9611',
        'repo': 'mps',
        'subdir': '.',
        'dest': 'mps14',
    },
    {
        'name': 'GamerHack G2All',
        'url': 'https://github.com/GamerHack/GamerHack.github.io.git',
        'commit': '52edf4c347a407c58880304b9c17d0c4cc6aace0',
        'repo': 'gamerhack',
        'subdir': 'g2all',
        'dest': 'g2all',
    },
)


def run(*args):
    print('>', ' '.join(str(a) for a in args), flush=True)
    subprocess.run(args, check=True)


def git_clone(source, outdir, latest):
    run('git', 'clone', '--quiet', '--depth', '1', source['url'], str(outdir))
    if not latest:
        sha = source['commit']
        got = subprocess.check_output(['git', '-C', str(outdir), 'rev-parse', 'HEAD'], text=True).strip()
        if got != sha:
            run('git', '-C', str(outdir), 'fetch', '--quiet', '--depth', '1', 'origin', sha)
            run('git', '-C', str(outdir), 'checkout', '--quiet', '--detach', 'FETCH_HEAD')
    return subprocess.check_output(['git', '-C', str(outdir), 'rev-parse', 'HEAD'], text=True).strip()


def clean_copy(src, dest):
    shutil.copytree(src, dest, ignore=shutil.ignore_patterns('.git', '.github'))


def validate_path(path):
    if not path.exists():
        raise RuntimeError('Falta archivo esencial: ' + str(path))


def check_manifest(manifest, root):
    missing = []
    in_cache = False
    for raw in manifest.read_text(encoding='utf-8-sig').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or line == 'CACHE MANIFEST':
            continue
        if line == 'CACHE:':
            in_cache = True
            continue
        if line in ('NETWORK:', 'FALLBACK:', 'SETTINGS:'):
            in_cache = False
            continue
        if not in_cache:
            continue
        entry = line.replace('\\', '/')
        path = (manifest.parent / entry).resolve()
        if not path.is_relative_to(root.resolve()) and not path.is_relative_to(root.parent.resolve()):
            missing.append('Fuera del directorio: ' + entry)
        elif not path.exists():
            missing.append(entry)
    return missing


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--latest', action='store_true', help='Importa el HEAD actual; no los commits fijados en este paquete')
    p.add_argument('--force', action='store_true', help='Reemplaza hosts importados anteriormente')
    args = p.parse_args()
    HOSTS.mkdir(exist_ok=True)

    paths = [HOSTS / x['dest'] for x in UPSTREAMS]
    if any(x.exists() for x in paths) and not args.force:
        print('Ya existen módulos importados. Para reemplazarlos utiliza: python bootstrap.py --force')
        sys.exit(2)

    imported = {}
    with tempfile.TemporaryDirectory(prefix='romyhack-import-') as t:
        temp = pathlib.Path(t)
        # Se prepara todo en un directorio temporal para evitar dejar módulos a medias.
        stage = temp / 'stage'
        stage.mkdir()
        for source in UPSTREAMS:
            print('\nIMPORTANDO:', source['name'], flush=True)
            repo = temp / source['repo']
            sha = git_clone(source, repo, args.latest)
            source_folder = repo / source['subdir']
            validate_path(source_folder / 'index.html')
            clean_copy(source_folder, stage / source['dest'])
            imported[source['dest']] = (source['url'], sha)

            if source['dest'] == 'g2all':
                # G2All usa recursos ../style.css y ../img.jpg; preservar ubicación.
                for filename in ('style.css', 'img.jpg'):
                    validate_path(repo / filename)
                    shutil.copy2(repo / filename, stage / filename)

        # Normalización exclusiva de URLs AppCache: "\\" no es un separador URL
        # portable. El código JS, HTML y los binarios originales no se modifican.
        manifests = sorted((stage / 'g2all').glob('*.manifest'))
        if not manifests:
            raise RuntimeError('No se encontraron manifiestos de caché G2All')
        for manifest in manifests:
            original = manifest.read_text(encoding='utf-8')
            if '\\' in original:
                manifest.write_text(original.replace('\\', '/'), encoding='utf-8')
                print('Normalizadas rutas:', manifest.name)

        essentials = [
            stage / 'mps14' / 'index.html',
            stage / 'mps14' / 'cache.html',
            stage / 'mps14' / 'cache.appcache',
            stage / 'mps14' / 'goldhen.bin',
            stage / 'g2all' / 'index.html',
            stage / 'g2all' / 'cacheslopkit.html',
            stage / 'g2all' / 'slopkit' / 'jb.js',
            stage / 'g2all' / 'slopkit' / 'patches' / '1402.bin',
            stage / 'g2all' / 'goldhen_2.4b18.14.bin',
        ]
        for f in essentials:
            validate_path(f)
        for f in [stage / 'mps14' / 'cache.appcache'] + manifests:
            missing = check_manifest(f, stage)
            if missing:
                print('ERROR: el manifiesto tiene referencias ausentes:', f, '\n' + '\n'.join(missing))
                sys.exit(3)
        print('Integridad de recursos y manifiestos: OK')

        # Al recibir --force, los archivos existentes se archivan para recuperación.
        for name in ('mps14', 'g2all'):
            target = HOSTS / name
            if target.exists():
                saved = HOSTS / (name + '.bak')
                if saved.exists():
                    shutil.rmtree(saved)
                target.rename(saved)
            shutil.move(str(stage / name), str(target))
        for name in ('style.css', 'img.jpg'):
            shutil.copy2(stage / name, HOSTS / name)

    with (ROOT / 'UPSTREAM_VERSIONS.txt').open('w', encoding='utf-8') as f:
        f.write('ROMYHACK Multi-Firmware — fuentes importadas\n')
        f.write('Fecha UTC: ' + datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S') + '\n')
        f.write('Modo: ' + ('latest' if args.latest else 'commits fijados') + '\n\n')
        for name, (url, sha) in imported.items():
            f.write(name + ': ' + url + '\nCommit: ' + sha + '\n\n')
        f.write('Se normalizaron barras de URL en manifiestos g2all cuando correspondia.\n')
        f.write('Los módulos originales conservan créditos y avisos del código fuente.\n')
    print('\nLISTO. Inicia con: python server.py')
    print('Al publicar en GitHub Pages, sube también la carpeta hosts completa.')


if __name__ == '__main__':
    main()

"""Copy the BZIK container-house minisite into the showreel as the "Your own minisite" proposal.

Source: arcviz-concepts/bzik-container-site (index.html, site.css, js/, assets/)
Output: tools/container-minisite/
    python3 sales-tools/build_container_site.py
"""
from pathlib import Path
import shutil

HERE = Path(__file__).resolve().parent
SRC = Path.home() / 'Documents/arcviz-concepts/bzik-container-site'
OUT = HERE.parent / 'tools' / 'container-minisite'


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC, OUT, ignore=shutil.ignore_patterns('.DS_Store', 'tools', 'README.md'))
    size = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
    print(f'Copied {OUT.relative_to(HERE.parent)}: {size/1e6:.1f} MB')


if __name__ == '__main__':
    main()

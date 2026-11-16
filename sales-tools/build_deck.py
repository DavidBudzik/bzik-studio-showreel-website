"""Package the Container House interactive presentation as showreel tool 06.

Source: Container House/output/process-presentation/index.html (+ media/, assembly film)
Output: tools/container-presentation/ (index.html, media/)
Upgrades: the 1200 px clay overview is replaced by the 1920 px hi-fi clay render;
the 24 MB assembly film is re-encoded at 720p.
    python3 sales-tools/build_deck.py
"""
from pathlib import Path
import re, shutil, subprocess

HERE = Path(__file__).resolve().parent
CH = Path.home() / 'Documents/arcviz-concepts/Container House/output'
SRC = CH / 'process-presentation'
OUT = HERE.parent / 'tools' / 'container-presentation'
FILM = CH / 'isometric-assembly/Container-House-Pastel-Assembly-72s.mp4'
HIFI_CLAY = CH / 'hifi-v12/clay/11-deck-exterior.png'


def main():
    html = (SRC / 'index.html').read_text()
    (OUT / 'media').mkdir(parents=True, exist_ok=True)
    # Hi-fi upgrade: clay overview 1200 px -> 1920 px Blender clay render.
    from PIL import Image
    Image.open(HIFI_CLAY).convert('RGB').save(OUT / 'media/clay-11-deck-exterior.jpg', quality=86, optimize=True)
    assert 'media/r-clay.jpg' in html
    html = html.replace('media/r-clay.jpg', 'media/clay-11-deck-exterior.jpg')
    # Assembly film: keep it next to the deck.
    film_out = OUT / 'media/assembly-72s-720.mp4'
    if not film_out.exists():
        subprocess.run(['/opt/homebrew/bin/ffmpeg', '-v', 'error', '-y', '-i', str(FILM), '-an', '-vf', 'scale=1280:-2',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                        str(film_out)], check=True)
    old = '../isometric-assembly/Container-House-Pastel-Assembly-72s.mp4'
    assert old in html
    html = html.replace(old, 'media/assembly-72s-720.mp4')
    # Copy every top-level media file: some paths are built in the deck's JS ('media/'+name+'.jpg').
    for src in (SRC / 'media').iterdir():
        if src.is_file() and not src.name.startswith('.'):
            shutil.copy2(src, OUT / 'media' / src.name)
    for name in set(re.findall(r'media/([A-Za-z0-9._-]+)', html)):
        assert (OUT / 'media' / name).exists(), name
    (OUT / 'index.html').write_text(html)
    size = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
    print(f'Packaged {OUT.relative_to(HERE.parent)}: {size/1e6:.1f} MB')


if __name__ == '__main__':
    main()

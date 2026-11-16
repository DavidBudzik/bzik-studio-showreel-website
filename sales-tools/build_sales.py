"""Turn the white-label minisite into the BZIK sales-tools showreel.

Always rebuilds from the frozen baseline, so it is safe to re-run:
    python3 sales-tools/build_sales.py

Patches both copies of the app/CSS (the live <script>/<style> and the copies in
PORTFOLIO_BUNDLE that 'Export HTML' uses), embeds the Moor House 360 tour,
the Container House clay/finished pairs and the RZ plan steps.
"""
from pathlib import Path
import base64, io, json, re, shutil, subprocess, tempfile

from PIL import Image

HERE = Path(__file__).resolve().parent
SITE = HERE.parent
TARGET = SITE / 'White-Label-Minisite.html'
BASELINE = SITE / 'White-Label-Minisite.before-sales-tools-2026-11-08.html'
DOCS = Path.home() / 'Documents'
TOUR = DOCS / 'ChatGPT/White label website/moor-house-360'
HIFI = DOCS / 'arcviz-concepts/Container House/output/hifi-v12'
RZ = DOCS / 'img2-interior/rz-plan'
CLAY_PAIRS = ['01-open-plan', '02-living', '04-kitchen', '07-main-bedroom', '11-deck-exterior', '12-upper-terrace']
# Container House project images -> hi-fi Blender renders (same model as the drawings).
CONTAINER_IMAGES = {'container': '11-deck-exterior', 'container-card': '11-deck-exterior', 'container-dusk': '02-living',
                    'container-interior': '01-open-plan', 'container-terrace': '12-upper-terrace'}


def webp_uri(img, width=None, q=76, crop=None):
    im = Image.open(img) if not isinstance(img, Image.Image) else img
    im = im.convert('RGB')
    if crop:
        im = im.crop(crop)
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=q, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()


def pano_uri(path):
    # 4096 x 2048 is the safe WebGL texture size on phones and tablets.
    with tempfile.TemporaryDirectory() as t:
        out = Path(t) / 'p.webp'
        subprocess.run(['cwebp', '-quiet', '-q', '72', '-resize', '4096', '2048', str(path), '-o', str(out)], check=True)
        return 'data:image/webp;base64,' + base64.b64encode(out.read_bytes()).decode()


def tour_html():
    v = (TOUR / 'viewer.html').read_text()
    for css in ['vendor/pannellum.css', 'tour.css']:
        v = v.replace(f'<link rel="stylesheet" href="{css}">', '<style>' + (TOUR / css).read_text() + '</style>')
    tour_js = (TOUR / 'tour.js').read_text()
    for a in sorted(set(re.findall(r'assets/[\w.-]+', tour_js))):
        tour_js = tour_js.replace(a, pano_uri(TOUR / a))
    for js, code in [('vendor/pannellum.js', (TOUR / 'vendor/pannellum.js').read_text()), ('tour.js', tour_js)]:
        v = v.replace(f'<script src="{js}"></script>', '<script>' + code + '</script>')
    assert 'src="vendor' not in v and 'href="vendor' not in v
    return v


def sales_assets():
    shots = {x['id']: x for x in json.loads((HIFI / 'clay/render-manifest.json').read_text())['shots']}
    clay = [{'title': shots[i]['title'],
             'clay': webp_uri(HIFI / 'clay' / f'{i}.png', 1920, q=74),
             'hi': webp_uri(HIFI / 'final' / f'{i}.jpg', 1920, q=80)} for i in CLAY_PAIRS]
    cmp = Image.open(RZ / 'compare_original_vs_clean.png')
    rz = {'orig': webp_uri(cmp, 1600, crop=(0, 0, 1385, cmp.height)),
          'clean': webp_uri(RZ / 'clean_plan.png', 1600),
          'poster': webp_uri(HERE / 'assets' / 'rz-iso-poster.png', 1600)}
    return {'clay': clay, 'rz': rz}


def drop_function(app, name):
    start = app.index(f'function {name}(){{')
    end = app.index('\n', start)
    return app[:start] + app[end + 1:]


def sub1(s, old, new):
    assert s.count(old) == 1, (old, s.count(old))
    return s.replace(old, new)


def main():
    if not BASELINE.exists():
        shutil.copy2(TARGET, BASELINE)
    src = BASELINE.read_text()
    m = re.search(r'window.PORTFOLIO_BUNDLE\s*=\s*', src)
    bundle, blen = json.JSONDecoder().raw_decode(src[m.end():])
    app0, css0 = bundle['app'], bundle['css']

    app = drop_function(drop_function(app0, 'home'), 'studio')
    # Project pages become tool pages.
    app = sub1(app, "${text(p+'type',s.type,'div','eyebrow')}${text(p+'name',s.name,'h1')}${text(p+'summary',s.summary,'p')}", "${toolHead(i)}")
    app = sub1(app, """<a class="eyebrow" href="${href('home','work')}">Back to selected work</a>""", """<a class="eyebrow" href="${href('home','tools')}">Back to tools</a>""")
    app = sub1(app, '<section class="project-info reveal">', '${salesBlock(i)}<section class="project-info reveal">')
    app = sub1(app, """<span class="eyebrow">Next project / ${String(next).padStart(2,'0')}</span><div><h2>${E(title(next))}</h2>""",
               """<span class="eyebrow">Next tool / ${String(next).padStart(2,'0')}</span><div><h2>${E(toolTitle(next))}</h2>""")
    app = sub1(app, '${drawings(i)}', '${projectDemo(i)}${drawings(i)}')
    app = sub1(app, '<a class="text-link drawings-jump"',
               '${i===1&&B.moorTour?`<a class="text-link drawings-jump demo-jump" href="#moor-tour" data-scroll="moor-tour">Explore in 360°</a>`:i===4?`<a class="text-link drawings-jump demo-jump" href="#compare" data-scroll="compare">Clay → reality</a>`:\'\'}<a class="text-link drawings-jump"')
    # Hebrew hooks: editable texts and titles resolve per language.
    app = sub1(app, "const text=(k,f,tag='span',cl='')=>`<${tag} class=\"${cl}\" data-edit=\"${E(k)}\">${E(data.texts[k]??f)}</${tag}>`;",
               "const text=(k,f,tag='span',cl='')=>`<${tag} class=\"${cl}\" data-edit=\"${E(lk(k))}\">${E(tv(k,f))}</${tag}>`;")
    app = sub1(app, "const title=i=>data.texts['p'+i+'-name']??samples[i-1].name;", "const title=i=>tv('p'+i+'-name',samples[i-1].name);")
    app = sub1(app, "function render(){const r=route();", "function render(){applyLang();const r=route();")
    app = sub1(app, "r==='studio'?'Studio':data.texts.brand)+' — Architecture & Interiors'",
               "r==='studio'?'About':data.texts.brand)+(curLang()==='he'?' — כלי מכירה אינטראקטיביים לנדל״ן':' — Interactive sales tools for real estate')")
    app = sub1(app, "email:'hello@yourstudio.com'", "email:'bzik.david@gmail.com'")
    app = sub1(app, "location:'Your city, country'", "location:'Israel'")
    # Villa Baor walkthrough-film page as its own route.
    app = sub1(app, "['home','studio','guide','project-1','project-2','project-3','project-4']", "['home','studio','guide','project-1','project-2','project-3','project-4','villa-baor']")
    app = sub1(app, "r==='guide'?guide():project(+r.at(-1))", "r==='guide'?guide():r==='villa-baor'?baorPage():project(+r.at(-1))")
    app = sub1(app, "(r.startsWith('project-')?title(+r.at(-1)):", "(r==='villa-baor'?'Villa Baor':r.startsWith('project-')?title(+r.at(-1)):")
    # Section anchors (#work, #tools, #contact) in the single-file build.
    app = sub1(app, "if(h==='contact')return 'studio';", "if(h==='contact')return 'studio';if(h==='work'||h==='tools')return 'home';")
    app = sub1(app, "(anchor==='contact'?'#contact':'#'+r)", "(anchor?'#'+anchor:'#'+r)")
    app = sub1(app, "if(location.hash==='#work')return;render();if(location.hash!=='#contact')scrollTo(0,0)",
               "const ah=['#work','#tools','#contact'],el=document.getElementById(location.hash.slice(1));if(ah.includes(location.hash)&&el){el.scrollIntoView();return}render();if(!ah.includes(location.hash))scrollTo(0,0)")
    app = sub1(app, "if(location.hash==='#work'||location.hash==='#contact')", "if(['#work','#tools','#contact'].includes(location.hash))")
    tail = '})();'
    assert app.rstrip().endswith(tail)
    cut = app.rstrip().rfind(tail)
    app = app[:cut] + (HERE / 'sales-he.js').read_text() + '\n' + (HERE / 'sales.js').read_text() + '\n' + app[cut:]
    css = css0 + (HERE / 'sales.css').read_text()

    bundle['app'], bundle['css'] = app, css
    bundle['moorTour'] = tour_html()
    bundle['sales'] = sales_assets()
    bundle['images']['baor-hero'] = webp_uri(Path.home() / 'Projects/bzik-portfolio-static/video/villa-baor-hero-poster.jpg', 1920, q=80)
    import sys; sys.path.insert(0, str(HERE)); import build_rz_iso, build_deck, build_container_site; build_rz_iso.main(); build_deck.main(); build_container_site.main()
    BAOR = Path.home() / 'Projects/bzik-portfolio-static'
    titles = ['Meadow', 'Pool axis', 'Bronze glass', 'Hero terrace', 'Olive path', 'Whole house', 'Living room']
    bundle['sales']['baor'] = [{'title': t, 'clay': webp_uri(BAOR / f'img/p2/shot{n}-clay.jpg', 1400, q=74),
                                'hi': webp_uri(BAOR / f'img/p2/shot{n}-render.jpg', 1400, q=80),
                                'frame': webp_uri(BAOR / f'img/p2/shot{n}-frame.jpg', 960, q=72)} for n, t in enumerate(titles, 1)]
    (SITE / 'media/baor').mkdir(parents=True, exist_ok=True)
    for n in range(1, 8):
        shutil.copy2(BAOR / f'video/baor-{n}.mp4', SITE / f'media/baor/shot{n}.mp4')
    shutil.copy2(BAOR / 'video/villa-baor-sequence.mp4', SITE / 'media/villa-baor-sequence.mp4')
    bundle['sales']['deck'] = {'poster': webp_uri(HERE / 'assets' / 'deck-cover.png', 1600)}
    bundle['sales']['minisite'] = {'poster': webp_uri(HERE / 'assets' / 'minisite-site.png', 1680)}
    for key, shot in CONTAINER_IMAGES.items():
        assert key in bundle['images'], key
        bundle['images'][key] = webp_uri(HIFI / 'final' / f'{shot}.jpg', 1920, q=82)
    ser = json.dumps(bundle, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    out = src[:m.end()] + ser + src[m.end() + blen:]
    out = sub1(out, '<script>' + app0 + '</script>', '<script>' + app + '</script>')
    out = sub1(out, '<style id="embeddedStyle">' + css0 + '</style>', '<style id="embeddedStyle">' + css + '</style>')
    for a, b in [
        ('<a data-route="home" data-anchor="work" href="index.html#work">Selected work</a>',
         '<a data-route="home" data-anchor="tools" href="index.html#tools">Tools</a>'),
        ('<a data-route="studio" href="studio.html">Studio</a>', '<a data-route="studio" href="studio.html">About</a>'),
        ('href="studio.html#contact">Contact</a>', 'href="studio.html#contact">Send a plan</a>'),
        ('BZIK · Concept studies', 'BZIK · Interactive sales tools'),
        ('<button class="edit-toggle" id="edit"', '<button class="lang-toggle" id="langToggle" type="button" lang="he" aria-label="מעבר לעברית">עברית</button><button class="edit-toggle" id="edit"'),
        ('</head>', '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500&display=swap" rel="stylesheet"></head>'),
    ]:
        out = sub1(out, a, b)
    out = re.sub(r'<meta name="description" content="[^"]*"',
                 '<meta name="description" content="BZIK builds interactive sales tools for real-estate teams: 360° walkthroughs, interactive floor plans, clay-to-reality comparisons and branded minisites."', out, count=1)
    TARGET.write_text(out)
    print(f'Wrote {TARGET.name}: {len(out)/1e6:.1f} MB')


if __name__ == '__main__':
    main()

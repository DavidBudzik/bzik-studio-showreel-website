"""Adapt the RZ interactive isometric plan to the BZIK showreel design.

Source: img2-interior/rz-plan/production/06_exports/html/BZIK_Residence_Animated_Preview.html
Output: tools/rz-isometric.html (loaded in an iframe; '#he' switches the UI to Hebrew).
The geometry, renderer and animation are untouched; only styling, chrome and labels change.
    python3 sales-tools/build_rz_iso.py
"""
from pathlib import Path
import json

HERE = Path(__file__).resolve().parent
SRC = Path.home() / 'Documents/img2-interior/rz-plan/production/06_exports/html/BZIK_Residence_Animated_Preview.html'
OUT = HERE.parent / 'tools' / 'rz-isometric.html'

CSS = r"""
<style id="bzik-skin">
:root{--paper:#f3f3f0;--sheet:#f3f3f0;--ink:#131313;--ink2:#555552;--rule:#ddddd8;--vermilion:#e97faa;--display:Satoshi,'Helvetica Neue',Arial,sans-serif;--mono:Satoshi,'Helvetica Neue',Arial,sans-serif}
html[lang=he] body{--display:Heebo,'Arial Hebrew',Satoshi,sans-serif;--mono:Heebo,'Arial Hebrew',Satoshi,sans-serif}
body{padding:0;background:var(--paper);-webkit-font-smoothing:antialiased}
.sheet{border:0;max-width:none;background:transparent}
.mast{grid-template-columns:1fr;border:0}.brand{display:none}
.topcontrols{border:0!important;padding:14px 20px 10px;gap:10px}
.topcontrols>.eyebrow{display:none}
.eyebrow{font:500 11px/1.5 var(--display);letter-spacing:.04em;text-transform:none;color:var(--ink2)}
button{font:500 13px var(--display)!important;letter-spacing:0!important;text-transform:none!important;border:1px solid var(--rule)!important;border-radius:999px;background:#fff;padding:10px 16px;min-height:44px;color:var(--ink)}
button+button{border-left:1px solid var(--rule)}
button[aria-pressed=true],button.active{background:var(--ink)!important;color:#fff!important;border-color:var(--ink)!important}
button:hover:not([aria-pressed=true]):not(.active){background:#ebebe7}
.switch{border:0;gap:8px}.camera-grid{gap:8px}
.layercontrols label,.orbit-switch,.hint,.motionbar,.legend,.meta,.schedule button,.sidebar .arealabel{font-family:var(--display)!important;letter-spacing:0!important}
.layercontrols label{font-size:13px;font-weight:500}.layercontrols input,.orbit-switch input,.motionbar input{accent-color:#e97faa}
.orbit-switch{border:1px solid var(--rule);border-radius:999px;padding:9px 14px;background:#fff;font-size:13px;font-weight:500}
.hint{font-size:12px}
.motionbar{border:0;border-top:1px solid var(--rule);padding:10px 20px;font-size:13px;background:var(--paper)}
.motionbar select{border-radius:999px;background:#fff;padding:8px 12px;border:1px solid var(--rule)}
.scene-wrap{border:0}.scene-head{border-bottom:1px solid var(--rule)}
.field{background:#fff}
.roomlabel{font:500 11px/1.15 var(--display);border:1px solid var(--rule);border-radius:999px;background:#ffffffe6;padding:5px 10px}
.roomlabel:hover,.roomlabel.selected{background:#f2a4c3;color:var(--ink);border-color:#f2a4c3}
.little{background:#fff;border:0;border-radius:999px;gap:4px;padding:4px}.little button{padding:6px 12px;min-height:36px}
.sidebar{border:1px solid var(--rule);border-radius:10px;background:#fffffff7;box-shadow:0 12px 40px #0002;width:260px}
.sidebar h2{font:500 24px/1.05 var(--display);text-transform:none;letter-spacing:-.01em}
.sidebar p{font-size:13px}.sidebar .close{min-height:32px;padding:4px 10px}
.scalebar{border-color:var(--ink)}
.footer{border-top:1px solid var(--rule);grid-template-columns:1.4fr .8fr}.footer>section:nth-child(3){display:none}
.footer>section+section{border-left:1px solid var(--rule)}
.footer h3{font:500 13px var(--display);text-transform:none;letter-spacing:0}
.schedule button{border:0!important;border-bottom:1px solid var(--rule)!important;border-radius:0;background:none;min-height:0;font-size:13px!important}
.schedule button:hover{color:#8e3159}
.sw{border-color:var(--rule);border-radius:3px}
.loading{font:500 14px var(--display)}
html[dir=rtl] .topcontrols,html[dir=rtl] .motionbar,html[dir=rtl] .footer,html[dir=rtl] .sidebar{direction:rtl}
html[dir=rtl] .field{direction:ltr}
/* embedded: compact chrome, plan fills the frame */
.hint,.scene-head{display:none!important}
.topcontrols{flex-direction:row;flex-wrap:wrap;align-items:center;gap:8px 14px;padding:10px 16px}
.topcontrols>.bar{width:auto}
.camera-grid{display:flex;width:auto}.camera-grid button{padding:8px 14px;min-height:38px}
.layercontrols{display:flex;flex-wrap:wrap;gap:6px 12px}
.orbit-switch{padding:7px 12px}
.motionbar{padding:8px 16px}.motionbar button{min-height:38px;padding:8px 14px}
.field{height:calc(100vh - 150px)!important;min-height:340px!important;max-height:none!important}
@media(max-width:960px){.footer{grid-template-columns:1fr}.footer>section+section{border-left:0;border-top:1px solid var(--rule)}}
</style>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500&display=swap" rel="stylesheet">
"""

HE = {
    '01 · South-East': '01 · דרום־מזרח', '02 · South-West': '02 · דרום־מערב', '03 · North-West': '03 · צפון־מערב', '04 · North-East': '04 · צפון־מזרח',
    'Walls': 'קירות', 'Furniture': 'ריהוט', 'Closets': 'ארונות', 'Glazing': 'זיגוג', 'Doors': 'דלתות', 'Terraces': 'מרפסות', 'People': 'דמויות', 'Labels': 'תוויות',
    'Manual orbit': 'סיבוב חופשי', 'Play': 'הפעלה', 'Pause': 'השהיה', '↺ Restart': '↺ מההתחלה', 'Time': 'זמן', 'Speed': 'מהירות',
    'Follow the walk': 'מעקב אחרי ההליכה', 'Show residence': 'הצגת הדירה', '+': '+', '−': '−', 'Reset': 'איפוס', 'Cut wall': 'קיר חתוך', 'Full wall': 'קיר מלא',
    '← Prev': '→ הקודם', 'Next →': 'הבא ←', 'DESCRIPTION': 'תיאור', 'DRAWING NOTES': 'הערות שרטוט',
    'Layout and furniture follow the current Blender scene. Room areas are retained plan annotations.': 'הפריסה והריהוט לפי סצנת ה־Blender. שטחי החדרים לפי סימוני התוכנית.',
    'Room schedule / Select a space': 'רשימת חדרים / בחרו חלל', 'Drawing key': 'מקרא',
    'Cut wall / hatch': 'קיר חתוך / קווקוו', 'Furniture / pastel clay': 'ריהוט / חימר פסטל', 'Joinery / pale oak': 'נגרות / אלון בהיר', 'Floor / pale stone 120': 'רצפה / אבן בהירה 120',
    'Floor / oak chevron': 'רצפה / אלון אדרה', 'Worktops / pale stone': 'משטחי עבודה / אבן בהירה', 'Island / dark marble': 'אי / שיש כהה', 'Doors / pastel blue': 'דלתות / כחול פסטל',
    'Plants / sage': 'צמחים / מרווה', 'Bath fixtures / pale mint': 'כלים סניטריים / מנטה בהירה', 'Terrace / timber deck': 'מרפסת / דק עץ',
    'Loading the residence…': 'טוען את הדירה…', 'BLENDER LAYOUT · ANIMATED PREVIEW': 'פריסת BLENDER · תצוגה מונפשת', '0 — 5 METERS': '0 — 5 מטר',
    'Living room': 'סלון', 'Kitchen + dining': 'מטבח ופינת אוכל', 'Master bath': 'חדר רחצה הורים', 'Master bathroom': 'חדר רחצה הורים', 'Walk-in closet': 'חדר ארונות',
    'Suite passage': 'מעבר סוויטה', 'Master bedroom': 'חדר שינה הורים', 'Bathroom': 'חדר רחצה', 'Guest foyer': 'מבואת אורחים', 'Guest room': 'חדר אורחים',
    "Ofer's study": 'חדר העבודה של עופר', 'Hall / work nook': 'מסדרון / פינת עבודה', 'Guest WC': 'שירותי אורחים', 'Laundry': 'כביסה', 'North terrace': 'מרפסת צפונית',
    'Lounge terrace': 'מרפסת ישיבה', 'Lounge': 'אזור ישיבה', 'Open living area': 'חלל מגורים פתוח', 'Terrace': 'מרפסת', 'Room focus': 'מיקוד חדר',
    'The lounge uses the supplied furniture collection at the existing Blender layout positions. The walking route follows the open aisle.': 'הסלון מרוהט לפי המיקומים בסצנת ה־Blender. מסלול ההליכה עובר במעבר הפתוח.',
    'Kitchen, island and dining positions match the Blender scene. The second character stands in the working aisle.': 'המטבח, האי ופינת האוכל תואמים את סצנת ה־Blender. הדמות השנייה עומדת במעבר העבודה.',
    'Principal sleeping room, south-side wardrobe storage and pale textile furnishings.': 'חדר השינה הראשי, ארונות בצד הדרומי וטקסטיל בהיר.',
    'Glass shower enclosure, floating vanity and slate-colour wet-room finishes.': 'מקלחון זכוכית, ארון כיור תלוי וגימורים בגוון צפחה.',
    'Double-sided storage arrangement between master suite and hall.': 'אחסון דו־צדדי בין סוויטת ההורים למסדרון.',
    'Workstation and sage floor finish. Glazing opens the room towards the exterior.': 'עמדת עבודה ורצפה בגוון מרווה. הזיגוג פותח את החדר החוצה.',
    'Secondary sleeping accommodation with fitted cabinetry and private entry approach.': 'חדר שינה נוסף עם נגרות מובנית וכניסה פרטית.',
    'Continuous deck connecting living, kitchen and private suite.': 'דק רציף שמחבר בין הסלון, המטבח וסוויטת ההורים.',
    'Spatial arrangement, wall openings, furniture and finishes based on the submitted plan.': 'סידור החלל, הפתחים, הריהוט והגימורים לפי התוכנית שהוגשה.',
    'DRAG TO ORBIT · SHIFT-DRAG / RIGHT-DRAG TO PAN · SCROLL TO ZOOM': 'גררו לסיבוב · Shift־גרירה להזזה · גלילה לזום',
    'DRAG TO PAN · SCROLL TO ZOOM · ENABLE ORBIT TO ROTATE': 'גררו להזזה · גלילה לזום · הפעילו סיבוב חופשי כדי לסובב',
}

SCRIPT = """
<script>
(()=>{const he=/he/.test(location.hash);if(!he)return;document.documentElement.lang='he';document.documentElement.dir='rtl';
const D=%s;
const tr=s=>{const t=s.trim();if(!t)return null;if(D[t])return s.replace(t,D[t]);let m;
 if(m=t.match(/^(.*) m² · plan note$/))return m[1]+' מ״ר';
 if(m=t.match(/^(A-2\\d\\d) \\/ ISOMETRIC CUTAWAY \\/ (.+?) · (\\d) OF 4$/))return m[1]+' / חתך איזומטרי / '+m[3]+' מתוך 4';
 if(/^A-2XX \\/ MANUAL ORBIT/.test(t))return 'A-2XX / סיבוב חופשי';return null};
const walk=root=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.parentElement?.closest('script,style'))continue;const r=tr(n.nodeValue);if(r!==null&&r!==n.nodeValue)n.nodeValue=r}};
const go=()=>{walk(document.body);new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData'){const r=tr(m.target.nodeValue);if(r!==null&&r!==m.target.nodeValue)m.target.nodeValue=r}else m.addedNodes.forEach(x=>x.nodeType===1?walk(x):x.nodeType===3&&x.parentElement&&walk(x.parentElement))}}).observe(document.body,{childList:true,subtree:true,characterData:true})};
document.readyState==='loading'?addEventListener('DOMContentLoaded',go):go()})();
</script>
"""


def main():
    src = SRC.read_text()
    assert src.count('</head>') == 1 and src.count('</body>') == 1
    out = src.replace('</head>', CSS + '</head>')
    out = out.replace('<title>BZIK / Residence — Vector Style Blender Preview', '<title>RZ apartment — interactive isometric plan')
    out = out.replace('</body>', SCRIPT % json.dumps(HE, ensure_ascii=False) + '</body>')
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(out)
    print(f'Wrote {OUT.relative_to(HERE.parent)}: {len(out)/1e6:.1f} MB')


if __name__ == '__main__':
    main()

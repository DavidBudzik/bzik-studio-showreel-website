"""Clearance checker for the A-101 plan sheets.
Furniture = <rect class="fine" fill="white"> inside the plan; doors = quarter arcs + leaf line;
windows = paired class="glass" lines; rooms = #fafafa/#f2f2f2 fill paths."""
import re,sys,json
EPS=0.01
def nums(s): return [float(v) for v in re.findall(r'-?\d+\.?\d*',s)]
def load(path,upm,cfg):
    t=open(path).read()
    rects=[tuple(map(float,m)) for m in re.findall(r'<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" class="fine" fill="white"/>',t)]
    rects=[(x,y,x+w,y+h) for x,y,w,h in rects if y<250 and x<290 and w>3 and h>3]   # drop title-block/scale bar
    lines=[tuple(map(float,m)) for m in re.findall(r'<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" class="fine" />',t)]
    glass=[tuple(map(float,m)) for m in re.findall(r'<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" class="glass" />',t)]
    rooms=[]
    for d in re.findall(r'<path d="([^"]+)" fill="#f[a2]f[a2]f[a2]"',t):
        v=nums(d); rooms.append(list(zip(v[0::2],v[1::2])))
    doors=[]
    for m in re.findall(r'<path d="M([\d.]+),([\d.]+) A([\d.]+),[\d.]+ 0 0 [01] ([\d.]+),([\d.]+)"',t):
        x0,y0,r,x1,y1=map(float,m)
        found=False
        for c in [(x0,y1),(x1,y0)]:
            if abs(((x0-c[0])**2+(y0-c[1])**2)**.5-r)<.1 and abs(((x1-c[0])**2+(y1-c[1])**2)**.5-r)<.1:
                # leaf line from hinge to open end
                for e_open,e_closed in [((x0,y0),(x1,y1)),((x1,y1),(x0,y0))]:
                    if any((abs(l[0]-c[0])<.1 and abs(l[1]-c[1])<.1 and abs(l[2]-e_open[0])<.1 and abs(l[3]-e_open[1])<.1) or
                           (abs(l[2]-c[0])<.1 and abs(l[3]-c[1])<.1 and abs(l[0]-e_open[0])<.1 and abs(l[1]-e_open[1])<.1) for l in lines):
                        doors.append(dict(h=c,open=e_open,closed=e_closed,r=r));found=True;break
                if found: break
    wins=[]
    for g in glass:
        x1,y1,x2,y2=g
        key=(min(x1,x2),max(x1,x2),min(y1,y2),max(y1,y2))
        wins.append(key)
    # merge glass pairs into one window
    W=[]
    for a in wins:
        horiz=abs(a[2]-a[3])<EPS
        for w in W:
            if w['horiz']==horiz and ((horiz and abs(w['a']-a[0])<EPS and abs(w['b']-a[1])<EPS and abs(w['c']-a[2])<6) or
                                      (not horiz and abs(w['a']-a[2])<EPS and abs(w['b']-a[3])<EPS and abs(w['c']-a[0])<6)):
                w['c2']=a[2] if horiz else a[0];break
        else:
            W.append(dict(horiz=horiz,a=a[0] if horiz else a[2],b=a[1] if horiz else a[3],c=a[2] if horiz else a[0]))
    return rects,doors,W,rooms
def inter(a,b): return a[0]<b[2]-EPS and b[0]<a[2]-EPS and a[1]<b[3]-EPS and b[1]<a[3]-EPS
def pip(p,poly):
    x,y=p;ins=False
    for i in range(len(poly)):
        (x1,y1),(x2,y2)=poly[i],poly[(i+1)%len(poly)]
        if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1: ins=not ins
    return ins
def check(path,upm,allow=(),band_m=1.2,small_band_m=0.75,win_m=0.45):
    rects,doors,W,rooms=load(path,upm,None)
    out=[]
    name=lambda r:f"rect[{r[0]:g},{r[1]:g} {r[2]-r[0]:g}x{r[3]-r[1]:g}u = {(r[2]-r[0])/upm:.2f}x{(r[3]-r[1])/upm:.2f}m]"
    for d in doors:
        hx,hy=d['h'];ox,oy=d['open'];cx,cy=d['closed'];r=d['r']
        sw=(min(hx,ox,cx),min(hy,oy,cy),max(hx,ox,cx),max(hy,oy,cy))
        dx,dy=(ox-hx)/r,(oy-hy)/r
        bands=[]
        for sgn in (1,-1):
            # rooms under 5 m2 get the reduced band
            probe=((hx+cx)/2+sgn*dx*5,(hy+cy)/2+sgn*dy*5)
            room=next((p for p in rooms if pip(probe,p)),None)
            if room is None: continue
            xs=[p[0] for p in room];ys=[p[1] for p in room]
            area=(max(xs)-min(xs))*(max(ys)-min(ys))/upm/upm
            D=(small_band_m if area<5 else band_m)*upm
            ex,ey=hx+sgn*dx*D,hy+sgn*dy*D
            bands.append(((min(hx,cx,ex,cx+sgn*dx*D),min(hy,cy,ey,cy+sgn*dy*D),max(hx,cx,ex,cx+sgn*dx*D),max(hy,cy,ey,cy+sgn*dy*D)),D/upm))
        for rc in rects:
            if inter(rc,sw): out.append(f"DOOR-SWING  {name(rc)} inside swing of door hinged at {d['h']}")
            else:
                for b,D in bands:
                    if inter(rc,b): out.append(f"DOOR-BAND   {name(rc)} inside {D:.2f} m approach band of door hinged at {d['h']}")
    for w in W:
        lo,hi=w['a'],w['b'];c=w['c'];c2=w.get('c2',c)
        D=win_m*upm
        box=(lo,min(c,c2)-D,hi,max(c,c2)+D) if w['horiz'] else (min(c,c2)-D,lo,max(c,c2)+D,hi)
        for rc in rects:
            if inter(rc,box) and not any(all(abs(rc[i]-a[i])<.05 for i in range(4)) for a in allow):
                out.append(f"WINDOW      {name(rc)} within {win_m} m of window {'N/S' if w['horiz'] else 'E/W'} span {lo:g}-{hi:g}")
    for i,a in enumerate(rects):
        for b in rects[i+1:]:
            if inter(a,b): out.append(f"OVERLAP     {name(a)} x {name(b)}")
        corners=[(a[0]+.01,a[1]+.01),(a[2]-.01,a[1]+.01),(a[0]+.01,a[3]-.01),(a[2]-.01,a[3]-.01)]
        if not any(all(pip(c,p) for c in corners) for p in rooms): out.append(f"OUTSIDE     {name(a)} not fully inside one room")
    return out,len(rects),len(doors),len(W)
if __name__=='__main__':
    cfg=json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
    upm=cfg.get('upm',20)
    allow=[tuple(a) for a in cfg.get('allow',[])]
    out,n,nd,nw=check(sys.argv[1],upm,allow)
    print(f"{sys.argv[1].split('/')[-1]}: {n} pieces, {nd} doors, {nw} windows -> {len(out)} findings")
    for o in out: print('  ',o)

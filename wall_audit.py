"""Wall audit: rasterise rooms, walls, glazing and door openings at 0.5 u, report gaps/overlaps and wall seams."""
import re,sys
def nums(s): return [float(v) for v in re.findall(r'-?\d+\.?\d*',s)]
def polys(t,pat):
    return [list(zip(*(iter(nums(d)),)*2)) for d in re.findall(pat,t)]
def raster(poly,g=2):
    xs=sorted({x for x,_ in poly});ys=sorted({y for _,y in poly})
    cells=set()
    x0,x1,y0,y1=int(min(xs)*g),int(max(xs)*g),int(min(ys)*g),int(max(ys)*g)
    for j in range(y0,y1):
        y=(j+.5)/g
        # scanline crossings of vertical edges
        cr=[]
        for i in range(len(poly)):
            (ax,ay),(bx,by)=poly[i],poly[(i+1)%len(poly)]
            if ax==bx and (ay>y)!=(by>y): cr.append(ax)
        cr.sort()
        for a,b in zip(cr[0::2],cr[1::2]):
            for i in range(int(round(a*g)),int(round(b*g))): cells.add((i,j))
    return cells
def main(path):
    t=open(path).read()
    walls=polys(t,r'<path d="([^"]+)" fill="url\(#p\d-plan-hatch\)"')
    rooms=polys(t,r'<path d="([^"]+)" fill="#f[a2]f[a2]f[a2]"')
    W=[raster(p) for p in walls]; R=[raster(p) for p in rooms]
    allW=set().union(*W); allR=set().union(*R)
    # wall-wall seams: cells of different wall polygons that touch (shared edge drawn twice)
    seams=[]
    for a in range(len(W)):
        for b in range(a+1,len(W)):
            for (i,j) in W[a]:
                for di,dj in ((1,0),(-1,0),(0,1),(0,-1)):
                    if (i+di,j+dj) in W[b]: seams.append(((i+max(di,0))/2 if di else None,(j+max(dj,0))/2 if dj else None,(i/2,j/2))); break
    ov=allW&allR
    print(path.split('/')[-1],'walls',len(W),'rooms',len(R),'room∩wall cells',len(ov),'seam cells',len(seams))
    if ov: 
        xs=[c[0]/2 for c in ov];ys=[c[1]/2 for c in ov];print('  overlap bbox',min(xs),min(ys),max(xs)+.5,max(ys)+.5)
    # group seams by line
    from collections import defaultdict
    g=defaultdict(list)
    for x,y,c in seams:
        if x is not None: g[('x',x)].append(c[1])
        else: g[('y',y)].append(c[0])
    for k,v in sorted(g.items()): print('  seam',k,'span',min(v),max(v)+.5)
if __name__=="__main__": main(sys.argv[1])
def gaps(path):
    t=open(path).read()
    walls=polys(t,r'<path d="([^"]+)" fill="url\(#p\d-plan-hatch\)"')
    rooms=polys(t,r'<path d="([^"]+)" fill="#f[a2]f[a2]f[a2]"')
    cov=set()
    for p in walls+rooms: cov|=raster(p)
    xs=[c[0] for c in cov];ys=[c[1] for c in cov]
    free=set((i,j) for i in range(min(xs),max(xs)+1) for j in range(min(ys),max(ys)+1))-cov
    # keep only holes enclosed by the envelope bbox interior (not outside)
    comps=[];seen=set()
    for c in free:
        if c in seen: continue
        st=[c];comp=[];seen.add(c)
        while st:
            a=st.pop();comp.append(a)
            for d in ((1,0),(-1,0),(0,1),(0,-1)):
                b=(a[0]+d[0],a[1]+d[1])
                if b in free and b not in seen: seen.add(b);st.append(b)
        bx=(min(x for x,_ in comp)/2,min(y for _,y in comp)/2,max(x for x,_ in comp)/2+.5,max(y for _,y in comp)/2+.5)
        if bx[0]>min(xs)/2 and bx[1]>min(ys)/2 and bx[2]<max(xs)/2+.5 and bx[3]<max(ys)/2+.5: comps.append(bx)
    print(path.split('/')[-1],'uncovered pockets (x0,y0,x1,y1):')
    for b in sorted(comps): print('  ',b, f'{(b[2]-b[0])}x{(b[3]-b[1])}u')
if __name__=='__main__' and len(sys.argv)>2: gaps(sys.argv[1])

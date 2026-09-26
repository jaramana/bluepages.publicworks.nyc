import json,re,random,urllib.request,urllib.parse as up,concurrent.futures as cf
d=json.load(open('agencies.json'))
def url(r):
    u=r.get('url'); return u.get('url') if isinstance(u,dict) else u
rows=[(r['name'],r['organization_type'],url(r)) for r in d if url(r)]
random.seed(3)
nyc=[x for x in rows if '/site/' in x[2]]
oth=[x for x in rows if '/site/' not in x[2]]
sample=random.sample(nyc,25)+random.sample(oth,15)
UA={'User-Agent':'Mozilla/5.0 (research; publicworks.nyc)'}
def probe(x):
    name,t,u=x
    try:
        h=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=20).read().decode('utf8','ignore')
    except Exception as e: return (name,t,u,'ERR '+type(e).__name__,[],None)
    imgs=[m for m in re.findall(r'<img[^>]+>',h) if re.search(r'logo',m,re.I)]
    srcs=[re.search(r'src="([^"]+)"',m).group(1) for m in imgs if re.search(r'src="([^"]+)"',m)]
    og=re.search(r'property="og:image"\s+content="([^"]+)"',h)
    svg=len(re.findall(r'<svg[^>]*logo',h,re.I))
    return (name,t,u,'ok',srcs[:3],(og.group(1) if og else None),svg)
with cf.ThreadPoolExecutor(12) as ex:
    for r in ex.map(probe,sample): print(json.dumps(r))

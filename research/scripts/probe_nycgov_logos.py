import json,re,urllib.request,urllib.parse as up,concurrent.futures as cf,collections,os
d=json.load(open('agencies.json'))
def url(r):
    u=r.get('url'); return u.get('url') if isinstance(u,dict) else u
rows=[(r['name'],r['organization_type'],url(r)) for r in d if url(r) and '/site/' in url(r)]
UA={'User-Agent':'Mozilla/5.0 (research; publicworks.nyc)'}
def probe(x):
    name,t,u=x
    try: h=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=25).read().decode('utf8','ignore')
    except Exception as e: return (name,t,u,None,'ERR')
    m=re.search(r'src="(/assets/[^"]+/images/content/header/[^"]+)"',h)
    return (name,t,u,up.urljoin(u,m.group(1).strip()) if m else None,'ok')
with cf.ThreadPoolExecutor(12) as ex: res=list(ex.map(probe,rows))
json.dump(res,open('nycgov_logos.json','w'),indent=1)
c=collections.Counter(('logo' if r[3] else r[4]) for r in res); print(c)
ext=collections.Counter(os.path.splitext(up.urlparse(r[3]).path)[1].lower() for r in res if r[3]); print(ext)
uniq=len(set(r[3] for r in res if r[3])); print('unique logo files',uniq)
by=collections.defaultdict(lambda:[0,0])
for r in res: by[r[1]][0]+=1; by[r[1]][1]+= bool(r[3])
for k,v in by.items(): print(k,v)
print('missing:',[r[0] for r in res if not r[3]][:40])

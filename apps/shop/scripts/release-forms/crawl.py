"""Crawl every Coral Club country site and record each product's
release-form block(s). Resumable: one JSONL file per host in data/."""
import json,os,re,sys,time,threading,requests,concurrent.futures as cf
sys.path.insert(0,os.path.dirname(__file__))
from parse import parse_product
UA={'User-Agent':'Mozilla/5.0 (release-form-export)'}
os.makedirs('data',exist_ok=True)
countries=json.load(open('countries.json'))
sess=threading.local()
def get(url,tries=3):
    s=getattr(sess,'s',None) or requests.Session()
    sess.s=s
    for i in range(tries):
        try:
            r=s.get(url,headers=UA,timeout=40)
            if r.status_code==200: return r
            if r.status_code in (404,410): return None
        except Exception: pass
        time.sleep(1.5*(i+1))
    return None
def crawl(c):
    host,lang=c['host'],c['lang']
    path=f"data/{host}.jsonl"
    done={}
    if os.path.exists(path):
        for l in open(path,encoding='utf8'):
            d=json.loads(l); done[d['slug']]=d
    listing=get(f"https://{host}/shop/?language={lang}")
    if not listing: print('LISTING FAIL',host,flush=True); return host,0,0
    final=re.match(r'https?://[^/]+',listing.url).group(0)
    slugs=sorted(set(re.findall(r'href="/shop/([^"/?#]+)\.html',listing.text)))
    todo=[s for s in slugs if s not in done]
    with open(path,'a',encoding='utf8') as f:
        for s in todo:
            r=get(f"{final}/shop/{s}.html?language={lang}")
            if not r: rec={'slug':s,'url':f"{final}/shop/{s}.html",'name':'','blocks':[],'error':True}
            else:
                name,blocks=parse_product(r.text)
                rec={'slug':s,'url':f"{final}/shop/{s}.html",'name':name,'blocks':blocks}
            f.write(json.dumps(rec,ensure_ascii=False)+'\n'); f.flush()
            time.sleep(0.05)
    return host,len(slugs),len(todo)
only=set(sys.argv[1:])
cs=[c for c in countries if not only or c['host'] in only]
with cf.ThreadPoolExecutor(16) as ex:
    for host,n,new in ex.map(crawl,cs):
        print('done',host,n,'products',new,'fetched',flush=True)
print('ALL DONE',flush=True)

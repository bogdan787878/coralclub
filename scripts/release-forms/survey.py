import json,re,requests,concurrent.futures as cf
UA={'User-Agent':'Mozilla/5.0'}
C=json.load(open('countries.json'))
def probe(c):
    base=f"https://{c['host']}"
    try:
        r=requests.get(f"{base}/shop/?language={c['lang']}",headers=UA,timeout=25,allow_redirects=True)
        prods=set(re.findall(r'href="(/shop/[^"/?#]+\.html)',r.text))
        return {**c,'status':r.status_code,'final':r.url,'products':len(prods)}
    except Exception as e:
        return {**c,'status':'ERR','final':str(e)[:60],'products':0}
with cf.ThreadPoolExecutor(12) as ex:
    out=list(ex.map(probe,C))
json.dump(out,open('survey.json','w'),ensure_ascii=False,indent=1)
for o in sorted(out,key=lambda x:-x['products']):
    print(o['host'].ljust(24),o['country'][:22].ljust(23),o['status'],o['products'],o['final'][:50] if o['final']!=f"https://{o['host']}/shop/?language={o['lang']}" else '')

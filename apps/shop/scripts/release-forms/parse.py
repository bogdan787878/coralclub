import re,html
from bs4 import BeautifulSoup
def clean(s): return re.sub(r'\s+',' ',html.unescape(s or '')).strip()
def parse_product(text):
    soup=BeautifulSoup(text,'html.parser')
    h1=soup.find('h1')
    name=clean(h1.get_text()) if h1 else ''
    blocks=[]
    for b in soup.select('.product-card__forms__blocks'):
        head=b.select_one('.form-header')
        vals=[clean(x.get_text()) for x in b.select('.choiceItems__container') if clean(x.get_text())]
        # colour/taste swatches may carry only data-color — keep text only
        if head and vals:
            blocks.append((clean(head.get_text()),vals))
    return name,blocks

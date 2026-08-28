
(function(){
  var h=document.querySelector('header');
  function onScroll(){h.classList.toggle('solid',window.scrollY>40)}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  function setLang(l){
    document.documentElement.lang=l;
    var t=document.getElementById('tr'),e=document.getElementById('en');
    if(t)t.classList.toggle('on',l==='tr');
    if(e)e.classList.toggle('on',l==='en');
    try{localStorage.setItem('yaylang',l)}catch(x){}
    if(window.loadNews)loadNews(l);
  }
  window.setLang=setLang;
  var initial='tr';
  try{var s=localStorage.getItem('yaylang');if(s)initial=s}catch(x){}
  setLang(initial);

  var b=document.getElementById('burger'),m=document.getElementById('menu');
  if(b&&m){b.addEventListener('click',function(){m.classList.toggle('open')});
    m.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){m.classList.remove('open')})});}

  var y=document.getElementById('yr'); if(y)y.textContent=new Date().getFullYear();

  var lb=document.getElementById('lb');
  if(lb){
    var lbi=lb.querySelector('img'), lbc=lb.querySelector('.cap');
    document.querySelectorAll('[data-big]').forEach(function(el){
      el.addEventListener('click',function(){
        lbi.src=el.getAttribute('data-big'); lbc.textContent=el.getAttribute('data-cap')||'';
        lb.classList.add('on'); document.body.style.overflow='hidden';
      });
    });
    function closeLb(){lb.classList.remove('on'); document.body.style.overflow=''}
    lb.addEventListener('click',closeLb);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeLb()});
  }
  if(document.querySelector('.snapsec')&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.documentElement.classList.add('snap');
  }

  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('on');io.unobserve(en.target)}})
  },{threshold:.12}):null;
  document.querySelectorAll('.rv').forEach(function(el){io?io.observe(el):el.classList.add('on')});
})();

/* news (index, TR only) */
(function(){
  var g1=document.getElementById('newsMevzuat'), g2=document.getElementById('newsBasin');
  if(!g1&&!g2){window.loadNews=function(){};return}
  var done={};
  function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}
  function tfetch(u){var c=new AbortController();var t=setTimeout(function(){c.abort()},6000);
    return fetch(u,{signal:c.signal}).finally(function(){clearTimeout(t)})}
  function fmt(d){try{var x=new Date(d);if(isNaN(x))return '';return x.toLocaleDateString('tr-TR',{day:'numeric',month:'short'})}catch(e){return ''}}
  function card(dd,src,link,t){return '<a class="news-card" href="'+esc(link)+'" target="_blank" rel="noopener">'+
    '<span class="meta"><span>'+esc(dd)+'</span><span class="src">'+esc(src)+'</span></span><h3>'+esc(t)+'</h3></a>'}
  function parse(xml,def,filter){
    var doc=new DOMParser().parseFromString(xml,'text/xml');
    var items=Array.prototype.slice.call(doc.querySelectorAll('item'));
    if(filter)items=items.filter(function(it){return filter((it.querySelector('link')||{}).textContent||'')});
    items=items.slice(0,6);
    if(!items.length)return null;
    return items.map(function(it){
      var t=((it.querySelector('title')||{}).textContent||'').replace(/\s+-\s+[^-]+$/,'');
      var link=(it.querySelector('link')||{}).textContent||'#';
      var src=(it.querySelector('source')||{}).textContent||def||'';
      return card(fmt((it.querySelector('pubDate')||{}).textContent||''),src,link,t);
    }).join('');
  }
  function chain(feedUrl,decoder,def,filter,target){
    var enc=encodeURIComponent(feedUrl);
    function get(base){return tfetch(base+enc).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
      .then(function(buf){return new TextDecoder(decoder).decode(buf)})
      .then(function(x){return parse(x,def,filter)})}
    function viaRss2json(){return tfetch('https://api.rss2json.com/v1/api.json?rss_url='+enc)
      .then(function(r){if(!r.ok)throw 0;return r.json()})
      .then(function(j){
        if(!j.items||!j.items.length)throw 0;
        var it=j.items;
        if(filter)it=it.filter(function(x){return filter(x.link||'')});
        it=it.slice(0,6); if(!it.length)throw 0;
        return it.map(function(x){return card(fmt(x.pubDate),def,x.link||'#',(x.title||'').replace(/\s+-\s+[^-]+$/,''))}).join('');
      })}
    var at=[viaRss2json,
            function(){return get('https://corsproxy.io/?url=')},
            function(){return get('https://api.allorigins.win/raw?url=')},
            function(){return get('https://api.codetabs.com/v1/proxy?quest=')}];
    (function nx(i){
      if(i>=at.length){target.innerHTML='<p class="news-empty">Şu an ulaşılamıyor. <a href="https://www.gib.gov.tr" target="_blank" rel="noopener" style="text-decoration:underline">GİB</a> ve <a href="https://www.resmigazete.gov.tr" target="_blank" rel="noopener" style="text-decoration:underline">Resmî Gazete</a> üzerinden takip edebilirsiniz.</p>';return}
      at[i]().then(function(h){if(!h)throw 0;target.innerHTML=h}).catch(function(){nx(i+1)});
    })(0);
  }
  window.loadNews=function(l){
    if(l!=='tr')return;
    if(!done.m&&g1){done.m=1;chain('https://www.alomaliye.com/feed/','utf-8','Alomaliye',null,g1)}
    if(!done.b&&g2){done.b=1;chain('https://www.muhasebetr.com/rss/','windows-1254','MuhasebeTR',function(link){return /ulusalbasin|yazarlarimiz|sorucevap/.test(link)},g2)}
  };
  loadNews(document.documentElement.lang||'tr');
})();

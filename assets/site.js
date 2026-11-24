// Links set per page before this file loads (see the small script in each page):
//   PLAY_URL   download link for the Windows build
//   VIDEO_URL  full walkthrough video
// Leave them empty to hide the buttons.
var PLAY_URL=window.PLAY_URL||'', VIDEO_URL=window.VIDEO_URL||'';
var SKIP_CLIPS=['beat2'];   // clips held back until they are re-recorded
(function(){
  var root=document.documentElement;
  var mq=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)');
  var reduce=!!(mq&&mq.matches);
  var TOP=116;   // height of the top bar plus the section bar
  var smooth=function(){return reduce?'auto':'smooth';};

  // Language: #zh in the address wins, then the visitor's last choice, then the browser's language.
  // (The same rule runs in each page's <head> so the first paint is already in the right language.)
  // Links to the other pages carry #zh along so the language stays the same.
  var pageLinks=[].slice.call(document.querySelectorAll('a[href]')).filter(function(a){
    var h=a.getAttribute('href'); return /^[\w-]+\.html(#.*)?$/.test(h);
  });
  pageLinks.forEach(function(a){a.setAttribute('data-href',a.getAttribute('href'));});
  var titleTag=document.querySelector('title'), titleEn=document.title, titleZh=titleTag&&titleTag.getAttribute('data-zh');
  var onLang=[];
  function setLang(zh){
    root.setAttribute('data-lang',zh?'zh':'en');
    root.lang=zh?'zh-CN':'en';
    document.getElementById('lang-en').setAttribute('aria-pressed',String(!zh));
    document.getElementById('lang-zh').setAttribute('aria-pressed',String(zh));
    if(titleZh) document.title=zh?titleZh:titleEn;
    // screenshots with on-screen text follow the page language
    [].forEach.call(document.querySelectorAll('img[data-zh]'),function(im){
      var want=im.getAttribute(zh?'data-zh':'data-en'); if(im.getAttribute('src')!==want) im.setAttribute('src',want);
    });
    pageLinks.forEach(function(a){
      var h=a.getAttribute('data-href');
      a.setAttribute('href', zh&&h.indexOf('#')<0 ? h+'#zh' : h);
    });
    onLang.forEach(function(f){f(zh);});
  }
  // Switching language keeps the paragraph you were reading where it was on screen.
  function anchor(){
    var el=document.elementFromPoint(innerWidth/2,TOP+24);
    while(el&&el!==document.body&&(el.hasAttribute('data-l')||el.closest('[data-l]'))) el=el.parentElement;
    return el&&el!==document.body?{el:el,top:el.getBoundingClientRect().top}:null;
  }
  function switchLang(zh){
    if(root.getAttribute('data-lang')===(zh?'zh':'en')) return;
    var a=anchor();
    function apply(){
      setLang(zh);
      if(a) window.scrollBy(0,a.el.getBoundingClientRect().top-a.top);
    }
    if(document.startViewTransition&&!reduce) document.startViewTransition(apply); else apply();
    try{ localStorage.setItem('lang',zh?'zh':'en'); }catch(e){}
    try{ history.replaceState(null,'',location.pathname+location.search+(zh?'#zh':'')); }catch(e){}
  }
  [].forEach.call(document.querySelectorAll('[data-setlang]'),function(b){
    b.addEventListener('click',function(){ switchLang(b.getAttribute('data-setlang')==='zh'); });
  });
  window.addEventListener('hashchange',function(){ if(location.hash==='#zh') setLang(true); });
  var saved=null; try{ saved=localStorage.getItem('lang'); }catch(e){}
  setLang(location.hash==='#zh'||saved==='zh'||(saved===null&&/^zh/i.test(navigator.language||'')));
  // The other language's screenshots load quietly once the page is idle, so switching shows them at once.
  (window.requestIdleCallback||function(f){setTimeout(f,1500);})(function(){
    [].forEach.call(document.querySelectorAll('img[data-zh]'),function(im){
      var other=im.getAttribute(root.getAttribute('data-lang')==='zh'?'data-en':'data-zh'); if(other) (new Image()).src=other;
    });
  });

  // On the homepage the name in the top bar glides back to the top instead of reloading.
  var home=document.querySelector('.bar .name');
  if(home&&document.getElementById('work')) home.addEventListener('click',function(e){ e.preventDefault(); window.scrollTo({top:0,behavior:smooth()}); });

  var tocLock=null;   // set while a section-bar click is scrolling, so the underline goes straight to the target
  [].forEach.call(document.querySelectorAll('[data-go]'),function(b){
    b.addEventListener('click',function(e){
      var el=document.getElementById(b.getAttribute('data-go'));
      if(!el) return;
      e.preventDefault();
      if(b.closest('.toc')&&tocLock) tocLock(b);
      el.scrollIntoView({behavior:smooth(),block:'start'});
    });
  });

  // Section bar on a project page: one underline slides to the section in view,
  // and on a narrow screen the bar scrolls itself so that section's name stays visible.
  var tocBar=document.querySelector('.toc');
  var toc=[].slice.call(document.querySelectorAll('.toc a[data-go]'));
  if(tocBar&&toc.length){
    var secs=toc.map(function(a){return document.getElementById(a.getAttribute('data-go'));});
    var ind=document.createElement('span'); ind.className='ind'; tocBar.appendChild(ind); tocBar.classList.add('js');
    var shown=null, held=null, heldTimer;
    function place(a){
      if(!a){ ind.style.opacity='0'; shown=null; return; }
      var jump=!shown;   // first appearance: no slide in from the left edge
      if(jump) ind.style.transition='none';
      ind.style.transform='translateX('+a.offsetLeft+'px) scaleX('+(a.offsetWidth/100)+')';
      ind.style.opacity='1';
      if(jump){ ind.getBoundingClientRect(); ind.style.transition=''; }
      if(shown!==a){
        var l=a.offsetLeft, r=l+a.offsetWidth;
        if(l<tocBar.scrollLeft||r>tocBar.scrollLeft+tocBar.clientWidth)
          tocBar.scrollTo({left:l-(tocBar.clientWidth-a.offsetWidth)/2,behavior:smooth()});
      }
      shown=a;
    }
    function mark(){
      var cur=null;
      if(held) cur=held;
      else secs.forEach(function(s,i){ if(s&&s.getBoundingClientRect().top<=TOP+34) cur=toc[i]; });
      toc.forEach(function(a){ a.classList.toggle('on',a===cur); });
      if(cur!==shown) place(cur);
    }
    function release(){ held=null; clearTimeout(heldTimer); mark(); }
    tocLock=function(a){
      held=a; mark();
      clearTimeout(heldTimer); heldTimer=setTimeout(release,2000);
    };
    // release when the scroll has arrived (the target is at the top, or the page can't scroll further)
    if('onscrollend' in window) window.addEventListener('scrollend',function(){
      if(!held) return;
      var s=secs[toc.indexOf(held)], t=s?s.getBoundingClientRect().top:TOP;
      if(Math.abs(t-TOP)<6||innerHeight+scrollY>=document.documentElement.scrollHeight-2) release();
    });
    // the visitor taking over the scroll ends the hold at once
    ['wheel','touchstart','keydown'].forEach(function(t){ window.addEventListener(t,function(){ if(held) release(); },{passive:true}); });
    var ticking=false;
    window.addEventListener('scroll',function(){ if(!ticking){ ticking=true; requestAnimationFrame(function(){ ticking=false; mark(); }); } },{passive:true});
    function remeasure(){ if(shown){ var a=shown; shown=null; place(a); } }
    window.addEventListener('resize',remeasure); onLang.push(function(){ requestAnimationFrame(remeasure); });
    mark();
  }

  // Walkthroughs: in each viewer the tabs, plan markers, pager and arrow keys all select the same beat.
  var viewers=[].map.call(document.querySelectorAll('.viewer'),function(box){
    var plan=box.querySelector('.plan');
    var tabs=[].slice.call(box.querySelectorAll('[role="tab"]'));
    var beats=[].slice.call(box.querySelectorAll('article.beat'));
    var marks=[].slice.call(plan.querySelectorAll('.bm'));
    var cur=0;
    // All beats share one cell, so switching never changes the viewer's height.
    beats.forEach(function(a){ a.hidden=false; });
    // The last beat's Next button leads on to the section after the walkthrough.
    var walk=box.closest('section'), after=null;
    toc.forEach(function(a,i){ if(walk&&a.getAttribute('data-go')===walk.id&&toc[i+1]) after=toc[i+1]; });
    beats.forEach(function(a,i){
      var back=a.querySelector('.pager [data-step="-1"]'), next=a.querySelector('.pager [data-step="1"]');
      if(i===0&&back) back.classList.add('gone');   // nothing to go back to: keep its place, hide it
      if(i===beats.length-1&&next){
        if(after){
          next.disabled=false; next.removeAttribute('data-step');
          var en=after.querySelector('[data-l="en"]'), zh=after.querySelector('[data-l="zh"]');
          next.innerHTML='<span data-l="en">Next: '+(en?en.textContent:'')+' ↓</span><span data-l="zh" lang="zh-CN">接着看：'+(zh?zh.textContent:'')+' ↓</span>';
          next.addEventListener('click',function(){ after.click(); });
        } else next.classList.add('gone');
      }
    });
    function select(n,opts){
      opts=opts||{};
      n=Math.max(1,Math.min(beats.length,n));
      var dir=!cur?'':n>cur?'from-next':n<cur?'from-prev':'';
      if(n===cur&&!opts.force) return;
      cur=n;
      beats.forEach(function(a){
        var on=Number(a.getAttribute('data-beat'))===n;
        a.classList.toggle('off',!on); a.inert=!on;
        if(on) a.removeAttribute('aria-hidden'); else a.setAttribute('aria-hidden','true');
        a.classList.remove('from-next','from-prev');
        if(on&&dir&&!reduce){ a.getBoundingClientRect(); a.classList.add(dir); }
      });
      tabs.forEach(function(t){var on=Number(t.getAttribute('data-beat'))===n;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;if(on&&opts.focus)t.focus();});
      marks.forEach(function(m){m.classList.toggle('on',Number(m.getAttribute('data-beat'))===n);});
      plan.setAttribute('data-phase',beats[n-1].getAttribute('data-phase'));
      // Pressing Back or Next at the foot of a long beat: bring the new beat's picture into view.
      if(opts.reveal){
        var top=beats[n-1].getBoundingClientRect().top;
        if(top<TOP) window.scrollBy({top:top-TOP-8,behavior:smooth()});
      }
      if(opts.focusNext){ var nb=beats[n-1].querySelector('.pager [data-step="1"]:not(.gone)')||beats[n-1].querySelector('.pager button:not(.gone):last-child'); if(nb) nb.focus({preventScroll:true}); }
      syncClips();
    }
    tabs.forEach(function(t){
      t.addEventListener('click',function(){select(Number(t.getAttribute('data-beat')));});
    });
    // Left and right arrows step through the beats from anywhere inside the viewer.
    box.addEventListener('keydown',function(e){
      if(e.altKey||e.ctrlKey||e.metaKey) return;
      var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0; if(!d) return;
      e.preventDefault();
      var onTab=document.activeElement&&document.activeElement.getAttribute('role')==='tab';
      select(cur+d,{focus:onTab});
    });
    marks.forEach(function(m){
      function go(){select(Number(m.getAttribute('data-beat')));}
      m.addEventListener('click',go);
      m.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
    });
    [].forEach.call(box.querySelectorAll('.pager [data-step]'),function(b){
      b.addEventListener('click',function(){select(cur+Number(b.getAttribute('data-step')),{reveal:true,focusNext:true});});
    });
    select(1);
    // data-clips on a viewer names its clip files: "beat" means media/beat1.mp4 and so on. No attribute, no clips.
    return {beats:beats,clips:box.getAttribute('data-clips')};
  });

  // Download and video buttons on a project page.
  (function(){
    var cta=document.getElementById('cta'); if(!cta) return;
    var any=false;
    [['play-link',PLAY_URL],['video-link',VIDEO_URL]].forEach(function(p){
      var a=document.getElementById(p[0]); if(a&&p[1]){a.href=p[1];a.hidden=false;any=true;}
    });
    cta.hidden=!any;
    // A large download starts after a pause: say so straight away, so nobody presses twice.
    var play=document.getElementById('play-link');
    if(play&&PLAY_URL){
      var label=play.innerHTML, t;
      play.addEventListener('click',function(){
        play.innerHTML='<span data-l="en">Starting download…</span><span data-l="zh" lang="zh-CN">正在开始下载…</span>';
        clearTimeout(t); t=setTimeout(function(){ play.innerHTML=label; },3000);
      });
    }
  })();

  // Copy the email address, for visitors without a mail app. The label confirms, then returns.
  [].forEach.call(document.querySelectorAll('.copy[data-copy]'),function(b){
    var t;
    b.addEventListener('click',function(){
      var text=b.getAttribute('data-copy');
      function done(){ b.classList.add('ok'); clearTimeout(t); t=setTimeout(function(){b.classList.remove('ok');},1800); }
      function pick(){ var m=b.parentNode.querySelector('.mail'), r=document.createRange(); r.selectNodeContents(m); var s=getSelection(); s.removeAllRanges(); s.addRange(r); }
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done,pick); else pick();
    });
  });

  // Moving to the next level: its picture travels into the next page's header.
  [].forEach.call(document.querySelectorAll('a.nextp'),function(a){
    a.addEventListener('click',function(){
      var im=a.querySelector('img'); if(!im) return;
      im.style.viewTransitionName=/exposure/.test(a.getAttribute('href'))?'shot-exposure':'shot-lantern';
    });
  });

  // Pictures that load after the page is up fade in instead of popping.
  [].forEach.call(document.querySelectorAll('img[loading="lazy"]'),function(im){
    if(im.complete||reduce) return;
    im.classList.add('ld');
    im.addEventListener('load',function(){ im.classList.add('ld-in'); requestAnimationFrame(function(){ im.classList.remove('ld'); }); },{once:true});
    im.addEventListener('error',function(){ im.classList.remove('ld'); },{once:true});
  });

  // Short clips replace stills when the files are there.
  // An <img data-clip="media/x.mp4"> gets that clip; walkthrough beats get media/<data-clips><n>.mp4.
  var seen=window.IntersectionObserver?new IntersectionObserver(function(es){
    es.forEach(function(e){ e.target._inView=e.isIntersecting; }); syncClips();
  }):null;
  function clip(img,src){
    var link=img.closest('a');
    if(link&&reduce) return;   // inside a link a clip can't offer play controls, so the still stays
    var v=document.createElement('video');
    v.muted=true; v.loop=true; v.playsInline=true; v.preload='metadata';
    v.setAttribute('muted',''); v.setAttribute('playsinline','');
    v.className='clip';
    v.poster=img.currentSrc||img.src; v.setAttribute('aria-label',img.alt);
    if(img.style.viewTransitionName) v.style.viewTransitionName=img.style.viewTransitionName;
    v.addEventListener('loadedmetadata',function(){
      if(!img.parentNode) return;
      var fig=img.parentNode;
      v.controls=reduce&&!link; v._inLink=!!link; v._still=img;
      fig.replaceChild(v,img);
      if(img.classList.contains('zoomable')) makeZoomable(v);
      // some clips show a different moment from the still, so they carry their own caption
      if(fig.getAttribute&&fig.getAttribute('data-clip-en')){
        var en=fig.querySelector('figcaption [data-l="en"]'), zh=fig.querySelector('figcaption [data-l="zh"]');
        if(en) en.textContent=fig.getAttribute('data-clip-en'); if(zh) zh.textContent=fig.getAttribute('data-clip-zh');
      }
      if(seen){ v._inView=true; seen.observe(v); }
      syncClips();
    });
    v.src=src;
  }
  // Only clips that are on screen play: hidden beats and clips scrolled away pause.
  function syncClips(){
    [].forEach.call(document.querySelectorAll('video.clip'),function(v){
      var art=v.closest('article.beat'), show=(!art||!art.classList.contains('off'))&&v._inView!==false&&!v._zoomed;
      if(show&&!reduce){
        if(v.paused){var p=v.play(); if(p&&p.catch)p.catch(function(){
          // autoplay refused: outside a link offer controls, inside a link put the still back
          if(v._inLink&&v._still&&v.parentNode) v.parentNode.replaceChild(v._still,v); else v.controls=true;
        });}
      }
      else if(!v.paused){ v.pause(); }
    });
  }
  [].forEach.call(document.querySelectorAll('img[data-clip]'),function(im){ clip(im,im.getAttribute('data-clip')); });

  // Click a picture, clip or plan to see it full size. It grows out of what you clicked and shrinks back into it.
  var dlg=document.getElementById('zoom'), makeZoomable=function(){};
  if(dlg&&dlg.showModal){
    var stage=dlg.querySelector('.zoom-stage'), cap=dlg.querySelector('.zoom-cap'), xBtn=dlg.querySelector('.zoom-x');
    var from=null, big=null, anim=null, fade=null, closing=false;
    var EASE='cubic-bezier(.32,.72,0,1)', DUR=340;
    function delta(){
      var a=from.getBoundingClientRect(), b=big.getBoundingClientRect();
      return 'translate('+((a.left+a.width/2)-(b.left+b.width/2))+'px,'+((a.top+a.height/2)-(b.top+b.height/2))+'px) scale('+(a.width/b.width)+')';
    }
    function finish(){
      if(dlg.open) dlg.close();
      if(anim) anim.cancel(); if(fade) fade.cancel();
      if(from){ from.style.visibility=''; if(from._zoomed){ from._zoomed=false; syncClips(); } }
      stage.textContent=''; dlg.classList.remove('leaving','entering');
      from=big=anim=fade=null; closing=false;
    }
    function copyOf(el){
      if(el.tagName==='IMG'){ var i=new Image(); i.src=el.currentSrc||el.src; i.alt=el.alt; return i; }
      if(el.tagName==='VIDEO'){
        var v=document.createElement('video'); v.src=el.currentSrc||el.src; v.poster=el.poster;
        v.muted=true; v.loop=true; v.playsInline=true; v.setAttribute('playsinline',''); v.controls=reduce;
        v.setAttribute('aria-label',el.getAttribute('aria-label')||'');
        try{ v.currentTime=el.currentTime; }catch(e){}
        if(!reduce){ var p=v.play(); if(p&&p.catch) p.catch(function(){ v.controls=true; }); }
        return v;
      }
      // a plan drawn in SVG: as large as fits, at the drawing's own proportions
      var s=el.cloneNode(true), vb=(el.getAttribute('viewBox')||'0 0 4 3').split(/[\s,]+/).map(Number), ar=vb[2]/vb[3];
      s.removeAttribute('id'); s.style.aspectRatio=vb[2]+'/'+vb[3];
      s.style.width='min(100%, calc((100vh - 72px) * '+ar+'))'; s.style.height='auto';
      return s;
    }
    function ready(el,cb){
      if(el.tagName==='IMG'&&!(el.complete&&el.naturalWidth)) el.addEventListener('load',cb,{once:true});
      else if(el.tagName==='VIDEO'&&el.readyState<1) el.addEventListener('loadedmetadata',cb,{once:true});
      else cb();
    }
    function open(el){
      if(dlg.open) return;
      from=el; closing=false;
      big=copyOf(el); stage.appendChild(big);
      var fc=el.closest('figure'), fcap=fc&&fc.querySelector('figcaption');
      cap.innerHTML=fcap?fcap.innerHTML:''; cap.hidden=!fcap;
      if(el.tagName==='VIDEO'){ el._zoomed=true; el.pause(); }
      dlg.showModal();
      xBtn.focus({preventScroll:true});
      if(reduce||!big.animate) return;
      dlg.classList.add('entering');
      ready(big,function(){
        if(!from||closing) return;
        from.style.visibility='hidden';
        anim=big.animate([{transform:delta()},{transform:'none'}],{duration:DUR,easing:EASE});
        try{ fade=dlg.animate([{opacity:0},{opacity:1}],{duration:DUR*.7,easing:'ease-out',pseudoElement:'::backdrop'}); }catch(e){ fade=null; }
        requestAnimationFrame(function(){ dlg.classList.remove('entering'); });
      });
    }
    function shut(){
      if(!dlg.open||closing) return;
      closing=true;
      if(reduce||!from||!big||!big.animate){ finish(); return; }
      dlg.classList.add('leaving');
      if(anim&&anim.playState==='running'){ anim.reverse(); if(fade) fade.reverse(); }   // still opening: turn round from where it is
      else{
        anim=big.animate([{transform:'none'},{transform:delta()}],{duration:DUR*.85,easing:EASE,fill:'forwards'});
        try{ fade=dlg.animate([{opacity:1},{opacity:0}],{duration:DUR*.85,easing:'ease-in',pseudoElement:'::backdrop',fill:'forwards'}); }catch(e){ fade=null; }
      }
      anim.onfinish=finish;
    }
    makeZoomable=function(el){
      el.classList.add('zoomable'); el.tabIndex=0;
      if(!el.hasAttribute('role')||el.tagName==='svg') el.setAttribute('role','button');
      if(el.parentNode&&el.parentNode.classList) el.parentNode.classList.add('zf');
      el.addEventListener('click',function(){open(el);});
      el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(el);}});
    };
    // Every picture, clip and plan drawing opens the same way; the interactive walkthrough plan is left alone.
    [].forEach.call(document.querySelectorAll('.p-media img,.beat img,.figs img,.paper img,.views img,.paper svg.plan,.views svg.plan,.ba svg.plan'),function(el){
      if(el.closest('a')) return;
      makeZoomable(el);
    });
    dlg.addEventListener('click',shut);
    dlg.addEventListener('cancel',function(e){ e.preventDefault(); shut(); });   // Esc
    onLang.push(function(zh){ xBtn.setAttribute('aria-label',zh?'关闭':'Close'); dlg.setAttribute('aria-label',zh?'放大的图片':'Enlarged image'); });
    xBtn.setAttribute('aria-label',root.getAttribute('data-lang')==='zh'?'关闭':'Close');
  }

  // Walkthrough clips are set up after the zoom so their stills can hand over the zoom to the clip.
  viewers.forEach(function(v){
    if(!v.clips) return;
    v.beats.forEach(function(a){var n=v.clips+a.getAttribute('data-beat'), im=a.querySelector('figure img'); if(im&&SKIP_CLIPS.indexOf(n)<0) clip(im,'media/'+n+'.mp4');});
  });

  // If the visitor turns "reduce motion" on or off while reading, follow it.
  if(mq){
    var follow=function(){ reduce=mq.matches; syncClips(); };
    if(mq.addEventListener) mq.addEventListener('change',follow); else if(mq.addListener) mq.addListener(follow);
  }
})();

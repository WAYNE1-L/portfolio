// Links set per page before this file loads (see the small script in each page):
//   PLAY_URL   download link for the Windows build
//   VIDEO_URL  full walkthrough video
// Leave them empty to hide the buttons.
var PLAY_URL=window.PLAY_URL||'', VIDEO_URL=window.VIDEO_URL||'';
var SKIP_CLIPS=['beat2'];   // clips held back until they are re-recorded
(function(){
  var root=document.documentElement;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;

  // Language: English by default, Chinese when the address ends in #zh.
  // Links to the other pages carry #zh along so the language stays the same.
  var pageLinks=[].slice.call(document.querySelectorAll('a[href]')).filter(function(a){
    var h=a.getAttribute('href'); return /^[\w-]+\.html(#.*)?$/.test(h);
  });
  pageLinks.forEach(function(a){a.setAttribute('data-href',a.getAttribute('href'));});
  function setLang(zh){
    root.setAttribute('data-lang',zh?'zh':'en');
    root.lang=zh?'zh-CN':'en';
    document.getElementById('lang-en').setAttribute('aria-pressed',String(!zh));
    document.getElementById('lang-zh').setAttribute('aria-pressed',String(zh));
    // screenshots with on-screen text follow the page language
    [].forEach.call(document.querySelectorAll('img[data-zh]'),function(im){
      var want=im.getAttribute(zh?'data-zh':'data-en'); if(im.getAttribute('src')!==want) im.setAttribute('src',want);
    });
    pageLinks.forEach(function(a){
      var h=a.getAttribute('data-href');
      a.setAttribute('href', zh&&h.indexOf('#')<0 ? h+'#zh' : h);
    });
    try{ localStorage.setItem('lang',zh?'zh':'en'); }catch(e){}
  }
  [].forEach.call(document.querySelectorAll('[data-setlang]'),function(b){
    b.addEventListener('click',function(){
      var y=window.scrollY, zh=b.getAttribute('data-setlang')==='zh';
      setLang(zh);
      try{ if(zh) history.replaceState(null,'',location.pathname+location.search+'#zh'); else history.replaceState(null,'',location.pathname+location.search); }
      catch(e){ try{ location.hash=zh?'zh':''; }catch(e2){} }
      window.scrollTo(0,y);
    });
  });
  window.addEventListener('hashchange',function(){ if(location.hash==='#zh'||location.hash==='') setLang(location.hash==='#zh'); });
  var saved=null; try{ saved=localStorage.getItem('lang'); }catch(e){}
  setLang(location.hash==='#zh'||saved==='zh');

  [].forEach.call(document.querySelectorAll('[data-go]'),function(b){
    b.addEventListener('click',function(e){
      var el=document.getElementById(b.getAttribute('data-go'));
      if(el){ e.preventDefault(); el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}); }
    });
  });

  // Section bar on a project page: underline the section in view.
  var toc=[].slice.call(document.querySelectorAll('.toc a[data-go]'));
  if(toc.length&&window.IntersectionObserver){
    var secs=toc.map(function(a){return document.getElementById(a.getAttribute('data-go'));}).filter(Boolean);
    function mark(){
      var y=150, cur=null;
      secs.forEach(function(s){ if(s.getBoundingClientRect().top<=y) cur=s; });
      toc.forEach(function(a){ a.classList.toggle('on', !!cur&&a.getAttribute('data-go')===cur.id); });
    }
    window.addEventListener('scroll',mark,{passive:true}); mark();
  }

  // Walkthroughs: in each viewer the tabs, plan markers and pager all select the same beat.
  var viewers=[].map.call(document.querySelectorAll('.viewer'),function(box){
    var plan=box.querySelector('.plan');
    var tabs=[].slice.call(box.querySelectorAll('[role="tab"]'));
    var beats=[].slice.call(box.querySelectorAll('article.beat'));
    var marks=[].slice.call(plan.querySelectorAll('.bm'));
    var cur=1;
    function select(n,focusTab){
      n=Math.max(1,Math.min(beats.length,n)); cur=n;
      beats.forEach(function(a){a.hidden=Number(a.getAttribute('data-beat'))!==n;});
      tabs.forEach(function(t){var on=Number(t.getAttribute('data-beat'))===n;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;if(on&&focusTab)t.focus();});
      marks.forEach(function(m){m.classList.toggle('on',Number(m.getAttribute('data-beat'))===n);});
      plan.setAttribute('data-phase',beats[n-1].getAttribute('data-phase'));
      syncClips();
    }
    tabs.forEach(function(t){
      t.addEventListener('click',function(){select(Number(t.getAttribute('data-beat')));});
      t.addEventListener('keydown',function(e){
        if(e.key==='ArrowRight'){e.preventDefault();select(cur+1,true);}
        if(e.key==='ArrowLeft'){e.preventDefault();select(cur-1,true);}
      });
    });
    marks.forEach(function(m){
      function go(){select(Number(m.getAttribute('data-beat')));}
      m.addEventListener('click',go);
      m.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
    });
    [].forEach.call(box.querySelectorAll('.pager [data-step]'),function(b){
      b.addEventListener('click',function(){select(cur+Number(b.getAttribute('data-step')));});
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
  })();

  // Short clips replace stills when the files are there.
  // An <img data-clip="media/x.mp4"> gets that clip; walkthrough beats get media/<data-clips><n>.mp4.
  function clip(img,src){
    var v=document.createElement('video');
    v.muted=true; v.loop=true; v.playsInline=true; v.preload='metadata';
    v.setAttribute('muted',''); v.setAttribute('playsinline','');
    v.className='clip';
    v.poster=img.currentSrc||img.src; v.setAttribute('aria-label',img.alt);
    v.addEventListener('loadedmetadata',function(){
      if(!img.parentNode) return;
      var fig=img.parentNode;
      v.controls=reduce; fig.replaceChild(v,img);
      // some clips show a different moment from the still, so they carry their own caption
      if(fig.getAttribute&&fig.getAttribute('data-clip-en')){
        var en=fig.querySelector('figcaption [data-l="en"]'), zh=fig.querySelector('figcaption [data-l="zh"]');
        if(en) en.textContent=fig.getAttribute('data-clip-en'); if(zh) zh.textContent=fig.getAttribute('data-clip-zh');
      }
      syncClips();
    });
    v.src=src;
  }
  // Only clips that are on screen play: hidden beats pause.
  function syncClips(){
    [].forEach.call(document.querySelectorAll('video.clip'),function(v){
      var art=v.closest?v.closest('article.beat'):null, show=!art||!art.hidden;
      if(show&&!reduce){ if(v.paused){var p=v.play(); if(p&&p.catch)p.catch(function(){v.controls=true;});} }
      else if(!v.paused){ v.pause(); }
    });
  }
  [].forEach.call(document.querySelectorAll('img[data-clip]'),function(im){ clip(im,im.getAttribute('data-clip')); });
  viewers.forEach(function(v){
    if(!v.clips) return;
    v.beats.forEach(function(a){var n=v.clips+a.getAttribute('data-beat'), im=a.querySelector('figure img'); if(im&&SKIP_CLIPS.indexOf(n)<0) clip(im,'media/'+n+'.mp4');});
  });

  // Click a picture to see it full size.
  var dlg=document.getElementById('zoom');
  if(dlg&&dlg.showModal){
    var big=dlg.querySelector('img');
    [].forEach.call(document.querySelectorAll('.beat img,.figs img,.paper img,.views img'),function(im){
      im.classList.add('zoomable'); im.tabIndex=0;
      function open(){big.src=im.currentSrc||im.src;big.alt=im.alt;dlg.showModal();}
      im.addEventListener('click',open);
      im.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();open();}});
    });
    dlg.addEventListener('click',function(){dlg.close();});
  }
})();

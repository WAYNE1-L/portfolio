Portfolio site for Wayne Liang.

Pages
  index.html           homepage: hero, the two level cards, experience, other work, about, contact
  exposure.html        Exposure case study
  lantern-court.html   Lantern Court case study
  wall-street-titan.html   Wall Street Titan system breakdown (linked from Other work)
  assets/site.css      styles shared by all pages
  assets/site.js       language switch, walkthrough viewer, clips, image zoom

English by default; add #zh to the address for Chinese. The choice is remembered
when moving between pages.

Optional files the pages pick up by themselves:
  media/hero.mp4            short clip on the Lantern Court card and page header
  media/beat1.mp4 .. beat8.mp4   one clip per Lantern Court walkthrough step

  media/wst.mp4             Wall Street Titan tutorial video; its pictures are in img/wst/

Any <img data-clip="media/x.mp4"> is replaced by that clip once the file loads.

Exposure keeps its pictures in img/pt/. Its walkthrough shows stills only. To add
clips later, put data-clips="pt" on its <div class="viewer"> and save them as
media/pt1.mp4 .. pt8.mp4.

Two links for Lantern Court are set in the small script near the bottom of
lantern-court.html:
  PLAY_URL   download link for the Windows build
  VIDEO_URL  full walkthrough video
Leave them empty to hide the buttons.

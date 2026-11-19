Portfolio site for Wayne Liang.

index.html is the whole page. English by default; add #zh to the address for Chinese.

Optional files the page picks up by itself:
  media/hero.mp4            short clip on the Photo01 card
  media/beat1.mp4 .. beat8.mp4   one clip per walkthrough step

PhotoTutorial (the second level on the page) keeps its pictures in img/pt/.
Its walkthrough shows stills only. To add clips later, put data-clips="pt" on its
<div class="viewer"> and save them as media/pt1.mp4 .. pt8.mp4.

Two links are set near the top of the script in index.html:
  PLAY_URL   download link for the Windows build
  VIDEO_URL  full walkthrough video
Leave them empty to hide the buttons.

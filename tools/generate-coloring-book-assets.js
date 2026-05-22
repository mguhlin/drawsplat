const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'assets', 'coloring-book');

const categories = {
  plants: [
    ['sunflower', 'Sunflower'], ['rose', 'Rose'], ['tulip', 'Tulip'], ['cactus', 'Cactus'],
    ['fern', 'Fern'], ['oak-leaf', 'Oak Leaf'], ['maple-leaf', 'Maple Leaf'], ['pine-cone', 'Pine Cone'],
    ['mushroom', 'Mushroom'], ['water-lily', 'Water Lily'], ['orchid', 'Orchid'], ['daisy', 'Daisy'],
    ['bamboo', 'Bamboo'], ['aloe', 'Aloe'], ['seaweed', 'Seaweed'], ['acorn-sprout', 'Acorn Sprout'],
    ['pumpkin-vine', 'Pumpkin Vine'], ['clover', 'Clover'], ['palm-frond', 'Palm Frond'], ['succulent', 'Succulent']
  ],
  insects: [
    ['butterfly', 'Butterfly'], ['honeybee', 'Honeybee'], ['ladybug', 'Ladybug'], ['dragonfly', 'Dragonfly'],
    ['ant', 'Ant'], ['grasshopper', 'Grasshopper'], ['beetle', 'Beetle'], ['moth', 'Moth'],
    ['cicada', 'Cicada'], ['praying-mantis', 'Praying Mantis'], ['firefly', 'Firefly'], ['caterpillar', 'Caterpillar'],
    ['cricket', 'Cricket'], ['walking-stick', 'Walking Stick'], ['damselfly', 'Damselfly'], ['weevil', 'Weevil'],
    ['leafhopper', 'Leafhopper'], ['termite', 'Termite'], ['wasp', 'Wasp'], ['scarab', 'Scarab']
  ],
  dinosaurs: [
    ['tyrannosaurus', 'Tyrannosaurus'], ['triceratops', 'Triceratops'], ['stegosaurus', 'Stegosaurus'], ['brachiosaurus', 'Brachiosaurus'],
    ['velociraptor', 'Velociraptor'], ['ankylosaurus', 'Ankylosaurus'], ['parasaurolophus', 'Parasaurolophus'], ['spinosaurus', 'Spinosaurus'],
    ['pteranodon', 'Pteranodon'], ['allosaurus', 'Allosaurus'], ['diplodocus', 'Diplodocus'], ['iguanodon', 'Iguanodon'],
    ['pachycephalosaurus', 'Pachycephalosaurus'], ['carnotaurus', 'Carnotaurus'], ['apatosaurus', 'Apatosaurus'], ['oviraptor', 'Oviraptor'],
    ['compsognathus', 'Compsognathus'], ['dimetrodon', 'Dimetrodon'], ['mosasaurus', 'Mosasaurus'], ['plesiosaurus', 'Plesiosaurus']
  ],
  animals: [
    ['lion', 'Lion'], ['elephant', 'Elephant'], ['giraffe', 'Giraffe'], ['zebra', 'Zebra'],
    ['panda', 'Panda'], ['koala', 'Koala'], ['dolphin', 'Dolphin'], ['sea-turtle', 'Sea Turtle'],
    ['owl', 'Owl'], ['fox', 'Fox'], ['rabbit', 'Rabbit'], ['horse', 'Horse'],
    ['frog', 'Frog'], ['penguin', 'Penguin'], ['bear', 'Bear'], ['kangaroo', 'Kangaroo'],
    ['whale', 'Whale'], ['octopus', 'Octopus'], ['deer', 'Deer'], ['cheetah', 'Cheetah']
  ]
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function shell(title, category, body, scene = '') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)} coloring page</title>
  <desc id="desc">Original copyright-free DrawSplatTM printable line art for classroom coloring use.</desc>
  <rect width="900" height="1200" fill="#fff"/>
  <g fill="none" stroke="#111827" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
    <rect x="42" y="42" width="816" height="1116" rx="34" stroke-width="5"/>
    ${body}
  </g>
  <g fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55">
    ${scene || '<path d="M92 1088 C170 1050 262 1128 360 1090 S560 1052 646 1098 S764 1134 820 1080"/>'}
  </g>
  <metadata>DrawSplatTM original SVG line art; category=${esc(category)}; license=CC0-1.0/public-domain-dedicated; generated=subject-specific-v2.</metadata>
</svg>
`;
}

function petals(cx, cy, count, rx, ry) {
  return Array.from({ length: count }, (_, i) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${i * 360 / count} ${cx} ${cy})"/>`).join('\n    ');
}

function leaf(cx, cy, side = 1, scale = 1) {
  const s = side, w = 118 * scale, h = 86 * scale;
  return `<path d="M${cx} ${cy} C${cx + s * w * .45} ${cy - h} ${cx + s * w * 1.15} ${cy - h * .82} ${cx + s * w * 1.42} ${cy - h * .12} C${cx + s * w * .8} ${cy + h * .35} ${cx + s * w * .25} ${cy + h * .28} ${cx} ${cy} Z"/><path d="M${cx} ${cy} C${cx + s * w * .5} ${cy - h * .26} ${cx + s * w} ${cy - h * .26} ${cx + s * w * 1.34} ${cy - h * .12}" stroke-width="5"/>`;
}

function plantArt(slug, label) {
  const stem = '<path d="M450 515 C430 680 438 832 450 1014"/>';
  const pot = '<path d="M290 966 H610 L560 1092 H340 Z"/><path d="M262 918 H638 V966 H262 Z"/>';
  const flowerScene = '<path d="M112 1078 C180 1040 262 1112 344 1078 S510 1044 598 1088 S748 1118 808 1070"/>';
  if (slug === 'sunflower') return shell(label, 'plants', `${petals(450, 382, 20, 36, 116)}<circle cx="450" cy="382" r="92"/><circle cx="450" cy="382" r="58" stroke-width="6"/>${stem}${leaf(450, 650, -1, 1.05)}${leaf(454, 770, 1, .95)}${pot}`, flowerScene);
  if (slug === 'daisy') return shell(label, 'plants', `${petals(450, 378, 14, 32, 104)}<circle cx="450" cy="378" r="62"/>${stem}${leaf(450, 700, -1, .85)}${leaf(452, 810, 1, .8)}${pot}`, flowerScene);
  if (slug === 'rose') return shell(label, 'plants', `<path d="M450 300 C360 320 330 420 390 488 C330 492 304 570 370 628 C430 684 534 660 584 586 C650 490 594 340 450 300 Z"/><path d="M392 486 C440 382 552 386 586 486"/><path d="M374 574 C438 552 498 512 528 432"/><path d="M432 330 C474 388 464 464 402 516"/>${stem}${leaf(448, 654, -1, .9)}${leaf(454, 782, 1, .95)}${pot}`, flowerScene);
  if (slug === 'tulip') return shell(label, 'plants', `<path d="M450 512 C340 438 330 294 388 232 C426 292 450 338 450 410 C450 338 474 292 512 232 C570 294 560 438 450 512 Z"/><path d="M388 232 C384 360 414 450 450 512 M512 232 C516 360 486 450 450 512"/>${stem}${leaf(450, 690, -1, 1.1)}${leaf(452, 824, 1, 1)}${pot}`, flowerScene);
  if (slug === 'cactus') return shell(label, 'plants', `<path d="M452 944 C386 850 390 492 452 334 C516 492 518 850 452 944 Z"/><path d="M392 610 C304 590 284 456 344 398 C398 430 408 520 392 610 Z"/><path d="M512 720 C620 688 646 540 576 488 C520 534 506 618 512 720 Z"/><path d="M416 468 l-26 26 M490 534 l32 18 M420 668 l-32 18 M494 802 l34 20"/>${pot}`, '<path d="M100 1092 C244 1036 334 1120 454 1084 S700 1028 816 1092"/>');
  if (slug === 'fern' || slug === 'palm-frond' || slug === 'seaweed') return shell(label, 'plants', `<path d="M450 1020 C420 820 458 582 548 294"/>${Array.from({ length: 12 }, (_, n) => { const y = 932 - n * 52, x = 460 + n * 7, len = 100 + n * 7; return `<path d="M${x} ${y} C${x - len} ${y - 34} ${x - len * 1.05} ${y - 98} ${x - len * .45} ${y - 134}"/><path d="M${x} ${y} C${x + len} ${y - 40} ${x + len * 1.03} ${y - 108} ${x + len * .44} ${y - 142}"/>`; }).join('\n    ')}`, '<path d="M120 1070 C250 1028 380 1110 520 1070 S724 1038 814 1080"/>');
  if (slug === 'bamboo') return shell(label, 'plants', `<path d="M338 1030 C318 760 326 520 354 250"/><path d="M454 1030 C432 760 442 500 468 214"/><path d="M570 1030 C548 770 560 560 590 304"/>${[344, 460, 578].map(x => [362, 500, 642, 784, 910].map(y => `<path d="M${x - 42} ${y} H${x + 42}"/>`).join('\n    ')).join('\n    ')}${leaf(468, 390, 1, .7)}${leaf(454, 530, -1, .68)}${leaf(590, 604, 1, .7)}${leaf(350, 710, -1, .66)}`, '<path d="M120 1090 H804"/>');
  if (slug === 'oak-leaf') return shell(label, 'plants', `<path d="M452 1028 C322 900 238 780 238 646 C146 574 198 442 306 462 C296 330 430 278 492 382 C566 284 706 348 662 486 C778 504 790 650 698 696 C702 826 610 944 452 1028 Z"/><path d="M452 1028 C454 802 466 584 492 382"/><path d="M456 704 C374 654 310 596 250 516 M466 610 C552 560 612 512 668 456 M452 838 C360 810 286 760 230 694 M462 834 C562 798 634 746 706 682"/>`);
  if (slug === 'maple-leaf') return shell(label, 'plants', `<path d="M450 1032 L402 812 L230 902 L306 690 L132 620 L338 560 L270 322 L450 470 L630 322 L562 560 L768 620 L594 690 L670 902 L498 812 Z"/><path d="M450 1032 V470 M450 628 L270 322 M450 628 L630 322 M450 740 L132 620 M450 740 L768 620"/>`);
  if (slug === 'pine-cone') return shell(label, 'plants', `<ellipse cx="450" cy="650" rx="178" ry="338"/>${Array.from({ length: 8 }, (_, r) => Array.from({ length: 3 + (r % 2) }, (_, c) => { const x = 340 + c * 74 + (r % 2) * 36, y = 384 + r * 72; return `<path d="M${x} ${y} C${x - 62} ${y + 34} ${x - 28} ${y + 106} ${x + 44} ${y + 88} C${x + 104} ${y + 58} ${x + 82} ${y + 10} ${x} ${y} Z"/>`; }).join('\n    ')).join('\n    ')}<path d="M360 294 C392 212 508 212 540 294"/>`);
  if (slug === 'mushroom') return shell(label, 'plants', `<path d="M188 510 C252 292 648 292 712 510 C594 568 306 568 188 510 Z"/><path d="M344 530 C350 650 318 826 286 1018 H614 C582 826 550 650 556 530"/><path d="M372 378 C402 330 470 332 498 382"/><circle cx="290" cy="460" r="34"/><circle cx="596" cy="438" r="42"/><circle cx="458" cy="484" r="28"/>`);
  if (slug === 'water-lily') return shell(label, 'plants', `<path d="M450 676 C330 596 330 438 450 340 C570 438 570 596 450 676 Z"/><path d="M450 676 C250 626 190 464 310 344 C410 430 450 530 450 676 Z"/><path d="M450 676 C650 626 710 464 590 344 C490 430 450 530 450 676 Z"/><path d="M450 676 C390 540 410 402 450 260 C490 402 510 540 450 676 Z"/><path d="M180 892 C300 760 590 760 720 896 C572 1000 330 1000 180 892 Z"/><path d="M452 888 C542 826 626 814 720 896"/>`, '<path d="M96 1028 C214 998 292 1036 386 1010 S568 986 680 1022 S782 1046 824 1018"/>');
  if (slug === 'orchid') return shell(label, 'plants', `<ellipse cx="450" cy="392" rx="82" ry="118"/><ellipse cx="336" cy="430" rx="94" ry="138" transform="rotate(-38 336 430)"/><ellipse cx="564" cy="430" rx="94" ry="138" transform="rotate(38 564 430)"/><ellipse cx="396" cy="560" rx="82" ry="126" transform="rotate(26 396 560)"/><ellipse cx="504" cy="560" rx="82" ry="126" transform="rotate(-26 504 560)"/><path d="M410 482 C442 454 482 454 512 482 C492 538 430 538 410 482 Z"/>${stem}${leaf(450, 746, -1, .85)}${leaf(452, 840, 1, .8)}${pot}`, flowerScene);
  if (slug === 'aloe' || slug === 'succulent') return shell(label, 'plants', `<path d="M450 926 C416 720 420 520 450 300 C480 520 484 720 450 926 Z"/><path d="M450 926 C328 760 284 568 306 376 C412 566 446 760 450 926 Z"/><path d="M450 926 C572 760 616 568 594 376 C488 566 454 760 450 926 Z"/><path d="M450 926 C300 852 210 708 184 536 C344 650 422 786 450 926 Z"/><path d="M450 926 C600 852 690 708 716 536 C556 650 478 786 450 926 Z"/>${pot}`, '<path d="M132 1090 H780"/>');
  if (slug === 'acorn-sprout') return shell(label, 'plants', `<path d="M358 870 C300 810 290 720 350 660 C430 694 470 784 438 870 Z"/><path d="M542 870 C600 810 610 720 550 660 C470 694 430 784 462 870 Z"/><path d="M450 1010 V650"/><path d="M316 472 C326 346 574 346 584 472 C540 620 360 620 316 472 Z"/><path d="M304 468 C352 404 546 404 596 468"/><path d="M364 402 l-28 -58 M454 388 l-4 -70 M536 402 l34 -58"/>`);
  if (slug === 'pumpkin-vine') return shell(label, 'plants', `<ellipse cx="450" cy="780" rx="230" ry="178"/><ellipse cx="450" cy="780" rx="104" ry="178"/><path d="M450 604 C438 550 470 514 516 520"/><path d="M522 542 C650 452 734 516 660 602"/><path d="M320 608 C230 506 126 564 184 682"/><path d="M648 588 C736 544 782 592 760 660"/><path d="M242 560 C204 486 246 420 326 442 C334 510 302 550 242 560 Z"/><path d="M662 506 C704 422 796 430 820 512 C752 558 704 552 662 506 Z"/>`, '<path d="M96 1012 C236 960 366 1040 510 1002 S706 958 820 1020"/>');
  if (slug === 'clover') return shell(label, 'plants', `<path d="M450 1018 C432 850 430 694 450 548"/><path d="M450 548 C328 454 356 298 450 328 C544 298 572 454 450 548 Z"/><path d="M446 548 C312 608 198 516 270 426 C366 390 424 450 446 548 Z"/><path d="M454 548 C588 608 702 516 630 426 C534 390 476 450 454 548 Z"/><path d="M450 548 C368 672 462 778 548 694 C586 602 536 556 450 548 Z"/>${pot}`, flowerScene);
  return shell(label, 'plants', `${petals(450, 390, 12, 38, 104)}<circle cx="450" cy="390" r="72"/>${stem}${leaf(450, 680, -1, .9)}${leaf(452, 796, 1, .9)}${pot}`, flowerScene);
}

function insectLegs(cx, y1, y2) {
  return `<path d="M${cx - 80} ${y1} C${cx - 190} ${y1 - 70} ${cx - 248} ${y1 - 44} ${cx - 292} ${y1 + 20}"/>
  <path d="M${cx + 80} ${y1} C${cx + 190} ${y1 - 70} ${cx + 248} ${y1 - 44} ${cx + 292} ${y1 + 20}"/>
  <path d="M${cx - 96} ${y2} C${cx - 210} ${y2 + 8} ${cx - 246} ${y2 + 80} ${cx - 290} ${y2 + 146}"/>
  <path d="M${cx + 96} ${y2} C${cx + 210} ${y2 + 8} ${cx + 246} ${y2 + 80} ${cx + 290} ${y2 + 146}"/>`;
}

function insectArt(slug, label) {
  const grass = '<path d="M120 1098 C170 1042 218 1080 256 1020 M650 1092 C692 1022 762 1048 812 1004"/>';
  if (slug === 'butterfly' || slug === 'moth') return shell(label, 'insects', `<path d="M450 310 C424 450 424 734 450 902"/><path d="M450 310 C476 450 476 734 450 902"/><path d="M442 520 C270 220 96 250 136 458 C176 646 338 630 442 520 Z"/><path d="M458 520 C630 220 804 250 764 458 C724 646 562 630 458 520 Z"/><path d="M442 692 C250 670 154 774 206 910 C284 1076 420 934 442 760 Z"/><path d="M458 692 C650 670 746 774 694 910 C616 1076 480 934 458 760 Z"/><circle cx="450" cy="270" r="44"/><path d="M420 244 C360 178 296 184 250 234 M480 244 C540 178 604 184 650 234"/><circle cx="278" cy="444" r="38"/><circle cx="622" cy="444" r="38"/><path d="M292 812 C334 770 384 766 424 804 M608 812 C566 770 516 766 476 804"/>`, grass);
  if (slug === 'honeybee' || slug === 'wasp') return shell(label, 'insects', `<ellipse cx="450" cy="626" rx="174" ry="252"/><circle cx="450" cy="332" r="66"/><ellipse cx="334" cy="404" rx="110" ry="170" transform="rotate(-28 334 404)"/><ellipse cx="566" cy="404" rx="110" ry="170" transform="rotate(28 566 404)"/><path d="M304 502 H596 M282 608 H618 M306 720 H594"/><path d="M450 878 l-44 86 M450 878 l44 86"/><path d="M418 314 h.1 M482 314 h.1"/><path d="M406 286 C360 222 300 212 254 242 M494 286 C540 222 600 212 646 242"/>`, grass);
  if (slug === 'ladybug') return shell(label, 'insects', `<ellipse cx="450" cy="620" rx="218" ry="296"/><circle cx="450" cy="300" r="82"/><path d="M450 330 V906"/><path d="M312 438 C384 396 516 396 588 438"/><circle cx="330" cy="548" r="34"/><circle cx="570" cy="548" r="34"/><circle cx="370" cy="716" r="34"/><circle cx="530" cy="716" r="34"/><circle cx="450" cy="824" r="28"/>${insectLegs(450, 520, 708)}<path d="M410 248 C372 176 316 160 264 190 M490 248 C528 176 584 160 636 190"/>`, grass);
  if (slug === 'dragonfly' || slug === 'damselfly') return shell(label, 'insects', `<path d="M450 246 C482 440 482 790 450 1020 C418 790 418 440 450 246 Z"/><circle cx="450" cy="210" r="52"/><ellipse cx="318" cy="398" rx="90" ry="206" transform="rotate(-64 318 398)"/><ellipse cx="582" cy="398" rx="90" ry="206" transform="rotate(64 582 398)"/><ellipse cx="324" cy="610" rx="78" ry="190" transform="rotate(-78 324 610)"/><ellipse cx="576" cy="610" rx="78" ry="190" transform="rotate(78 576 610)"/><path d="M428 198 h.1 M472 198 h.1"/><path d="M406 310 C360 342 334 388 322 458 M494 310 C540 342 566 388 578 458"/>`, grass);
  if (slug === 'ant' || slug === 'termite') return shell(label, 'insects', `<ellipse cx="258" cy="620" rx="92" ry="116"/><ellipse cx="450" cy="620" rx="112" ry="142"/><ellipse cx="658" cy="620" rx="136" ry="166"/><path d="M334 620 H366 M548 620 H582"/>${insectLegs(450, 554, 674)}<path d="M204 558 C150 476 96 466 66 514 M216 552 C186 462 128 428 78 446"/><circle cx="230" cy="590" r="6"/><circle cx="286" cy="590" r="6"/>`, grass);
  if (slug === 'grasshopper' || slug === 'cricket') return shell(label, 'insects', `<ellipse cx="448" cy="608" rx="204" ry="116"/><circle cx="246" cy="548" r="78"/><path d="M304 598 C420 488 560 470 704 542"/><path d="M548 662 C646 738 702 850 742 994"/><path d="M582 650 C682 620 754 636 814 704"/><path d="M360 646 C288 720 232 806 190 932"/><path d="M286 520 h.1 M188 510 C138 444 86 434 50 474 M212 496 C176 424 116 388 68 404"/><path d="M270 638 C198 658 150 702 106 774"/>`, grass);
  if (slug === 'praying-mantis') return shell(label, 'insects', `<path d="M420 330 C508 424 544 640 514 896"/><ellipse cx="368" cy="292" rx="78" ry="56" transform="rotate(-18 368 292)"/><path d="M398 396 C278 386 214 458 194 594 M398 396 C286 484 254 562 286 658"/><path d="M486 502 C596 500 664 564 708 694 M492 626 C608 680 668 782 702 918"/><path d="M340 280 h.1 M390 270 h.1"/><path d="M330 236 C270 176 206 186 164 232 M400 238 C474 186 536 200 572 250"/>`, grass);
  if (slug === 'caterpillar') return shell(label, 'insects', `${Array.from({ length: 8 }, (_, i) => `<circle cx="${174 + i * 80}" cy="${650 - (i % 2) * 28}" r="${62 - Math.min(i, 5) * 2}"/>`).join('\n    ')}<path d="M144 618 h.1 M194 616 h.1"/><path d="M154 578 C112 514 68 508 34 548 M198 576 C236 508 292 502 330 544"/><path d="M190 720 v54 M270 696 v58 M350 720 v54 M430 696 v58 M510 720 v54 M590 696 v58 M670 720 v54"/>`, grass);
  if (slug === 'walking-stick') return shell(label, 'insects', `<path d="M224 380 C360 464 500 548 684 728"/><path d="M284 422 C210 500 152 582 104 680 M370 478 C330 588 288 700 242 834 M470 542 C522 640 578 738 642 846 M578 648 C688 646 762 682 820 744"/><path d="M206 368 C160 324 122 322 90 356 M224 378 C198 320 154 288 110 296"/><circle cx="224" cy="380" r="28"/>`, grass);
  if (slug === 'weevil') return shell(label, 'insects', `<ellipse cx="470" cy="640" rx="166" ry="232"/><circle cx="450" cy="360" r="82"/><path d="M436 308 C342 244 250 246 196 322 C268 322 348 344 420 394"/><path d="M450 428 V852"/><circle cx="420" cy="338" r="6"/><circle cx="484" cy="338" r="6"/>${insectLegs(470, 532, 716)}`, grass);
  if (slug === 'leafhopper') return shell(label, 'insects', `<path d="M206 638 C318 420 600 410 730 646 C612 820 336 820 206 638 Z"/><path d="M450 432 V806"/><path d="M292 570 C390 536 512 536 610 570"/><path d="M250 648 C180 692 132 746 102 828 M650 648 C722 690 770 746 800 828"/><circle cx="336" cy="560" r="8"/><circle cx="390" cy="546" r="8"/>`, grass);
  if (slug === 'cicada') return shell(label, 'insects', `<ellipse cx="450" cy="546" rx="108" ry="240"/><circle cx="450" cy="288" r="78"/><ellipse cx="318" cy="584" rx="110" ry="270" transform="rotate(-16 318 584)"/><ellipse cx="582" cy="584" rx="110" ry="270" transform="rotate(16 582 584)"/><path d="M372 330 h.1 M528 330 h.1"/><path d="M344 516 C386 618 408 744 400 884 M556 516 C514 618 492 744 500 884"/><path d="M450 382 V846"/>`, grass);
  if (slug === 'firefly') return shell(label, 'insects', `<ellipse cx="450" cy="518" rx="118" ry="178"/><ellipse cx="450" cy="788" rx="142" ry="190"/><circle cx="450" cy="320" r="68"/><ellipse cx="330" cy="500" rx="82" ry="182" transform="rotate(-30 330 500)"/><ellipse cx="570" cy="500" rx="82" ry="182" transform="rotate(30 570 500)"/><path d="M336 734 H564 M314 806 H586 M350 880 H550"/><path d="M420 300 h.1 M480 300 h.1"/>${insectLegs(450, 500, 650)}<path d="M302 950 C220 996 168 1040 126 1098 M598 950 C680 996 732 1040 774 1098"/>`, grass);
  return shell(label, 'insects', `<ellipse cx="450" cy="620" rx="170" ry="276"/><circle cx="450" cy="294" r="74"/><path d="M450 350 V890"/><path d="M330 482 C402 442 498 442 570 482"/><path d="M324 626 C400 596 500 596 576 626"/><path d="M338 770 C410 740 490 740 562 770"/>${insectLegs(450, 500, 700)}<path d="M412 252 C370 188 314 170 264 194 M488 252 C530 188 586 170 636 194"/>`, grass);
}

function dinosaurArt(slug, label) {
  const ground = '<path d="M92 1074 C222 1030 360 1100 500 1066 S712 1028 822 1086"/>';
  const rex = `<path d="M194 742 C250 540 442 452 620 510 C748 552 792 660 714 746 C618 852 390 832 260 782 Z"/><path d="M604 514 C654 410 774 398 822 490 C778 532 704 538 628 520"/><path d="M306 780 L238 976 M472 812 L528 982 M606 746 L690 928"/><path d="M328 624 C266 642 218 620 184 584 M650 612 l72 42 M750 478 h.1"/><path d="M220 750 C150 762 108 720 86 664"/><path d="M690 512 l34 -18 M704 536 l38 4"/>`;
  if (slug === 'tyrannosaurus' || slug === 'allosaurus' || slug === 'carnotaurus') return shell(label, 'dinosaurs', rex + (slug === 'carnotaurus' ? '<path d="M718 424 l-38 -70 M762 422 l48 -62"/>' : ''), ground);
  if (slug === 'velociraptor' || slug === 'compsognathus' || slug === 'oviraptor') return shell(label, 'dinosaurs', `<path d="M220 716 C300 548 500 500 642 604 C724 664 716 752 618 794 C494 846 328 812 220 716 Z"/><path d="M610 600 C674 520 762 526 806 598 C754 632 686 632 620 612"/><path d="M340 782 L270 974 L350 906 M500 806 L548 996 L626 934"/><path d="M300 652 C230 646 184 610 150 548 M622 622 l64 42 M748 584 h.1"/><path d="M232 710 C126 684 82 616 66 536"/><path d="M456 528 C492 486 548 464 606 462"/>${slug === 'oviraptor' ? '<ellipse cx="760" cy="598" rx="34" ry="46"/>' : ''}`, ground);
  if (slug === 'triceratops') return shell(label, 'dinosaurs', `<path d="M190 742 C256 564 540 516 706 658 C768 712 766 792 690 836 C532 928 280 890 190 742 Z"/><path d="M608 576 C662 420 806 388 844 526 C794 606 706 628 608 576 Z"/><path d="M684 528 l-22 -132 M746 536 l72 -96 M610 580 l-116 -78"/><path d="M286 818 v132 M450 844 v120 M604 820 v132"/><path d="M270 658 h.1"/>`, ground);
  if (slug === 'stegosaurus') return shell(label, 'dinosaurs', `<path d="M148 744 C260 532 584 540 732 706 C642 870 338 908 148 744 Z"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${226 + i * 62} ${548 - Math.sin(i) * 22} l36 -92 l36 92"/>`).join('\n    ')}<path d="M710 708 C780 686 828 718 852 780"/><path d="M180 728 C112 712 82 670 64 620"/><path d="M270 830 v124 M426 852 v112 M586 828 v124"/>`, ground);
  if (slug === 'ankylosaurus') return shell(label, 'dinosaurs', `<path d="M148 750 C250 562 590 548 736 722 C652 872 334 896 148 750 Z"/><path d="M214 600 l26 -60 l30 58 M306 562 l34 -72 l34 72 M414 548 l34 -78 l34 78 M530 560 l34 -70 l34 72 M632 596 l28 -54 l26 56"/><path d="M716 724 C792 708 832 752 850 818"/><circle cx="846" cy="832" r="34"/><path d="M250 826 v120 M420 844 v112 M598 826 v120"/><path d="M204 690 h.1"/>`, ground);
  if (slug === 'brachiosaurus' || slug === 'diplodocus' || slug === 'apatosaurus') return shell(label, 'dinosaurs', `<path d="M230 762 C238 584 346 496 482 520 C600 540 668 646 702 768"/><path d="M496 524 C540 342 618 232 732 182 C790 248 748 350 648 394 C590 420 554 468 540 542"/><path d="M232 758 C166 780 122 822 88 902"/><path d="M314 762 v188 M462 758 v198 M602 766 v188"/><circle cx="736" cy="184" r="42"/><path d="M754 178 h.1 M714 206 C734 224 760 222 780 204"/>${slug === 'diplodocus' ? '<path d="M230 760 C130 722 76 662 58 578"/>' : ''}`, ground);
  if (slug === 'parasaurolophus' || slug === 'iguanodon') return shell(label, 'dinosaurs', `<path d="M196 742 C276 560 538 506 700 658 C772 728 728 830 596 864 C456 900 274 858 196 742 Z"/><path d="M604 596 C666 502 754 488 812 548 C764 594 696 620 610 614"/><path d="M724 520 C748 438 708 376 614 326"/><path d="M320 816 v144 M512 846 v126 M638 782 L724 940"/><path d="M286 650 h.1 M610 650 l72 56"/>`, ground);
  if (slug === 'spinosaurus' || slug === 'dimetrodon') return shell(label, 'dinosaurs', `<path d="M160 748 C252 550 570 540 734 710 C640 866 344 902 160 748 Z"/><path d="M250 572 C304 398 464 284 642 410 C608 518 482 590 250 572 Z"/><path d="M622 682 C706 614 794 630 838 712 C784 746 710 736 638 700"/><path d="M280 826 v132 M456 850 v116 M620 820 v134"/><path d="M216 700 h.1 M180 744 C112 724 78 678 58 614"/>`, ground);
  if (slug === 'pteranodon') return shell(label, 'dinosaurs', `<path d="M450 500 C560 340 696 250 832 210 C744 406 646 548 488 658"/><path d="M450 500 C340 340 204 250 68 210 C156 406 254 548 412 658"/><path d="M396 620 C420 472 484 472 508 620 C480 742 424 742 396 620 Z"/><path d="M450 468 C474 360 544 292 644 248"/><path d="M444 452 C414 356 344 300 252 260"/><path d="M466 604 l-36 84 M438 604 l36 84"/><path d="M484 464 h.1"/>`, '<path d="M110 962 C210 902 330 966 450 920 S660 890 790 954"/>');
  if (slug === 'mosasaurus') return shell(label, 'dinosaurs', `<path d="M96 620 C276 420 610 436 780 628 C606 824 282 814 96 620 Z"/><path d="M780 628 L850 518 L850 740 Z"/><path d="M470 452 C528 340 640 316 722 380 C644 454 562 478 470 452 Z"/><path d="M500 794 C570 900 690 936 770 872 C686 800 596 780 500 794 Z"/><path d="M636 602 h.1"/><path d="M644 676 C704 656 742 636 778 604"/><path d="M250 700 C344 650 452 648 540 700"/>`, '<path d="M86 1008 C190 960 302 1024 410 990 S610 956 738 1010 S814 1048 846 1014"/>');
  if (slug === 'plesiosaurus') return shell(label, 'dinosaurs', `<ellipse cx="438" cy="688" rx="230" ry="122"/><path d="M578 620 C608 420 718 286 812 260 C850 330 806 414 704 474 C648 508 620 562 616 644"/><circle cx="816" cy="260" r="36"/><path d="M826 252 h.1"/><path d="M258 680 C176 650 106 604 64 536"/><path d="M332 764 C252 858 160 900 72 872 M542 762 C634 846 726 878 818 842"/><path d="M380 566 C446 500 548 478 638 512"/>`, '<path d="M86 1008 C190 960 302 1024 410 990 S610 956 738 1010 S814 1048 846 1014"/>');
  return shell(label, 'dinosaurs', rex, ground);
}

function animalArt(slug, label) {
  const ground = '<path d="M96 1080 C230 1038 350 1112 482 1076 S704 1038 812 1090"/>';
  if (slug === 'lion') return shell(label, 'animals', `<circle cx="450" cy="402" r="190"/><path d="M450 200 L492 262 L566 230 L578 308 L652 326 L604 392 L650 456 L574 482 L556 560 L486 524 L450 590 L414 524 L344 560 L326 482 L250 456 L296 392 L248 326 L322 308 L334 230 L408 262 Z"/><circle cx="450" cy="402" r="106"/><path d="M412 386 h.1 M488 386 h.1 M450 428 C424 456 476 456 450 428 Z M396 486 C432 520 468 520 504 486"/><ellipse cx="450" cy="720" rx="188" ry="210"/><path d="M320 862 v124 M580 862 v124"/>`, ground);
  if (slug === 'elephant') return shell(label, 'animals', `<ellipse cx="450" cy="646" rx="230" ry="238"/><circle cx="450" cy="380" r="150"/><path d="M310 372 C190 250 126 340 170 502 C254 506 304 456 310 372 Z"/><path d="M590 372 C710 250 774 340 730 502 C646 506 596 456 590 372 Z"/><path d="M450 434 C392 554 418 690 500 760 C558 664 522 542 450 434 Z"/><path d="M386 398 h.1 M514 398 h.1"/><path d="M360 498 C324 558 290 590 242 610 M540 498 C576 558 610 590 658 610"/><path d="M308 820 v150 M430 862 v130 M560 862 v130 M682 820 v150"/>`, ground);
  if (slug === 'giraffe') return shell(label, 'animals', `<ellipse cx="474" cy="750" rx="190" ry="132"/><path d="M548 668 C558 500 588 342 656 230 C746 242 776 326 732 402 C686 484 656 570 642 704"/><circle cx="692" cy="238" r="72"/><path d="M660 168 l-28 -70 M720 172 l30 -70"/><path d="M670 230 h.1 M724 260 C700 284 674 284 650 264"/><path d="M340 820 v156 M480 836 v156 M594 810 v166 M672 760 v170"/><circle cx="420" cy="710" r="28"/><circle cx="528" cy="762" r="24"/><circle cx="612" cy="604" r="22"/><circle cx="670" cy="384" r="18"/>`, ground);
  if (slug === 'zebra') return shell(label, 'animals', `<ellipse cx="456" cy="674" rx="232" ry="150"/><path d="M636 610 C688 490 774 444 820 506 C792 600 728 650 646 654"/><circle cx="770" cy="480" r="70"/><path d="M740 468 h.1 M792 506 C770 528 744 528 720 508"/><path d="M300 790 v176 M442 812 v164 M582 792 v176 M668 724 v168"/><path d="M300 548 l88 250 M404 526 l104 294 M514 536 l100 260 M650 584 l-78 210 M706 430 l-62 170 M782 420 l-70 134"/><path d="M642 376 l-50 -104 M708 374 l34 -112"/>`, ground);
  if (slug === 'panda') return shell(label, 'animals', `<ellipse cx="450" cy="650" rx="200" ry="252"/><circle cx="450" cy="350" r="150"/><circle cx="332" cy="224" r="66"/><circle cx="568" cy="224" r="66"/><ellipse cx="388" cy="348" rx="52" ry="42" transform="rotate(-22 388 348)"/><ellipse cx="512" cy="348" rx="52" ry="42" transform="rotate(22 512 348)"/><path d="M450 394 C420 428 480 428 450 394 Z M398 470 C430 500 470 500 502 470"/><path d="M292 720 C210 790 178 884 186 986 M608 720 C690 790 722 884 714 986"/><path d="M364 860 v126 M536 860 v126"/>`, ground);
  if (slug === 'koala') return shell(label, 'animals', `<circle cx="450" cy="430" r="154"/><circle cx="292" cy="360" r="88"/><circle cx="608" cy="360" r="88"/><ellipse cx="450" cy="440" rx="54" ry="76"/><path d="M388 404 h.1 M512 404 h.1 M394 512 C430 548 470 548 506 512"/><ellipse cx="450" cy="746" rx="160" ry="220"/><path d="M330 650 C260 710 230 820 246 954 M570 650 C640 710 670 820 654 954"/><path d="M672 260 C646 492 646 812 674 1040"/>`, ground);
  if (slug === 'dolphin') return shell(label, 'animals', `<path d="M134 642 C292 394 606 376 790 530 C642 552 542 650 426 820 C356 742 258 688 134 642 Z"/><path d="M786 530 L850 438 L846 616 Z"/><path d="M426 822 C500 902 618 920 706 856"/><path d="M430 466 C474 360 584 320 662 384 C594 456 516 480 430 466 Z"/><path d="M614 520 h.1"/><path d="M270 640 C340 610 414 612 488 652"/>`, '<path d="M90 1010 C194 952 302 1024 414 988 S614 952 738 1010 S810 1048 846 1012"/>');
  if (slug === 'sea-turtle') return shell(label, 'animals', `<ellipse cx="450" cy="640" rx="236" ry="178"/><circle cx="450" cy="640" r="78"/><path d="M278 548 C376 500 526 500 622 548 M236 640 H664 M278 732 C376 780 526 780 622 732"/><path d="M676 624 C760 574 820 592 846 650 C792 704 734 708 676 656 Z"/><path d="M244 548 C152 492 80 516 64 594 C132 636 194 626 244 548 Z"/><path d="M244 732 C152 788 80 764 64 686 C132 644 194 654 244 732 Z"/><path d="M604 548 C704 472 792 480 826 558 C752 622 676 620 604 548 Z"/><path d="M604 732 C704 808 792 800 826 722 C752 658 676 660 604 732 Z"/>`, '<path d="M90 1010 C194 952 302 1024 414 988 S614 952 738 1010 S810 1048 846 1012"/>');
  if (slug === 'owl') return shell(label, 'animals', `<path d="M450 210 C620 250 706 410 676 650 C648 878 550 996 450 1014 C350 996 252 878 224 650 C194 410 280 250 450 210 Z"/><circle cx="380" cy="402" r="78"/><circle cx="520" cy="402" r="78"/><circle cx="380" cy="402" r="20"/><circle cx="520" cy="402" r="20"/><path d="M450 454 l-42 66 h84 Z"/><path d="M290 590 C350 654 380 760 358 890 M610 590 C550 654 520 760 542 890"/><path d="M372 998 l-54 60 M528 998 l54 60"/>`, ground);
  if (slug === 'fox') return shell(label, 'animals', `<path d="M450 250 L610 420 L566 660 H334 L290 420 Z"/><path d="M362 350 h.1 M538 350 h.1 M450 420 C418 454 482 454 450 420 Z M384 520 C426 556 474 556 516 520"/><ellipse cx="450" cy="760" rx="150" ry="188"/><path d="M590 724 C740 720 820 828 772 976 C662 950 584 862 590 724 Z"/><path d="M330 866 v118 M570 866 v118"/><path d="M334 660 C250 700 214 786 224 912 M566 660 C650 700 686 786 676 912"/>`, ground);
  if (slug === 'rabbit') return shell(label, 'animals', `<ellipse cx="450" cy="650" rx="170" ry="236"/><circle cx="450" cy="380" r="124"/><path d="M394 286 C300 88 376 44 452 260 Z"/><path d="M506 286 C600 88 524 44 448 260 Z"/><path d="M402 370 h.1 M498 370 h.1 M450 412 C424 438 476 438 450 412 Z M392 474 C430 508 470 508 508 474"/><path d="M326 774 C228 830 190 912 206 1008 M574 774 C672 830 710 912 694 1008"/><path d="M372 872 v116 M528 872 v116"/>`, ground);
  if (slug === 'horse') return shell(label, 'animals', `<ellipse cx="450" cy="692" rx="226" ry="142"/><path d="M616 620 C666 492 766 436 818 514 C792 604 724 662 634 656"/><circle cx="760" cy="478" r="70"/><path d="M734 462 h.1 M788 506 C766 528 740 528 716 508"/><path d="M642 392 C600 462 604 552 638 636"/><path d="M300 796 v176 M440 814 v164 M578 796 v176 M678 730 v168"/><path d="M236 630 C150 588 118 516 108 438 M676 408 l-42 -104 M740 410 l38 -98"/>`, ground);
  if (slug === 'frog') return shell(label, 'animals', `<ellipse cx="450" cy="650" rx="224" ry="180"/><circle cx="348" cy="448" r="70"/><circle cx="552" cy="448" r="70"/><circle cx="348" cy="448" r="18"/><circle cx="552" cy="448" r="18"/><path d="M360 620 C420 660 480 660 540 620"/><path d="M300 724 C200 730 140 792 112 890 M600 724 C700 730 760 792 788 890"/><path d="M330 786 C250 882 260 978 350 1014 M570 786 C650 882 640 978 550 1014"/>`, '<path d="M120 1022 C250 960 360 1034 480 1004 S696 966 804 1030"/>');
  if (slug === 'penguin') return shell(label, 'animals', `<ellipse cx="450" cy="640" rx="174" ry="344"/><ellipse cx="450" cy="690" rx="116" ry="244"/><circle cx="450" cy="330" r="118"/><path d="M450 360 l-54 58 h108 Z"/><path d="M404 320 h.1 M496 320 h.1"/><path d="M300 574 C198 656 182 790 260 908 M600 574 C702 656 718 790 640 908"/><path d="M382 980 l-86 54 M518 980 l86 54"/>`, '<path d="M118 1060 H800 M166 1008 C244 968 326 1016 410 992 S590 964 706 1014"/>');
  if (slug === 'bear') return shell(label, 'animals', `<ellipse cx="450" cy="662" rx="210" ry="256"/><circle cx="450" cy="356" r="148"/><circle cx="328" cy="230" r="62"/><circle cx="572" cy="230" r="62"/><ellipse cx="450" cy="426" rx="72" ry="58"/><path d="M396 340 h.1 M504 340 h.1 M450 402 C420 430 480 430 450 402 Z M386 474 C430 512 470 512 514 474"/><path d="M292 730 C210 802 174 896 190 1000 M608 730 C690 802 726 896 710 1000"/><path d="M354 858 v134 M546 858 v134"/>`, ground);
  if (slug === 'kangaroo') return shell(label, 'animals', `<ellipse cx="430" cy="656" rx="150" ry="246"/><circle cx="490" cy="328" r="90"/><path d="M448 262 C394 122 456 86 512 246 M526 258 C604 132 654 186 552 294"/><path d="M468 318 h.1 M522 356 C500 382 474 382 452 360"/><path d="M534 620 C648 700 724 834 782 1000"/><path d="M360 824 C260 886 204 954 152 1040"/><path d="M486 828 C590 884 646 954 702 1040"/><path d="M350 596 C296 640 268 706 278 782 M502 568 C572 600 610 666 614 746"/><ellipse cx="496" cy="690" rx="48" ry="74"/>`, ground);
  if (slug === 'whale') return shell(label, 'animals', `<path d="M104 634 C296 414 650 440 800 630 C644 814 304 820 104 634 Z"/><path d="M800 630 L856 540 L854 724 Z"/><path d="M378 470 C424 348 546 322 636 390 C560 478 462 504 378 470 Z"/><path d="M622 602 h.1"/><path d="M222 690 C316 640 444 640 550 698"/><path d="M500 266 C472 184 512 132 576 102 M516 266 C594 202 666 202 720 256"/>`, '<path d="M90 1010 C194 952 302 1024 414 988 S614 952 738 1010 S810 1048 846 1012"/>');
  if (slug === 'octopus') return shell(label, 'animals', `<path d="M450 238 C590 238 670 350 658 500 C648 628 560 710 450 710 C340 710 252 628 242 500 C230 350 310 238 450 238 Z"/><circle cx="392" cy="420" r="20"/><circle cx="508" cy="420" r="20"/><path d="M390 514 C430 548 470 548 510 514"/><path d="M310 650 C212 710 184 836 244 944 C310 874 356 780 350 690"/><path d="M382 696 C302 800 318 930 408 1012 C450 904 442 798 416 704"/><path d="M472 704 C446 798 450 904 492 1012 C582 930 598 800 518 696"/><path d="M590 650 C688 710 716 836 656 944 C590 874 544 780 550 690"/><path d="M262 604 C154 626 92 724 118 838 C218 804 286 726 314 642"/><path d="M638 604 C746 626 808 724 782 838 C682 804 614 726 586 642"/><path d="M390 692 C342 770 242 798 166 754 M510 692 C558 770 658 798 734 754"/>`, '<path d="M90 1010 C194 952 302 1024 414 988 S614 952 738 1010 S810 1048 846 1012"/>');
  if (slug === 'deer') return shell(label, 'animals', `<ellipse cx="450" cy="704" rx="210" ry="132"/><path d="M606 636 C652 520 740 470 804 530 C780 616 714 664 626 666"/><circle cx="742" cy="486" r="72"/><path d="M720 470 h.1 M772 512 C750 534 724 534 700 514"/><path d="M690 426 C644 330 626 236 660 150 M694 330 C632 286 584 230 560 158 M722 424 C780 326 802 232 766 148 M762 330 C824 286 872 230 896 158"/><path d="M300 810 v154 M442 828 v144 M574 806 v158 M652 742 v150"/>`, ground);
  if (slug === 'cheetah') return shell(label, 'animals', `<ellipse cx="450" cy="676" rx="232" ry="138"/><path d="M632 612 C680 510 764 464 816 526 C792 616 724 662 642 654"/><circle cx="762" cy="492" r="66"/><path d="M740 478 h.1 M790 516 C770 538 744 538 720 518"/><path d="M300 792 v170 M438 812 v156 M578 792 v170 M672 728 v160"/><path d="M236 630 C150 602 112 542 102 476"/><circle cx="340" cy="638" r="18"/><circle cx="442" cy="706" r="16"/><circle cx="546" cy="632" r="18"/><circle cx="632" cy="686" r="14"/><circle cx="722" cy="454" r="12"/><path d="M744 520 C720 558 706 590 700 626"/>`, ground);
  return shell(label, 'animals', `<ellipse cx="450" cy="650" rx="198" ry="246"/><circle cx="450" cy="354" r="144"/><circle cx="338" cy="230" r="62"/><circle cx="562" cy="230" r="62"/><path d="M392 350 h.1 M508 350 h.1 M450 396 C420 428 480 428 450 396 Z M390 470 C430 506 470 506 510 470"/><path d="M292 730 C214 792 178 888 190 990 M608 730 C686 792 722 888 710 990"/><path d="M360 860 v128 M540 860 v128"/>`, ground);
}

function makeSvg(category, slug, label) {
  if (category === 'plants') return plantArt(slug, label);
  if (category === 'insects') return insectArt(slug, label);
  if (category === 'dinosaurs') return dinosaurArt(slug, label);
  return animalArt(slug, label);
}

fs.mkdirSync(outDir, { recursive: true });

const manifest = [];
Object.entries(categories).forEach(([category, items]) => {
  items.forEach(([slug, label]) => {
    const file = `${category}-${slug}.svg`;
    fs.writeFileSync(path.join(outDir, file), makeSvg(category, slug, label), 'utf8');
    manifest.push({ id: `${category}-${slug}`, category, label, path: `assets/coloring-book/${file}` });
  });
});

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'README.md'), `# DrawSplatTM Coloring Book Assets

These SVG coloring pages are original DrawSplatTM line-art assets generated for classroom coloring.

- Count: ${manifest.length} pages
- Categories: plants, insects, dinosaurs, animals
- License: CC0 1.0 public-domain dedication for unrestricted classroom and project use
- Source: local subject-specific generator at tools/generate-coloring-book-assets.js

The artwork is original SVG line art. It is not copied, traced, or adapted from Crayola or other third-party coloring pages.
`, 'utf8');

console.log(`Generated ${manifest.length} coloring-book SVG assets in ${outDir}`);

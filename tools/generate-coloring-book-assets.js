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

function shell(title, category, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)} coloring page</title>
  <desc id="desc">Original copyright-free DrawSplat line art for classroom coloring use.</desc>
  <rect width="900" height="1200" fill="#fff"/>
  <g fill="none" stroke="#111827" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <rect x="42" y="42" width="816" height="1116" rx="34" stroke-width="5"/>
    ${body}
  </g>
  <g fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round" opacity=".45">
    <path d="M90 1110 C180 1080 250 1140 350 1112 S540 1088 650 1118 S790 1138 830 1100"/>
  </g>
  <metadata>DrawSplat original procedural SVG line art; category=${esc(category)}; license=CC0-1.0/public-domain-dedicated.</metadata>
</svg>
`;
}

function plantArt(slug, i) {
  const petals = 8 + (i % 6);
  const flower = Array.from({ length: petals }, (_, n) => {
    const a = -90 + n * 360 / petals;
    return `<ellipse cx="450" cy="390" rx="${44 + (i % 3) * 8}" ry="106" transform="rotate(${a} 450 390)"/>`;
  }).join('\n    ');
  const leafPairs = Array.from({ length: 4 + (i % 3) }, (_, n) => {
    const y = 570 + n * 72;
    const side = n % 2 ? -1 : 1;
    return `<path d="M450 ${y} C${450 + side * 95} ${y - 72} ${450 + side * 170} ${y - 40} ${450 + side * 200} ${y + 34} C${450 + side * 118} ${y + 64} ${450 + side * 58} ${y + 38} 450 ${y} Z"/>`;
  }).join('\n    ');
  const pot = `<path d="M304 972 H596 L552 1090 H348 Z"/><path d="M278 930 H622 V972 H278 Z"/>`;
  const cactus = `<path d="M450 940 C386 850 386 470 450 350 C514 470 514 850 450 940 Z"/>
    <path d="M386 650 C292 608 282 486 342 438 C382 474 386 554 386 650 Z"/>
    <path d="M514 730 C624 690 638 548 564 500 C520 548 516 632 514 730 Z"/>
    <path d="M420 472 l-22 28 M488 526 l28 22 M430 650 l-28 18 M488 780 l28 18"/>${pot}`;
  const fern = `<path d="M450 1030 C420 810 450 600 520 360"/>
    ${Array.from({ length: 11 }, (_, n) => {
      const y = 910 - n * 48, len = 95 + n * 7;
      return `<path d="M${450 + n * 7} ${y} C${450 - len} ${y - 25} ${430 - len} ${y - 88} ${390 - len / 2} ${y - 118}"/>
      <path d="M${450 + n * 7} ${y} C${450 + len} ${y - 40} ${470 + len} ${y - 102} ${520 + len / 2} ${y - 130}"/>`;
    }).join('\n    ')}`;
  const leaf = `<path d="M452 1028 C220 780 236 450 520 264 C706 540 670 846 452 1028 Z"/>
    <path d="M452 1028 C470 812 482 604 520 264"/>
    <path d="M468 780 C392 760 326 720 260 648 M482 684 C566 642 626 584 676 506 M474 884 C392 864 332 832 274 780"/>`;
  const sprout = `<path d="M450 1028 V670"/>
    <path d="M450 730 C330 610 292 470 364 354 C484 418 512 568 450 730 Z"/>
    <path d="M450 780 C590 650 632 510 558 392 C430 482 400 634 450 780 Z"/>
    <circle cx="450" cy="348" r="74"/>
    ${pot}`;
  if (slug.includes('cactus') || slug.includes('aloe') || slug.includes('succulent')) return shell(slug, 'plants', cactus);
  if (slug.includes('fern') || slug.includes('palm') || slug.includes('bamboo') || slug.includes('seaweed')) return shell(slug, 'plants', fern);
  if (slug.includes('leaf') || slug.includes('clover')) return shell(slug, 'plants', leaf);
  return shell(slug, 'plants', `${flower}<circle cx="450" cy="390" r="82"/><path d="M450 472 V976"/>${leafPairs}${sprout}`);
}

function insectArt(slug, i) {
  const wing = i % 2 ? 'C210 230 340 210 420 520 C300 608 180 566 142 446 C110 344 142 266 210 230 Z' : 'C182 252 326 190 424 516 C316 640 160 596 122 448 C98 350 118 286 182 252 Z';
  const butterfly = `<path d="M448 320 C424 454 424 726 448 888"/><path d="M452 320 C476 454 476 726 452 888"/>
    <path d="M446 512 ${wing}"/>
    <path d="M454 512 C690 230 814 266 778 446 C740 566 600 608 454 520 Z"/>
    <path d="M446 700 C260 676 156 764 196 884 C260 1030 406 930 446 760 Z"/>
    <path d="M454 700 C640 676 744 764 704 884 C640 1030 494 930 454 760 Z"/>
    <circle cx="450" cy="282" r="44"/><path d="M424 248 C382 190 326 178 292 212 M476 248 C518 190 574 178 608 212"/>`;
  const beetle = `<ellipse cx="450" cy="620" rx="190" ry="280"/><path d="M450 342 V900"/><circle cx="450" cy="282" r="72"/>
    <path d="M330 428 C232 372 168 370 112 438 M570 428 C668 372 732 370 788 438"/>
    <path d="M306 600 C216 592 156 626 104 710 M594 600 C684 592 744 626 796 710"/>
    <path d="M332 790 C256 832 220 896 198 990 M568 790 C644 832 680 896 702 990"/>
    <path d="M382 242 C340 172 284 148 232 170 M518 242 C560 172 616 148 668 170"/>
    <path d="M334 520 C386 488 414 488 450 520 C486 488 514 488 566 520"/>`;
  const bee = `<ellipse cx="450" cy="620" rx="178" ry="248"/><path d="M308 496 H592 M282 604 H618 M308 712 H592"/>
    <ellipse cx="340" cy="384" rx="112" ry="160" transform="rotate(-28 340 384)"/>
    <ellipse cx="560" cy="384" rx="112" ry="160" transform="rotate(28 560 384)"/>
    <circle cx="450" cy="332" r="62"/><path d="M430 316 h.1 M470 316 h.1"/><path d="M450 868 l-36 84 M450 868 l36 84"/>
    <path d="M400 282 C356 216 302 206 262 232 M500 282 C544 216 598 206 638 232"/>`;
  if (slug.includes('butterfly') || slug.includes('moth')) return shell(slug, 'insects', butterfly);
  if (slug.includes('bee') || slug.includes('wasp') || slug.includes('firefly')) return shell(slug, 'insects', bee);
  return shell(slug, 'insects', beetle);
}

function dinosaurArt(slug, i) {
  const plates = Array.from({ length: 8 }, (_, n) => `<path d="M${250 + n * 58} ${520 - Math.sin(n) * 35} l34 -78 l34 78"/>`).join('\n    ');
  const longNeck = `<path d="M238 760 C230 580 322 480 454 504 C570 526 650 632 700 768"/>
    <path d="M470 510 C520 340 602 232 726 184 C780 250 742 348 642 394 C590 418 552 464 536 534"/>
    <path d="M238 760 C178 780 128 824 94 902"/><path d="M306 760 v188 M456 752 v196 M594 762 v186"/>
    <circle cx="728" cy="182" r="42"/><path d="M746 176 h.1 M706 206 C728 224 754 222 774 204"/>`;
  const tRex = `<path d="M204 742 C248 562 410 462 596 502 C734 532 776 640 708 730 C632 832 416 826 278 782 Z"/>
    <path d="M594 508 C660 412 764 408 812 492 C770 526 704 532 630 520"/>
    <path d="M300 780 L228 958 M458 812 L504 966 M606 758 L680 924"/>
    <path d="M324 630 C264 644 222 628 190 592 M650 610 l62 38 M732 484 h.1"/>
    <path d="M220 750 C150 762 110 720 86 666"/>`;
  const trike = `<path d="M196 744 C250 560 548 510 716 656 C770 704 770 790 696 834 C536 928 278 890 196 744 Z"/>
    <path d="M628 584 C676 434 806 390 838 522 C792 596 710 626 628 584 Z"/>
    <path d="M690 534 l-28 -118 M746 538 l64 -92 M628 586 l-112 -74"/>
    <path d="M296 820 v130 M458 844 v118 M610 820 v130 M270 660 h.1"/>`;
  const stego = `<path d="M160 744 C270 536 576 548 726 704 C632 872 330 908 160 744 Z"/>
    ${plates}
    <path d="M700 706 C770 686 820 714 850 770"/><path d="M188 728 C114 714 82 674 66 622"/>
    <path d="M276 830 v122 M430 852 v110 M584 828 v124"/>`;
  if (slug.includes('brachio') || slug.includes('diplodocus') || slug.includes('apato')) return shell(slug, 'dinosaurs', longNeck);
  if (slug.includes('triceratops') || slug.includes('pachy')) return shell(slug, 'dinosaurs', trike);
  if (slug.includes('stego') || slug.includes('ankylo')) return shell(slug, 'dinosaurs', stego);
  return shell(slug, 'dinosaurs', tRex);
}

function animalArt(slug, i) {
  const mammal = `<ellipse cx="450" cy="632" rx="206" ry="246"/><circle cx="450" cy="350" r="154"/>
    <circle cx="336" cy="228" r="64"/><circle cx="564" cy="228" r="64"/>
    <path d="M390 354 h.1 M510 354 h.1 M450 386 C420 430 480 430 450 386 Z M386 470 C430 512 488 512 528 470"/>
    <path d="M288 734 C210 792 178 876 184 980 M612 734 C690 792 722 876 716 980"/>
    <path d="M364 866 v126 M536 866 v126"/>`;
  const bird = `<ellipse cx="450" cy="610" rx="170" ry="240"/><circle cx="450" cy="314" r="112"/>
    <path d="M450 346 l-50 70 h100 Z"/><path d="M360 300 h.1 M540 300 h.1"/>
    <path d="M292 560 C172 606 146 740 228 850 C310 792 340 682 292 560 Z"/>
    <path d="M608 560 C728 606 754 740 672 850 C590 792 560 682 608 560 Z"/>
    <path d="M390 842 L348 980 M510 842 L552 980 M348 980 h-62 M552 980 h62"/>`;
  const aquatic = `<path d="M128 626 C284 430 596 432 754 626 C596 820 284 822 128 626 Z"/>
    <path d="M754 626 L842 520 L842 732 Z"/><path d="M328 546 C382 500 470 500 530 548"/>
    <path d="M610 616 h.1"/><path d="M250 710 C318 676 382 676 450 710"/>
    <path d="M388 438 C420 348 512 310 578 364 C526 430 456 454 388 438 Z"/>`;
  const hoof = `<ellipse cx="468" cy="626" rx="226" ry="168"/><path d="M646 552 C710 424 790 382 824 454 C808 554 734 610 650 608"/>
    <circle cx="742" cy="430" r="76"/><path d="M720 410 h.1 M774 454 C750 478 724 478 700 458"/>
    <path d="M596 760 v220 M706 728 v252 M330 760 v220 M232 724 v256"/>
    <path d="M236 540 C164 506 120 450 110 384 M662 370 l-52 -100 M724 360 l22 -112"/>`;
  if (slug.includes('dolphin') || slug.includes('whale') || slug.includes('turtle') || slug.includes('octopus')) return shell(slug, 'animals', aquatic);
  if (slug.includes('owl') || slug.includes('penguin')) return shell(slug, 'animals', bird);
  if (slug.includes('giraffe') || slug.includes('zebra') || slug.includes('horse') || slug.includes('deer')) return shell(slug, 'animals', hoof);
  return shell(slug, 'animals', mammal);
}

function makeSvg(category, slug, label, i) {
  if (category === 'plants') return plantArt(slug, i);
  if (category === 'insects') return insectArt(slug, i);
  if (category === 'dinosaurs') return dinosaurArt(slug, i);
  return animalArt(slug, i);
}

fs.mkdirSync(outDir, { recursive: true });

const manifest = [];
Object.entries(categories).forEach(([category, items]) => {
  items.forEach(([slug, label], i) => {
    const file = `${category}-${slug}.svg`;
    fs.writeFileSync(path.join(outDir, file), makeSvg(category, slug, label, i), 'utf8');
    manifest.push({ id: `${category}-${slug}`, category, label, path: `assets/coloring-book/${file}` });
  });
});

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'README.md'), `# DrawSplat Coloring Book Assets

These SVG coloring pages are original procedural line-art assets generated for DrawSplat.

- Count: ${manifest.length} pages
- Categories: plants, insects, dinosaurs, animals
- License: CC0 1.0 public-domain dedication for unrestricted classroom and project use
- Source: local procedural generator at tools/generate-coloring-book-assets.js

They are not copied from third-party illustrations or photographs.
`, 'utf8');

console.log(`Generated ${manifest.length} coloring-book SVG assets in ${outDir}`);

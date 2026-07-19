export interface EmojiCategory {
  id: string;
  label: string;
  emojis: Array<{ char: string; name: string; keywords: string }>;
}

// A curated, classroom-friendly emoji set with search keywords. Kept as data so
// the picker can search by name/keyword and insert plain Unicode characters.
export const emojiCategories: EmojiCategory[] = [
  {
    id: 'smileys',
    label: 'Smileys',
    emojis: [
      { char: '😀', name: 'grinning', keywords: 'happy smile face' },
      { char: '😃', name: 'smiley', keywords: 'happy joy face' },
      { char: '😄', name: 'smile', keywords: 'happy laugh face' },
      { char: '😁', name: 'grin', keywords: 'happy teeth face' },
      { char: '😆', name: 'laughing', keywords: 'lol haha face' },
      { char: '😅', name: 'sweat smile', keywords: 'relief phew face' },
      { char: '🤣', name: 'rofl', keywords: 'laugh floor funny' },
      { char: '😂', name: 'joy', keywords: 'laugh cry tears' },
      { char: '🙂', name: 'slight smile', keywords: 'smile face' },
      { char: '😉', name: 'wink', keywords: 'joke flirt face' },
      { char: '😊', name: 'blush', keywords: 'happy shy face' },
      { char: '😇', name: 'innocent', keywords: 'angel halo face' },
      { char: '🥰', name: 'smiling hearts', keywords: 'love adore face' },
      { char: '😍', name: 'heart eyes', keywords: 'love crush face' },
      { char: '😘', name: 'kiss', keywords: 'love blow face' },
      { char: '😋', name: 'yum', keywords: 'tasty tongue food' },
      { char: '😜', name: 'winking tongue', keywords: 'silly joke face' },
      { char: '🤪', name: 'zany', keywords: 'crazy wild goofy' },
      { char: '🤗', name: 'hug', keywords: 'hugging warm face' },
      { char: '🤔', name: 'thinking', keywords: 'hmm wonder face' },
      { char: '🤨', name: 'raised eyebrow', keywords: 'suspicious face' },
      { char: '😐', name: 'neutral', keywords: 'meh blank face' },
      { char: '😴', name: 'sleeping', keywords: 'sleep zzz tired' },
      { char: '😎', name: 'sunglasses', keywords: 'cool awesome face' },
      { char: '🤓', name: 'nerd', keywords: 'smart glasses geek' },
      { char: '😭', name: 'sob', keywords: 'cry sad tears' },
      { char: '😱', name: 'scream', keywords: 'shock fear face' },
      { char: '😡', name: 'angry', keywords: 'mad rage face' },
      { char: '🤯', name: 'mind blown', keywords: 'wow shock explode' },
      { char: '🥳', name: 'party', keywords: 'celebrate hat fun' },
      { char: '😬', name: 'grimace', keywords: 'awkward nervous face' },
      { char: '🤒', name: 'sick', keywords: 'ill thermometer face' },
      { char: '👻', name: 'ghost', keywords: 'boo spooky halloween' },
      { char: '💀', name: 'skull', keywords: 'dead spooky bone' },
      { char: '🤖', name: 'robot', keywords: 'ai machine face' },
      { char: '👽', name: 'alien', keywords: 'space ufo face' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    emojis: [
      { char: '👍', name: 'thumbs up', keywords: 'yes good like approve' },
      { char: '👎', name: 'thumbs down', keywords: 'no bad dislike' },
      { char: '👏', name: 'clap', keywords: 'applause good job' },
      { char: '🙌', name: 'raising hands', keywords: 'praise celebrate yay' },
      { char: '👋', name: 'wave', keywords: 'hello hi bye hand' },
      { char: '🤝', name: 'handshake', keywords: 'deal agree meet' },
      { char: '✌️', name: 'peace', keywords: 'victory two hand' },
      { char: '🤞', name: 'fingers crossed', keywords: 'luck hope hand' },
      { char: '👌', name: 'ok', keywords: 'okay good hand' },
      { char: '🙏', name: 'pray', keywords: 'thanks please hope' },
      { char: '💪', name: 'muscle', keywords: 'strong flex power' },
      { char: '🧠', name: 'brain', keywords: 'smart think mind' },
      { char: '👀', name: 'eyes', keywords: 'look see watch' },
      { char: '🧑‍🏫', name: 'teacher', keywords: 'school class educator' },
      { char: '🧑‍🎓', name: 'student', keywords: 'graduate school learn' },
      { char: '👨‍👩‍👧', name: 'family', keywords: 'parents kids home' },
      { char: '🦸', name: 'superhero', keywords: 'hero cape power' },
    ],
  },
  {
    id: 'nature',
    label: 'Animals & Nature',
    emojis: [
      { char: '🐶', name: 'dog', keywords: 'puppy pet animal' },
      { char: '🐱', name: 'cat', keywords: 'kitten pet animal' },
      { char: '🐭', name: 'mouse', keywords: 'rodent animal' },
      { char: '🐰', name: 'rabbit', keywords: 'bunny animal' },
      { char: '🦊', name: 'fox', keywords: 'animal clever' },
      { char: '🐻', name: 'bear', keywords: 'animal grizzly' },
      { char: '🐼', name: 'panda', keywords: 'bear animal' },
      { char: '🦁', name: 'lion', keywords: 'animal king' },
      { char: '🐯', name: 'tiger', keywords: 'animal cat' },
      { char: '🐸', name: 'frog', keywords: 'animal toad' },
      { char: '🐵', name: 'monkey', keywords: 'animal ape' },
      { char: '🦋', name: 'butterfly', keywords: 'insect bug pretty' },
      { char: '🐝', name: 'bee', keywords: 'insect bug honey' },
      { char: '🐢', name: 'turtle', keywords: 'animal slow' },
      { char: '🐍', name: 'snake', keywords: 'animal reptile' },
      { char: '🦖', name: 'dinosaur', keywords: 'trex rex animal' },
      { char: '🐳', name: 'whale', keywords: 'animal ocean sea' },
      { char: '🐙', name: 'octopus', keywords: 'animal ocean sea' },
      { char: '🌳', name: 'tree', keywords: 'nature plant forest' },
      { char: '🌸', name: 'blossom', keywords: 'flower spring pink' },
      { char: '🌻', name: 'sunflower', keywords: 'flower yellow' },
      { char: '🌈', name: 'rainbow', keywords: 'colors sky weather' },
      { char: '⭐', name: 'star', keywords: 'night sky favorite' },
      { char: '🌙', name: 'moon', keywords: 'night sky crescent' },
      { char: '☀️', name: 'sun', keywords: 'sunny weather day' },
      { char: '⛄', name: 'snowman', keywords: 'winter cold snow' },
      { char: '🔥', name: 'fire', keywords: 'hot flame lit' },
      { char: '💧', name: 'water drop', keywords: 'rain wet droplet' },
      { char: '⚡', name: 'lightning', keywords: 'storm energy bolt' },
    ],
  },
  {
    id: 'food',
    label: 'Food',
    emojis: [
      { char: '🍎', name: 'apple', keywords: 'fruit red food' },
      { char: '🍌', name: 'banana', keywords: 'fruit yellow food' },
      { char: '🍓', name: 'strawberry', keywords: 'fruit berry food' },
      { char: '🍕', name: 'pizza', keywords: 'food slice cheese' },
      { char: '🍔', name: 'burger', keywords: 'food hamburger' },
      { char: '🌮', name: 'taco', keywords: 'food mexican' },
      { char: '🍟', name: 'fries', keywords: 'food chips' },
      { char: '🍪', name: 'cookie', keywords: 'food dessert sweet' },
      { char: '🍩', name: 'donut', keywords: 'food dessert sweet' },
      { char: '🎂', name: 'cake', keywords: 'birthday dessert party' },
      { char: '🍦', name: 'ice cream', keywords: 'food dessert cold' },
      { char: '🍫', name: 'chocolate', keywords: 'food sweet candy' },
      { char: '🍿', name: 'popcorn', keywords: 'food movie snack' },
      { char: '🥕', name: 'carrot', keywords: 'food vegetable' },
      { char: '🥦', name: 'broccoli', keywords: 'food vegetable green' },
      { char: '☕', name: 'coffee', keywords: 'drink hot tea' },
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    emojis: [
      { char: '⚽', name: 'soccer', keywords: 'ball sport football' },
      { char: '🏀', name: 'basketball', keywords: 'ball sport hoop' },
      { char: '🏈', name: 'football', keywords: 'ball sport' },
      { char: '⚾', name: 'baseball', keywords: 'ball sport' },
      { char: '🎾', name: 'tennis', keywords: 'ball sport racket' },
      { char: '🏆', name: 'trophy', keywords: 'win award champion' },
      { char: '🥇', name: 'gold medal', keywords: 'first win award' },
      { char: '🎨', name: 'art', keywords: 'paint palette draw' },
      { char: '🎭', name: 'theater', keywords: 'drama masks play' },
      { char: '🎵', name: 'music note', keywords: 'song sound melody' },
      { char: '🎸', name: 'guitar', keywords: 'music instrument rock' },
      { char: '🎮', name: 'game', keywords: 'video controller play' },
      { char: '🎲', name: 'dice', keywords: 'game roll board' },
      { char: '📚', name: 'books', keywords: 'read study library' },
      { char: '✏️', name: 'pencil', keywords: 'write draw school' },
      { char: '🎯', name: 'target', keywords: 'goal aim bullseye' },
    ],
  },
  {
    id: 'objects',
    label: 'Objects & Symbols',
    emojis: [
      { char: '❤️', name: 'red heart', keywords: 'love like' },
      { char: '🧡', name: 'orange heart', keywords: 'love' },
      { char: '💛', name: 'yellow heart', keywords: 'love' },
      { char: '💚', name: 'green heart', keywords: 'love' },
      { char: '💙', name: 'blue heart', keywords: 'love' },
      { char: '💜', name: 'purple heart', keywords: 'love' },
      { char: '⭐', name: 'star symbol', keywords: 'favorite rate' },
      { char: '✨', name: 'sparkles', keywords: 'shiny magic clean' },
      { char: '🎉', name: 'party popper', keywords: 'celebrate congrats' },
      { char: '🎈', name: 'balloon', keywords: 'party birthday' },
      { char: '🎁', name: 'gift', keywords: 'present birthday' },
      { char: '💡', name: 'idea', keywords: 'light bulb think' },
      { char: '🔑', name: 'key', keywords: 'lock secret' },
      { char: '💰', name: 'money bag', keywords: 'cash coins' },
      { char: '⏰', name: 'alarm clock', keywords: 'time wake' },
      { char: '📅', name: 'calendar', keywords: 'date schedule' },
      { char: '📌', name: 'pin', keywords: 'note remember' },
      { char: '✅', name: 'check', keywords: 'done yes correct' },
      { char: '❌', name: 'cross', keywords: 'no wrong incorrect' },
      { char: '❓', name: 'question', keywords: 'ask help unknown' },
      { char: '❗', name: 'exclamation', keywords: 'important warning' },
      { char: '💯', name: '100', keywords: 'perfect score great' },
      { char: '👉', name: 'point right', keywords: 'arrow finger' },
      { char: '🚀', name: 'rocket', keywords: 'space launch fast' },
      { char: '🌍', name: 'earth', keywords: 'world globe planet' },
      { char: '🏠', name: 'house', keywords: 'home building' },
      { char: '🚗', name: 'car', keywords: 'vehicle drive' },
    ],
  },
];

const shortcodeMap = new Map<string, string>();
emojiCategories.forEach((category) => {
  category.emojis.forEach((emoji) => {
    const code = emoji.name.replace(/\s+/g, '_');
    if (!shortcodeMap.has(code)) shortcodeMap.set(code, emoji.char);
  });
});
// A few friendly aliases beyond the display names.
[
  ['smile', '😊'],
  ['heart', '❤️'],
  ['star', '⭐'],
  ['check', '✅'],
  ['x', '❌'],
  ['fire', '🔥'],
  ['100', '💯'],
  ['thumbsup', '👍'],
  ['thumbsdown', '👎'],
  ['tada', '🎉'],
  ['rocket', '🚀'],
  ['thinking', '🤔'],
].forEach(([code, char]) => shortcodeMap.set(code, char));

export function emojiForShortcode(code: string): string | undefined {
  return shortcodeMap.get(code.toLowerCase());
}

export function searchEmojis(query: string): Array<{ char: string; name: string }> {
  const q = query.trim().toLowerCase();
  const results: Array<{ char: string; name: string }> = [];
  emojiCategories.forEach((category) => {
    category.emojis.forEach((emoji) => {
      if (!q || emoji.name.includes(q) || emoji.keywords.includes(q)) {
        results.push({ char: emoji.char, name: emoji.name });
      }
    });
  });
  return results;
}

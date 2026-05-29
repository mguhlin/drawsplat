// Each question/answer holds an i18n key into games/funquiz/locales.js so a
// language switch flips the prompts and answers. Character names (the radio
// values) stay literal English so the result lookup + image map still work.
const questions = [
  {
    qKey: 'pooh.q1.question',
    answers: {
      'Winnie the Pooh': 'pooh.q1.WinnieThePooh',
      'Rabbit':          'pooh.q1.Rabbit',
      'Tigger':          'pooh.q1.Tigger',
      'Owl':             'pooh.q1.Owl'
    }
  },
  {
    qKey: 'pooh.q2.question',
    answers: {
      'Piglet':          'pooh.q2.Piglet',
      'Tigger':          'pooh.q2.Tigger',
      'Eeyore':          'pooh.q2.Eeyore',
      'Kanga':           'pooh.q2.Kanga'
    }
  },
  {
    qKey: 'pooh.q3.question',
    answers: {
      'Winnie the Pooh': 'pooh.q3.WinnieThePooh',
      'Owl':             'pooh.q3.Owl',
      'Tigger':          'pooh.q3.Tigger',
      'Rabbit':          'pooh.q3.Rabbit'
    }
  },
  {
    qKey: 'pooh.q4.question',
    answers: {
      'Kanga':           'pooh.q4.Kanga',
      'Rabbit':          'pooh.q4.Rabbit',
      'Tigger':          'pooh.q4.Tigger',
      'Owl':             'pooh.q4.Owl'
    }
  },
  {
    qKey: 'pooh.q5.question',
    answers: {
      'Piglet':          'pooh.q5.Piglet',
      'Eeyore':          'pooh.q5.Eeyore',
      'Tigger':          'pooh.q5.Tigger',
      'Owl':             'pooh.q5.Owl'
    }
  }
];

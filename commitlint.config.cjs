const ACCENT_RE =
  /[àáâãäåāăąæçćčđďèéêëēĕėęěìíîïĩīĭįıłńñňņòóôõöøōŏőœřśšşťțùúûüũūŭůűųýÿžźżÀÁÂÃÄÅĀĂĄÆÇĆČĐĎÈÉÊËĒĔĖĘĚÌÍÎÏĨĪĬĮİŁŃÑŇŅÒÓÔÕÖØŌŎŐŒŘŚŠŞŤȚÙÚÛÜŨŪŬŮŰŲÝŸŽŹŻ]/;

const EMOJI_RE = /\p{Extended_Pictographic}/u;

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'header-no-emoji': ({ header }) => {
          const ok = !EMOJI_RE.test(header || '');
          return [ok, 'header must not contain emoji'];
        },
        'header-no-accent': ({ header }) => {
          const ok = !ACCENT_RE.test(header || '');
          return [ok, 'header must be English-only'];
        },
        'subject-start-lowercase': ({ subject }) => {
          if (!subject) return [true];
          return [
            /^[a-z0-9]/.test(subject),
            'subject must start with a lowercase letter or digit',
          ];
        },
      },
    },
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'chore',
        'docs',
        'style',
        'refactor',
        'test',
        'ci',
        'build',
        'perf',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-empty': [2, 'always'],
    'subject-case': [0],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'header-no-emoji': [2, 'always'],
    'header-no-accent': [2, 'always'],
    'subject-start-lowercase': [2, 'always'],
  },
};

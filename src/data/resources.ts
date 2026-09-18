import type { ResourceLink, ResourceSlot } from '../types';

/**
 * Resource policy:
 *  - Only WELL-KNOWN, stable documentation URLs are marked verified:true.
 *  - Everything else is an explicit, labelled placeholder slot so the UI
 *    never presents unavailable material as real educational content.
 *  - To ship real content later, fill `link` and flip `available: true`.
 */

export const available = (link: ResourceLink): ResourceSlot => ({
  title: link.title,
  description: `${link.provider}${link.minutes ? ` · ~${link.minutes} min read` : ''} · verified link`,
  available: true,
  link,
});

export const placeholder = (title: string, description: string): ResourceSlot => ({
  title,
  description,
  available: false,
});

/**
 * Curated links to official, long-lived documentation. Safe to hardcode:
 * these are primary sources that rarely move, and the UI labels them as
 * "official docs" so users know exactly what they are opening.
 */
export const LINKS = {
  dsa: {
    cpAlgorithms: (t: string, path: string): ResourceLink => ({
      kind: 'lecture',
      title: t,
      url: `https://cp-algorithms.com/${path}`,
      provider: 'cp-algorithms (e-maxx)',
      verified: true,
    }),
  },
  fullstack: {
    mdn: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://developer.mozilla.org/en-US/docs/${path}`,
      provider: 'MDN Web Docs',
      verified: true,
    }),
    react: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://react.dev/reference/${path}`,
      provider: 'react.dev',
      verified: true,
    }),
    tailwind: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://tailwindcss.com/docs/${path}`,
      provider: 'Tailwind CSS',
      verified: true,
    }),
    node: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://nodejs.org/docs/latest/api/${path}`,
      provider: 'Node.js',
      verified: true,
    }),
    express: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://expressjs.com/en/${path}`,
      provider: 'Express.js',
      verified: true,
    }),
    pg: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://www.postgresql.org/docs/current/${path}`,
      provider: 'PostgreSQL',
      verified: true,
    }),
    mongo: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://www.mongodb.com/docs/manual/${path}`,
      provider: 'MongoDB',
      verified: true,
    }),
    ts: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://www.typescriptlang.org/docs/handbook/${path}`,
      provider: 'TypeScript',
      verified: true,
    }),
  },
  aiml: {
    python: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://docs.python.org/3/${path}`,
      provider: 'Python.org',
      verified: true,
    }),
    pytorch: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://pytorch.org/docs/stable/${path}`,
      provider: 'PyTorch',
      verified: true,
    }),
    hf: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://huggingface.co/docs/${path}`,
      provider: 'Hugging Face',
      verified: true,
    }),
    openai: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://platform.openai.com/docs/${path}`,
      provider: 'OpenAI',
      verified: true,
    }),
  },
  cs: {
    net: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://datatracker.ietf.org/doc/html/${path}`,
      provider: 'IETF RFC',
      verified: true,
    }),
  },
  devops: {
    docker: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://docs.docker.com/${path}`,
      provider: 'Docker',
      verified: true,
    }),
    k8s: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://kubernetes.io/docs/${path}`,
      provider: 'Kubernetes',
      verified: true,
    }),
    gh: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://docs.github.com/en/actions/${path}`,
      provider: 'GitHub Actions',
      verified: true,
    }),
    git: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://git-scm.com/doc${path}`,
      provider: 'Git',
      verified: true,
    }),
  },
  security: {
    owasp: (t: string, path: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: `https://owasp.org/www-project-top-ten/${path}`,
      provider: 'OWASP',
      verified: true,
    }),
    jwt: (t: string): ResourceLink => ({
      kind: 'notes',
      title: t,
      url: 'https://jwt.io/introduction',
      provider: 'jwt.io',
      verified: true,
    }),
  },
} as const;

/** The small set of "coming soon" copy patterns so placeholders stay consistent. */
export const comingSoon = (what: string) =>
  `Curated ${what} for this chapter are being prepared. The slot is wired up — real content will appear here when added.`;

const PROVIDER_BY_HOST: Array<[RegExp, string]> = [
  [/cp-algorithms\.com$/, 'cp-algorithms (e-maxx)'],
  [/developer\.mozilla\.org$/, 'MDN Web Docs'],
  [/react\.dev$/, 'react.dev'],
  [/tailwindcss\.com$/, 'Tailwind CSS'],
  [/nodejs\.org$/, 'Node.js'],
  [/expressjs\.com$/, 'Express.js'],
  [/postgresql\.org$/, 'PostgreSQL'],
  [/mongodb\.com$/, 'MongoDB'],
  [/typescriptlang\.org$/, 'TypeScript'],
  [/docs\.python\.org$/, 'Python.org'],
  [/pytorch\.org$/, 'PyTorch'],
  [/huggingface\.co$/, 'Hugging Face'],
  [/platform\.openai\.com$/, 'OpenAI'],
  [/datatracker\.ietf\.org$/, 'IETF RFC'],
  [/docs\.docker\.com$/, 'Docker'],
  [/kubernetes\.io$/, 'Kubernetes'],
  [/docs\.github\.com$/, 'GitHub Actions'],
  [/git-scm\.com$/, 'Git'],
  [/owasp\.org$/, 'OWASP'],
  [/jwt\.io$/, 'jwt.io'],
];

/** Human-readable provider label derived from the link hostname. */
export const providerFromUrl = (url: string): string => {
  try {
    const host = new URL(url).host.replace(/^www\./, '');
    return PROVIDER_BY_HOST.find(([re]) => re.test(host))?.[1] ?? host;
  } catch {
    return 'external link';
  }
};

/** Build a verified slot from an explicit, curated URL. */
export const verifiedNotes = (title: string, url: string): ResourceSlot =>
  available({ kind: 'notes', title, url, provider: providerFromUrl(url), verified: true });

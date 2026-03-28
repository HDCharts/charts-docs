import { thanksData } from './data';

interface Brand {
  name: string;
  url: string;
  avatar: string;
  role: string;
}

interface ThanksItem {
  name: string;
  description: string;
  url: string;
  license?: string;
  avatar?: string;
}

interface ThanksSection {
  title: string;
  items: ThanksItem[];
}

interface ProjectThanks {
  name: string;
  url: string;
  description: string;
  sections: ThanksSection[];
}

interface ThanksData {
  brands: Brand[];
  projects: ProjectThanks[];
}

interface AvatarSource {
  url: string;
  avatar?: string;
}

const { brands, projects } = thanksData as ThanksData;

const DOMAIN_AVATAR_MAP: Record<string, string> = {
  'kotlinlang.org': 'JetBrains',
  'www.jetbrains.com': 'JetBrains',
  'ktor.io': 'ktorio',
  'insert-koin.io': 'InsertKoinIO',
  'gradle.org': 'gradle',
  'central.sonatype.com': 'sonatype',
  'eslint.org': 'eslint',
  'react.dev': 'facebook',
  'nextjs.org': 'vercel',
  'vercel.com': 'vercel',
  'www.typescriptlang.org': 'microsoft',
  'clarity.microsoft.com': 'microsoft',
  'developer.android.com': 'android',
  'foojay.io': 'foojayio',
  'junit.org': 'junit-team',
  'aws.amazon.com': 'aws',
  'rsms.me': 'rsms',
  'mdxjs.com': 'mdx-js',
};

function getItemAvatar(item: AvatarSource): string | undefined {
  if (item.avatar) return item.avatar;

  const ghMatch = item.url.match(/^https?:\/\/github\.com\/([^/]+)/i);
  if (ghMatch) {
    return `https://avatars.githubusercontent.com/${ghMatch[1]}?s=48`;
  }

  try {
    const host = new URL(item.url).hostname;
    const org = DOMAIN_AVATAR_MAP[host];
    if (org) {
      return `https://avatars.githubusercontent.com/${org}?s=48`;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function ThanksContent() {
  return (
    <>
      <h1 className="mb-4 [font-family:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">Built With</h1>
      <p className="mb-6 text-base text-[var(--text-secondary)]">
        Charts is built using a set of tools, frameworks, and services.
      </p>

      <div className="mb-6 grid grid-cols-3 gap-4 gap-x-6 sm:grid-cols-2 md:min-[601px]:grid-cols-2">
        {brands.map((brand) => (
          <a
            key={brand.name}
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 no-underline opacity-80 transition-opacity hover:opacity-100"
          >
            <img
              src={brand.avatar}
              alt={brand.name}
              className="h-8 w-8 shrink-0 rounded-md bg-[var(--bg-tertiary)] object-contain"
              loading="lazy"
              width={32}
              height={32}
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium text-[var(--text-primary)]">{brand.name}</span>
              <span className="text-xs text-[var(--text-secondary)]">{brand.role}</span>
            </span>
          </a>
        ))}
      </div>

      {projects.map((project) => {
        const projectAvatar = getItemAvatar({ url: project.url });

        return (
        <section key={project.name} className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
            {projectAvatar ? (
              <img
                src={projectAvatar}
                alt=""
                className="h-6 w-6 shrink-0 rounded-md bg-[var(--bg-tertiary)]"
                loading="lazy"
                width={24}
                height={24}
              />
            ) : null}
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]">
              {project.name}
            </a>
          </h2>
          <p className="mb-4 text-base text-[var(--text-secondary)]">{project.description}</p>

          {project.sections.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 mt-6 text-xl font-semibold text-[var(--text-primary)]">{section.title}</h3>
              <ul className="mb-4 list-none p-0 text-[var(--text-secondary)]">
                {section.items.map((item, index) => {
                  const avatar = getItemAvatar(item);

                  return (
                    <li key={`${item.name}-${index}`} className="mb-2 flex items-start gap-2">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                          className="mt-0.5 h-5 w-5 shrink-0 rounded-sm bg-[var(--bg-tertiary)] object-contain"
                          loading="lazy"
                          width={20}
                          height={20}
                        />
                      ) : null}

                      <span className="text-sm">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]"
                        >
                          {item.name}
                        </a>
                        {' — '}
                        {item.description}
                        {item.license ? (
                          <span className="ml-1 italic text-[var(--text-muted)]">
                            ({item.license})
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
        );
      })}

      <hr className="my-8 border-0 border-t border-[var(--border-color)]" />

      <p className="text-base text-[var(--text-secondary)]">
        If you notice a missing attribution or have questions about how a
        third-party project is used, please{' '}
        <a
          href="https://github.com/HDCharts/charts/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-[var(--link-color-hover)]"
        >
          open an issue
        </a>
        .
      </p>
    </>
  );
}

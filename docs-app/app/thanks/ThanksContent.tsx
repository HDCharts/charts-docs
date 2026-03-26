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
      <h1>Built With</h1>
      <p>
        Charts is built using a set of tools, frameworks, and services.
      </p>

      <div className="thanks__brands">
        {brands.map((brand) => (
          <a
            key={brand.name}
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="thanks__brand-link"
          >
            <img
              src={brand.avatar}
              alt={brand.name}
              className="thanks__brand-avatar"
              loading="lazy"
              width={32}
              height={32}
            />
            <span className="thanks__brand-text">
              <span className="thanks__brand-name">{brand.name}</span>
              <span className="thanks__brand-role">{brand.role}</span>
            </span>
          </a>
        ))}
      </div>

      {projects.map((project) => (
        <section key={project.name}>
          <h2 className="thanks__project-heading">
            <img
              src={getItemAvatar({ url: project.url })}
              alt=""
              className="thanks__project-avatar"
              loading="lazy"
              width={24}
              height={24}
            />
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              {project.name}
            </a>
          </h2>
          <p>{project.description}</p>

          {project.sections.map((section) => (
            <div key={section.title}>
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item, index) => {
                  const avatar = getItemAvatar(item);

                  return (
                    <li key={`${item.name}-${index}`} className="thanks__list-item">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                          className="thanks__item-avatar"
                          loading="lazy"
                          width={20}
                          height={20}
                        />
                      ) : null}

                      <span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.name}
                        </a>
                        {' — '}
                        {item.description}
                        {item.license ? (
                          <span className="thanks__license">
                            {' '}
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
      ))}

      <hr />

      <p>
        If you notice a missing attribution or have questions about how a
        third-party project is used, please{' '}
        <a
          href="https://github.com/HDCharts/charts/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          open an issue
        </a>
        .
      </p>
    </>
  );
}

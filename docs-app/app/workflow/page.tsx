import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { MarketingFooter, MarketingHeader } from '@/components';
import { getDefaultVersionId } from '@/lib/versions';

export const metadata: Metadata = {
  title: 'How HDCharts ships',
  description: 'Follow the development, testing, snapshot, and release workflow behind HDCharts.',
  openGraph: {
    title: 'How HDCharts ships',
    description: 'Follow the development, testing, snapshot, and release workflow behind HDCharts.',
    type: 'website',
  },
};

type WorkflowTone = 'neutral' | 'decision' | 'success' | 'optional' | 'warning' | 'failure';

interface WorkflowNodeProps {
  label: string;
  title: string;
  detail?: ReactNode;
  tone?: WorkflowTone;
}

function WorkflowNode({ label, title, detail, tone = 'neutral' }: WorkflowNodeProps) {
  return (
    <div className={`workflow-detail-node workflow-detail-node-${tone}`}>
      <span>{label}</span>
      <strong>{title}</strong>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}

interface WorkflowBranchProps {
  label: string;
  tone: WorkflowTone;
  children: ReactNode;
}

function WorkflowBranch({ label, tone, children }: WorkflowBranchProps) {
  return (
    <div className={`workflow-branch workflow-branch-${tone}`}>
      <span className="workflow-branch-label">{label}</span>
      <div className="workflow-branch-content">{children}</div>
    </div>
  );
}

interface WorkflowChartProps {
  id: string;
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}

function WorkflowChart({ id, number, title, description, children }: WorkflowChartProps) {
  return (
    <section className="workflow-detail-section" aria-labelledby={`${id}-title`}>
      <div className="workflow-detail-heading">
        <span className="workflow-detail-number">{number}</span>
        <div>
          <p className="marketing-eyebrow"><span /> Workflow chart</p>
          <h2 id={`${id}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="workflow-chart">{children}</div>
    </section>
  );
}

interface EcosystemCardProps {
  label: string;
  title: string;
  detail: string;
  href?: string;
  tone?: 'core' | 'support' | 'output';
}

function EcosystemCard({ label, title, detail, href, tone = 'support' }: EcosystemCardProps) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
      {href ? <b aria-hidden="true">↗</b> : null}
    </>
  );

  return href ? (
    <a className={`ecosystem-card ecosystem-card-${tone}`} href={href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    <div className={`ecosystem-card ecosystem-card-${tone}`}>{content}</div>
  );
}

const testMatrix = [
  {
    label: 'Assemble',
    title: 'Can the validation artifacts be built?',
    detail: 'JVM jars, the BOM, Android main sources, the Wasm distribution, and the smoke-line consumer.',
  },
  {
    label: 'Compile',
    title: 'Do all supported targets compile?',
    detail: 'Kotlin/JVM, Kotlin/Wasm, Android main sources, and the smoke-line consumer compile path.',
  },
  {
    label: 'Tests',
    title: 'Does behavior hold on each surface?',
    detail: 'JVM tests, Android emulator tests, Wasm browser tests, iOS simulator tests, and Android screenshot validation.',
  },
  {
    label: 'API',
    title: 'Did the public contract change?',
    detail: 'Binary and source compatibility are compared with the stored release baseline. Intentional breaks need the breaking-change label.',
  },
  {
    label: 'GIF',
    title: 'Do visual motion baselines still match?',
    detail: 'An opt-in Android emulator job records and compares GIF baselines. It stays outside the required core gate.',
  },
  {
    label: 'CodeQL',
    title: 'Is the code scanned regularly?',
    detail: 'A scheduled monthly scan covers Actions, Java/Kotlin, and JavaScript/TypeScript security analysis.',
  },
];

export default function WorkflowPage() {
  const defaultVersion = getDefaultVersionId();

  return (
    <div className="marketing-page workflow-page">
      <MarketingHeader versionId={defaultVersion} />

      <main>
        <section className="marketing-hero workflow-hero" aria-labelledby="workflow-title">
          <div className="marketing-hero-copy">
            <p className="marketing-eyebrow"><span /> Development · release · transparency</p>
            <h1 id="workflow-title">A clear path from change to chart.</h1>
            <p className="marketing-hero-lead">
              HDCharts moves from a focused pull request to a tested snapshot and a verified public release, with the important checkpoints kept visible.
            </p>
            <div className="marketing-actions">
              <Link href={`/${defaultVersion}/wiki/getting-started`} className="marketing-button marketing-button-primary">Start building</Link>
              <a href="https://github.com/HDCharts/charts/actions" target="_blank" rel="noopener noreferrer" className="marketing-button marketing-button-secondary">See the workflows <span aria-hidden="true">↗</span></a>
            </div>
          </div>

          <div className="workflow-hero-panel" aria-label="HDCharts release flow">
            <div className="workflow-panel-header">
              <span className="marketing-visual-status" />
              <span>release-flow</span>
              <span className="workflow-panel-state">release flow</span>
            </div>
            <div className="workflow-flow" aria-hidden="true">
              <div className="workflow-flow-node"><strong>PR</strong><span>change</span></div>
              <i />
              <div className="workflow-flow-node"><strong>CI</strong><span>check</span></div>
              <i />
              <div className="workflow-flow-node"><strong>SNAP</strong><span>publish</span></div>
              <i />
              <div className="workflow-flow-node workflow-flow-node-final"><strong>RELEASE</strong><span>public</span></div>
            </div>
            <p className="workflow-panel-note">A change moves through checks, snapshots, and public release.</p>
          </div>
        </section>

        <section className="marketing-section workflow-ecosystem-section" aria-label="HDCharts ecosystem">
          <div className="ecosystem-map">
            <EcosystemCard
              label="CORE LIBRARY"
              title="HDCharts · charts"
              detail="Kotlin Multiplatform library, demos, tests, and release orchestration."
              href="https://github.com/HDCharts/charts"
              tone="core"
            />
            <div className="ecosystem-arrow" aria-hidden="true">↓</div>
            <div className="ecosystem-card-grid">
              <EcosystemCard
                label="PUBLIC SITE"
                title="charts-docs"
                detail="Versioned wiki, API links, release notes, metadata, demos, and the docs application."
                href="https://github.com/HDCharts/charts-docs"
              />
              <EcosystemCard
                label="INTERACTIVE WEB"
                title="charts-playground"
                detail="A browser playground built with the Charts source and published with snapshot metadata."
                href="https://github.com/HDCharts/charts-playground"
              />
              <EcosystemCard
                label="VISUAL TOOLING"
                title="charts-gif-recorder"
                detail="A Gradle plugin used by Android documentation scenarios to record and validate animated baselines."
                href="https://github.com/HDCharts/charts-gif-recorder"
              />
            </div>
            <div className="ecosystem-arrow" aria-hidden="true">↓</div>
            <div className="ecosystem-output-grid">
              <EcosystemCard label="LIBRARY OUTPUT" title="Maven Central" detail="Stable and snapshot Kotlin Multiplatform modules and the BOM." href="https://central.sonatype.com/artifact/io.github.dautovicharis/charts" tone="output" />
              <EcosystemCard label="STATIC DELIVERY" title="S3 + CloudFront" detail="Versioned API references, demos, playground files, metadata, and Android APKs." href="https://aws.amazon.com/s3/" tone="output" />
              <EcosystemCard label="SITE DELIVERY" title="Vercel" detail="Builds and serves the Next.js documentation application from charts-docs." href="https://vercel.com/" tone="output" />
              <EcosystemCard label="AUTOMATION" title="GitHub Actions" detail="Coordinates pull requests, snapshots, releases, and security scans." href="https://github.com/HDCharts/charts/actions" tone="output" />
            </div>
          </div>

          <div className="ecosystem-foundation" aria-label="HDCharts technology foundation">
            <span>Foundation</span>
            <strong>Kotlin Multiplatform</strong>
            <strong>Compose Multiplatform</strong>
            <strong>Gradle + Axion</strong>
            <strong>Android · iOS · JVM · Wasm</strong>
          </div>
        </section>

        <WorkflowChart
          id="pull-request"
          number="01"
          title="Pull request validation"
          description="Every pull request first checks whether it needs the full validation path. Documentation-only changes keep their required checks without running expensive work."
        >
          <div className="workflow-chart-titlebar"><strong>Pull Request</strong><span>opened · synchronized · reopened</span></div>
          <div className="workflow-chart-stack">
            <WorkflowNode label="START" title="Prepare the PR" detail="Check out the revision, detect changed paths, and run workflow self-tests." />
            <div className="workflow-chart-arrow" aria-hidden="true">↓</div>
            <WorkflowNode label="DECISION" title="Code or build changes?" detail="Docs, release notes, GIF baselines, scripts, and Markdown are treated as lightweight paths." tone="decision" />
            <div className="workflow-branch-grid">
              <WorkflowBranch label="NO · documentation-only" tone="optional">
                <WorkflowNode label="SKIP EXPENSIVE WORK" title="Docs-only no-op" detail="Assemble, compile, lint, and tests report lightweight success without allocating their normal work." tone="optional" />
                <WorkflowNode label="CONTINUE" title="Required check remains visible" detail="The PR can still satisfy the expected check contract." tone="success" />
              </WorkflowBranch>
              <WorkflowBranch label="YES · code or build change" tone="success">
                <WorkflowNode label="PARALLEL CORE CHECKS" title="Assemble · compile · lint · test" detail="The four reusable checks run together as the core PR gate." />
                <WorkflowNode label="CONTINUE" title="PR Core Checks" detail="The final gate rejects any failed, cancelled, or skipped required result." tone="success" />
              </WorkflowBranch>
            </div>
            <div className="workflow-chart-callout workflow-chart-callout-failure">Any required core check failure stops the required PR gate.</div>
          </div>

          <div className="workflow-chart-subheading"><span>Alongside core checks</span><strong>Independent policy lanes</strong></div>
          <div className="workflow-lane-grid">
            <div className="workflow-lane">
              <WorkflowNode label="API POLICY" title="Check the public API" detail="The lane runs for code changes and breaking-change label events." tone="decision" />
              <div className="workflow-branch-grid">
                <WorkflowBranch label="NO" tone="optional">
                  <WorkflowNode label="SKIP" title="API compatibility not requested" tone="optional" />
                </WorkflowBranch>
                <WorkflowBranch label="YES · compatible" tone="success">
                  <WorkflowNode label="PASS" title="Public API is compatible" tone="success" />
                </WorkflowBranch>
              </div>
              <div className="workflow-branch-grid">
                <WorkflowBranch label="BREAK DETECTED + LABEL" tone="warning">
                  <WorkflowNode
                    label="ACKNOWLEDGED"
                    title="Document and acknowledge the break"
                    detail={<>Keep the breaking-change label when the API checker flags an intentional public API incompatibility, update release notes and affected docs, then review the API baseline PR created after merge. See the <a href="https://github.com/HDCharts/charts/tree/main/release-notes" target="_blank" rel="noopener noreferrer">release migration notes</a> for examples of the required call-site changes.</>}
                    tone="warning"
                  />
                </WorkflowBranch>
                <WorkflowBranch label="POLICY MISMATCH" tone="failure">
                  <WorkflowNode label="STOP" title="Fix the API policy mismatch" detail="Add the label for an intentional break, remove a stale label, or fix the compatibility task error before merging." tone="failure" />
                </WorkflowBranch>
              </div>
            </div>
            <div className="workflow-lane">
              <WorkflowNode label="OPTIONAL GIF WORKFLOW" title="run-gif-validation label present?" detail="Opened, updated, or label changes can request the visual validation job." tone="decision" />
              <div className="workflow-branch-grid">
                <WorkflowBranch label="NO" tone="optional">
                  <WorkflowNode label="SKIP" title="No GIF job requested" detail="This is informational and not a required branch-protection check." tone="optional" />
                </WorkflowBranch>
                <WorkflowBranch label="YES" tone="success">
                  <WorkflowNode label="ANDROID EMULATOR" title="Record and compare GIF baselines" detail={<>The job stays outside the required core gate, but its report and generated GIFs are uploaded for review. See the <Link href={`/${defaultVersion}/wiki/examples`}>chart examples</Link>.</>} tone="success" />
                  <div className="workflow-branch-grid">
                    <WorkflowBranch label="MATCH" tone="success">
                      <WorkflowNode label="PASS" title="GIF baseline matches" tone="success" />
                    </WorkflowBranch>
                    <WorkflowBranch label="MISMATCH" tone="warning">
                      <WorkflowNode label="REVIEW" title="Fix the visual change or update the baseline" detail={<>Download the validation artifacts. Fix unintended output; for an intentional change, update the matching file in <a href="https://github.com/HDCharts/charts/tree/main/gif-baselines" target="_blank" rel="noopener noreferrer">gif-baselines/</a> and rerun validation.</>} tone="warning" />
                    </WorkflowBranch>
                  </div>
                </WorkflowBranch>
              </div>
            </div>
          </div>
        </WorkflowChart>

        <section className="marketing-section workflow-matrix-section" aria-labelledby="matrix-title">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow"><span /> What gets tested</p>
            <h2 id="matrix-title">The checks have distinct jobs.</h2>
            <p>CI does not treat every validation as the same kind of signal. Each lane protects a different part of the library and its release contract.</p>
          </div>
          <div className="workflow-test-matrix">
            {testMatrix.map((item) => (
              <article className="workflow-test-card" key={item.label}>
                <span>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <WorkflowChart
          id="snapshot"
          number="02"
          title="Snapshot publishing"
          description="Snapshots keep the latest development build available. Scheduled runs publish only when relevant changes are present."
        >
          <div className="workflow-chart-titlebar"><strong>Snapshot workflow</strong><span>scheduled every day</span></div>
          <div className="workflow-chart-stack">
            <WorkflowNode label="DECISION" title="Relevant changes in the last 24 hours?" detail="Docs and Markdown-only changes are ignored, while release notes remain relevant." tone="decision" />
            <div className="workflow-branch-grid">
              <WorkflowBranch label="NO · scheduled run" tone="optional">
                <WorkflowNode label="STOP CLEANLY" title="No snapshot published" detail="No recent changes, or only ignored paths, ends the run without publishing." tone="optional" />
              </WorkflowBranch>
              <WorkflowBranch label="YES · or manual run" tone="success">
                <WorkflowNode label="CONTINUE" title="Prepare the snapshot" detail="Axion resolves the version. If the current version is not a snapshot, publication ends here." tone="success" />
              </WorkflowBranch>
            </div>
            <div className="workflow-chart-arrow" aria-hidden="true">↓</div>
            <WorkflowNode label="SOURCE + DOCS" title="Sync snapshot context" detail="Mirror release notes and GIF baselines into charts-docs, write snapshot-manifest.json, and push only when content changed." />
            <div className="workflow-chart-arrow" aria-hidden="true">↓</div>
            <WorkflowNode label="STATIC ASSETS" title="Publish snapshot API, demo, playground, and metadata" detail="The static assets are published for the development version." />
            <div className="workflow-chart-arrow" aria-hidden="true">↓</div>
            <WorkflowNode label="MAVEN" title="Publish the snapshot modules" detail="Signed snapshot artifacts are published to the Maven snapshot repository." />
            <div className="workflow-branch-grid">
              <WorkflowBranch label="PARALLEL FOLLOW-UP" tone="success">
                <WorkflowNode label="ANDROID" title="Build and upload Android snapshot" detail="Assemble the release APK against the published snapshot dependency and upload it to the docs static storage." tone="success" />
              </WorkflowBranch>
              <WorkflowBranch label="PARALLEL FOLLOW-UP" tone="success">
                <WorkflowNode label="ANNOUNCE" title="Update rolling GitHub prerelease" detail="Publish release-note highlights and comment with documentation and Maven links." tone="success" />
              </WorkflowBranch>
            </div>
          </div>
        </WorkflowChart>

        <WorkflowChart
          id="release"
          number="03"
          title="Stable release"
          description="A stable release is a manual, approval-gated promotion of a tested snapshot. It validates the code, artifacts, and documentation before publishing."
        >
          <div className="workflow-chart-titlebar"><strong>Release</strong><span>manual dispatch</span></div>
          <div className="workflow-chart-stack">
            <WorkflowNode label="PREPARE" title="Resolve and validate the release" detail="Axion resolves the SemVer and release readiness is checked before publishing." tone="success" />
            <div className="workflow-chart-arrow" aria-hidden="true">↓</div>
            <div className="workflow-branch-grid workflow-branch-grid-three">
              <WorkflowBranch label="VERSION / TAG" tone="failure">
                <WorkflowNode label="STOP" title="Version or tag validation fails" detail="An invalid version or an existing release tag blocks the flow." tone="failure" />
              </WorkflowBranch>
              <WorkflowBranch label="API AUDIT" tone="warning">
                <WorkflowNode label="CONTINUE" title="Compatible or acknowledged API change" detail="No previous release skips the audit. An intentional break continues with a warning." tone="warning" />
              </WorkflowBranch>
              <WorkflowBranch label="API AUDIT" tone="failure">
                <WorkflowNode label="STOP" title="Unexpected API audit failure" detail="A non-compatibility failure, or an unlabelled incompatible API, blocks release." tone="failure" />
              </WorkflowBranch>
            </div>
            <div className="workflow-chart-arrow" aria-hidden="true">↓</div>
            <WorkflowNode label="VERSION CHECK" title="Are the snapshot and release metadata aligned?" detail="Existing docs entries and the snapshot metadata must agree with the release version before promotion." tone="decision" />
            <div className="workflow-branch-grid">
              <WorkflowBranch label="NO" tone="failure">
                <WorkflowNode label="STOP" title="Missing or mismatched release metadata" detail="The release cannot promote unrelated or stale documentation." tone="failure" />
              </WorkflowBranch>
              <WorkflowBranch label="YES" tone="success">
                <WorkflowNode label="READY" title="Request production approval" detail="The release source and snapshot are now aligned." tone="success" />
              </WorkflowBranch>
            </div>
            <div className="workflow-chart-arrow" aria-hidden="true">↓</div>
            <WorkflowNode label="GATE" title="Release Approval environment" detail="Publishing does not begin until the protected production approval completes." tone="decision" />
            <div className="workflow-branch-grid">
              <WorkflowBranch label="NOT APPROVED" tone="optional">
                <WorkflowNode label="WAIT / STOP" title="No production publication" detail="The flow cannot reach publishing without approval." tone="optional" />
              </WorkflowBranch>
              <WorkflowBranch label="APPROVED" tone="success">
                <WorkflowNode label="PUBLISH" title="Publish versioned static assets" detail="API reference and demo assets are published and claimed with release metadata." tone="success" />
              </WorkflowBranch>
            </div>
            <div className="workflow-chart-arrow" aria-hidden="true">↓</div>
            <WorkflowNode label="MAVEN" title="Validate assets, tag, and publish modules" detail="The published docs assets are verified before Maven credentials and signing are used. Axion creates and pushes the release tag." />
            <div className="workflow-chart-arrow" aria-hidden="true">↓</div>
            <div className="workflow-branch-grid">
              <WorkflowBranch label="DEPENDENT RELEASE WORK" tone="success">
                <WorkflowNode label="ANDROID" title="Build and upload Android release APK" detail="The Android build consumes the newly published stable Maven version." tone="success" />
              </WorkflowBranch>
              <WorkflowBranch label="DEPENDENT RELEASE WORK" tone="success">
                <WorkflowNode label="DOCS" title="Promote release notes and docs" detail="charts-docs receives the release content, registry entry, and version metadata." tone="success" />
              </WorkflowBranch>
            </div>
            <div className="workflow-chart-arrow" aria-hidden="true">↓</div>
            <WorkflowNode label="PUBLIC VERIFY" title="Do the manifest and public routes respond correctly?" detail="The workflow waits for deployment and checks the manifest, versioned wiki, API reference, and demo route." tone="decision" />
            <div className="workflow-branch-grid">
              <WorkflowBranch label="NO · timeout or mismatch" tone="failure">
                <WorkflowNode label="STOP" title="Release is not announced" detail="The workflow retries for up to 20 minutes, then fails without closing the release loop." tone="failure" />
              </WorkflowBranch>
              <WorkflowBranch label="YES" tone="success">
                <WorkflowNode label="FINISH" title="Publish the GitHub release" detail="Release-note highlights are published and the commit receives documentation and Maven links." tone="success" />
              </WorkflowBranch>
            </div>
          </div>
        </WorkflowChart>

        <section className="marketing-section workflow-principles" aria-labelledby="principles-title">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow"><span /> What stays true</p>
            <h2 id="principles-title">Clear checks. Predictable releases.</h2>
            <p>Each step has a clear purpose and outcome, from the first pull request check to the published release.</p>
          </div>

          <div className="marketing-feature-grid">
            <article className="marketing-feature-card workflow-principle-card">
              <span className="marketing-feature-number">A</span>
              <h3>Versions stay aligned</h3>
              <p>Snapshots, documentation, demos, and stable releases use matching version metadata as they move through the ecosystem.</p>
            </article>
            <article className="marketing-feature-card workflow-principle-card">
              <span className="marketing-feature-number">B</span>
              <h3>Docs travel with versions</h3>
              <p>Release notes, API references, demos, and playground assets are promoted alongside the library version they describe.</p>
            </article>
            <article className="marketing-feature-card workflow-principle-card">
              <span className="marketing-feature-number">C</span>
              <h3>Checks stay purposeful</h3>
              <p>Expensive validation runs for meaningful code changes, while optional visual checks remain available without becoming noise.</p>
            </article>
          </div>
        </section>

        <section className="marketing-cta-section" aria-labelledby="workflow-cta-title">
          <div>
            <p className="marketing-eyebrow"><span /> Keep exploring</p>
            <h2 id="workflow-cta-title">See the process in the repository.</h2>
          </div>
          <div className="marketing-actions">
            <a href="https://github.com/HDCharts/charts/actions" target="_blank" rel="noopener noreferrer" className="marketing-button marketing-button-primary">Open GitHub Actions <span aria-hidden="true">↗</span></a>
            <Link href={`/${defaultVersion}/metadata`} className="marketing-button marketing-button-secondary">View build metadata</Link>
          </div>
        </section>
      </main>

      <MarketingFooter versionId={defaultVersion} />
    </div>
  );
}

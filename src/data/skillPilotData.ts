export type GoalId = 'fullstack' | 'datascientist';

export type ModuleStatus =
  | 'completed'
  | 'in_progress'
  | 'unlocked'
  | 'locked'
  | 'revision'
  | 'paused';

export type AgentId = 'profile' | 'diagnosis' | 'planning' | 'evaluator' | 'tutor';

export interface SkillDefinition {
  id: string;
  name: string;
  category: 'Frontend' | 'Backend' | 'Data & AI' | 'DevOps' | 'Core CS';
  prerequisites: string[];
  requiredFor: GoalId[];
  whyMatters: string;
}

export interface RoadmapModule {
  id: string;
  title: string;
  durationWeeks: number;
  status: ModuleStatus;
  skillsCovered: string[];
  reason?: string;
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface AgentLogEntry {
  id: string;
  from: AgentId;
  to: AgentId;
  action: string;
  detail: string;
  timestamp: string;
}

export interface CareerGoal {
  id: GoalId;
  title: string;
  subtitle: string;
}

export const CAREER_GOALS: Record<GoalId, CareerGoal> = {
  fullstack: {
    id: 'fullstack',
    title: 'Full-Stack Engineer',
    subtitle: 'Modern web apps, APIs, testing, and cloud delivery',
  },
  datascientist: {
    id: 'datascientist',
    title: 'Data Scientist',
    subtitle: 'Statistical modeling, Python pipelines, and ML evaluation',
  },
};

const RAW_SKILLS: Array<[string, SkillDefinition['category'], string[], GoalId[], string]> = [
  ['html', 'Frontend', [], ['fullstack'], 'Semantic document structure and accessible DOM foundation.'],
  ['css', 'Frontend', ['html'], ['fullstack'], 'Responsive layouts, typography, and accessible color contrast.'],
  ['javascript', 'Frontend', ['html'], ['fullstack'], 'Core browser runtime, async patterns, and interactive logic.'],
  ['typescript', 'Frontend', ['javascript'], ['fullstack'], 'Static type safety across UI, API contracts, and state.'],
  ['react', 'Frontend', ['javascript', 'html'], ['fullstack'], 'Declarative component architecture and state synchronization.'],
  ['nextjs', 'Frontend', ['react', 'typescript'], ['fullstack'], 'Full-stack React routing, server rendering, and bundling.'],
  ['tailwind', 'Frontend', ['css'], ['fullstack'], 'Design-token utility styling for consistent interfaces.'],
  ['accessibility', 'Frontend', ['html', 'css'], ['fullstack'], 'WCAG 2.1 AA keyboard navigation and screen-reader support.'],
  ['state-mgmt', 'Frontend', ['react'], ['fullstack'], 'Predictable client stores for complex multi-view workflows.'],
  ['webgl', 'Frontend', ['javascript'], [], 'Hardware-accelerated 3D rendering for spatial visualizations.'],
  ['nodejs', 'Backend', ['javascript'], ['fullstack'], 'Server-side JavaScript runtime for scalable APIs and services.'],
  ['python', 'Data & AI', [], ['datascientist'], 'Versatile language for backend automation, analytics, and ML.'],
  ['sql', 'Data & AI', [], ['fullstack', 'datascientist'], 'Relational querying, indexing, and analytical aggregations.'],
  ['git', 'Core CS', [], ['fullstack', 'datascientist'], 'Version control branching, code review, and release history.'],
  ['docker', 'DevOps', ['linux'], ['fullstack', 'datascientist'], 'Reproducible containerized environments across dev and prod.'],
  ['rest-apis', 'Backend', ['nodejs'], ['fullstack'], 'Resource-oriented HTTP endpoints with validation and auth.'],
  ['graphql', 'Backend', ['rest-apis'], [], 'Strongly typed schema queries for flexible client fetching.'],
  ['unit-testing', 'Core CS', ['javascript'], ['fullstack', 'datascientist'], 'Automated verification catching regressions before deployment.'],
  ['cicd', 'DevOps', ['git', 'unit-testing'], ['fullstack'], 'Automated build, lint, test, and deployment pipelines.'],
  ['postgresql', 'Backend', ['sql'], ['fullstack', 'datascientist'], 'ACID-compliant relational storage with JSONB and indexes.'],
  ['redis', 'Backend', ['nodejs'], [], 'In-memory caching, rate limiting, and session coordination.'],
  ['linux', 'DevOps', [], ['fullstack'], 'Shell tooling, process management, and container diagnostics.'],
  ['cloud-basics', 'DevOps', ['docker'], ['fullstack'], 'Managed compute, storage, IAM, and observability basics.'],
  ['data-structures', 'Core CS', [], ['fullstack', 'datascientist'], 'Trees, graphs, hash maps, and complexity trade-offs.'],
  ['algorithms', 'Core CS', ['data-structures'], ['fullstack', 'datascientist'], 'Graph traversal, sorting, and dynamic problem solving.'],
  ['system-design', 'Core CS', ['rest-apis', 'postgresql'], ['fullstack'], 'Scalable architectures, caching, and fault tolerance.'],
  ['security', 'Core CS', ['rest-apis'], ['fullstack'], 'Input sanitization, CSP, least privilege, and auth hygiene.'],
  ['oauth2', 'Backend', ['security'], ['fullstack'], 'Delegated authentication flows and token verification.'],
  ['websockets', 'Backend', ['nodejs'], [], 'Bidirectional real-time event streaming and collaboration.'],
  ['performance', 'Frontend', ['react'], ['fullstack'], 'Code splitting, memoization, and Core Web Vitals tuning.'],
  ['pandas', 'Data & AI', ['python'], ['datascientist'], 'Tabular data wrangling, cleaning, and feature transforms.'],
  ['numpy', 'Data & AI', ['python'], ['datascientist'], 'Vectorized numerical arrays and matrix computation.'],
  ['scikit-learn', 'Data & AI', ['pandas', 'statistics'], ['datascientist'], 'Classical ML pipelines, cross-validation, and baselines.'],
  ['pytorch', 'Data & AI', ['numpy', 'linear-algebra'], ['datascientist'], 'Deep learning tensors, autograd, and custom neural models.'],
  ['statistics', 'Data & AI', [], ['datascientist'], 'Probability distributions, hypothesis tests, and confidence intervals.'],
  ['linear-algebra', 'Data & AI', [], ['datascientist'], 'Vectors, eigenvalues, and embeddings underpinning ML.'],
  ['data-viz', 'Data & AI', ['pandas'], ['datascientist'], 'Clear charts and visual diagnostics for stakeholders.'],
  ['spark', 'Data & AI', ['python', 'sql'], [], 'Distributed batch and streaming data transformations.'],
  ['airflow', 'Data & AI', ['python'], [], 'Scheduled DAG orchestration for reliable data pipelines.'],
  ['mlops', 'Data & AI', ['docker', 'scikit-learn'], ['datascientist'], 'Model versioning, drift monitoring, and inference serving.'],
  ['fastapi', 'Backend', ['python'], ['datascientist'], 'High-throughput typed Python APIs for ML inference.'],
  ['kubernetes', 'DevOps', ['docker'], [], 'Container orchestration, autoscaling, and rolling updates.'],
  ['terraform', 'DevOps', ['cloud-basics'], [], 'Declarative infrastructure-as-code provisioning.'],
  ['observability', 'DevOps', ['cloud-basics'], [], 'Structured logs, traces, and SLO alerting.'],
  ['sql-tuning', 'Backend', ['sql', 'postgresql'], [], 'Query execution plans and composite index optimization.'],
  ['nosql', 'Backend', ['rest-apis'], [], 'Document and key-value modeling for flexible schemas.'],
  ['microservices', 'Backend', ['docker', 'rest-apis'], [], 'Bounded service contracts and resilient communication.'],
  ['queues', 'Backend', ['nodejs'], [], 'Asynchronous job processing and dead-letter recovery.'],
  ['serverless', 'DevOps', ['cloud-basics'], [], 'Event-driven functions with automatic scale-to-zero.'],
  ['prompt-eng', 'Data & AI', ['python'], [], 'Structured prompting, rubrics, and deterministic outputs.'],
  ['rag', 'Data & AI', ['python', 'vector-dbs'], ['datascientist'], 'Retrieval-augmented grounding over domain corpora.'],
  ['vector-dbs', 'Data & AI', ['linear-algebra'], ['datascientist'], 'Approximate nearest-neighbor semantic similarity search.'],
  ['ml-eval', 'Data & AI', ['statistics', 'scikit-learn'], ['datascientist'], 'Precision, recall, calibration, and slice error analysis.'],
  ['feature-eng', 'Data & AI', ['pandas', 'statistics'], ['datascientist'], 'Domain-informed signal extraction from raw events.'],
  ['ab-testing', 'Data & AI', ['statistics'], ['datascientist'], 'Controlled experiment sizing and causal lift analysis.'],
  ['time-series', 'Data & AI', ['statistics', 'pandas'], [], 'Seasonality decomposition and forecasting models.'],
  ['nlp', 'Data & AI', ['pytorch'], [], 'Tokenization, embeddings, and sequence classification.'],
  ['vision', 'Data & AI', ['pytorch'], [], 'Convolutional and transformer representations for imagery.'],
  ['ai-ethics', 'Data & AI', ['ml-eval'], ['datascientist'], 'Fairness auditing, privacy safeguards, and transparency.'],
  ['tech-writing', 'Core CS', ['git'], ['fullstack', 'datascientist'], 'Clear ADRs, API docs, and runnable onboarding guides.'],
];

const DISPLAY_NAMES: Record<string, string> = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  react: 'React',
  nextjs: 'Next.js',
  tailwind: 'Tailwind CSS',
  accessibility: 'Accessibility',
  'state-mgmt': 'State Mgmt',
  webgl: 'WebGL',
  nodejs: 'Node.js',
  python: 'Python',
  sql: 'SQL',
  git: 'Git',
  docker: 'Docker',
  'rest-apis': 'REST APIs',
  graphql: 'GraphQL',
  'unit-testing': 'Unit Testing',
  cicd: 'CI/CD',
  postgresql: 'PostgreSQL',
  redis: 'Redis',
  linux: 'Linux',
  'cloud-basics': 'Cloud Basics',
  'data-structures': 'Data Structures',
  algorithms: 'Algorithms',
  'system-design': 'System Design',
  security: 'Security',
  oauth2: 'OAuth 2.0',
  websockets: 'WebSockets',
  performance: 'Performance',
  pandas: 'Pandas',
  numpy: 'NumPy',
  'scikit-learn': 'Scikit-learn',
  pytorch: 'PyTorch',
  statistics: 'Statistics',
  'linear-algebra': 'Linear Algebra',
  'data-viz': 'Data Viz',
  spark: 'Apache Spark',
  airflow: 'Airflow',
  mlops: 'MLOps',
  fastapi: 'FastAPI',
  kubernetes: 'Kubernetes',
  terraform: 'Terraform',
  observability: 'Observability',
  'sql-tuning': 'SQL Tuning',
  nosql: 'NoSQL',
  microservices: 'Microservices',
  queues: 'Message Queues',
  serverless: 'Serverless',
  'prompt-eng': 'Prompt Eng',
  rag: 'RAG Systems',
  'vector-dbs': 'Vector DBs',
  'ml-eval': 'Model Eval',
  'feature-eng': 'Feature Eng',
  'ab-testing': 'A/B Testing',
  'time-series': 'Time Series',
  nlp: 'NLP',
  vision: 'Computer Vision',
  'ai-ethics': 'AI Ethics',
  'tech-writing': 'Tech Writing',
};

export const SKILLS_CATALOG: SkillDefinition[] = RAW_SKILLS.map(
  ([id, category, prerequisites, requiredFor, whyMatters]) => ({
    id,
    name: DISPLAY_NAMES[id] ?? id,
    category,
    prerequisites,
    requiredFor,
    whyMatters,
  }),
);

export const DEMO_STUDENT_SKILL_LEVELS: Record<string, number> = {
  html: 4,
  css: 3,
  python: 3,
  sql: 3,
  git: 3,
  linux: 2,
  'data-structures': 2,
  postgresql: 2,
  'tech-writing': 3,
  javascript: 1,
  typescript: 1,
  react: 0,
  nodejs: 1,
  'rest-apis': 1,
  'unit-testing': 1,
  statistics: 1,
  pandas: 2,
  numpy: 2,
  'scikit-learn': 1,
  pytorch: 0,
};

export const DEFAULT_USER_SKILL_LEVELS: Record<string, number> = {
  html: 3,
  css: 2,
  python: 2,
  sql: 2,
  git: 2,
  javascript: 1,
  react: 0,
  nodejs: 0,
};

export const INITIAL_ROADMAP_MODULES: RoadmapModule[] = [
  {
    id: 'mod-web-foundations',
    title: 'Web Foundations',
    durationWeeks: 2,
    status: 'completed',
    skillsCovered: ['HTML', 'CSS', 'Accessibility'],
  },
  {
    id: 'mod-python-sql',
    title: 'Python & SQL Querying',
    durationWeeks: 2,
    status: 'completed',
    skillsCovered: ['Python', 'SQL', 'PostgreSQL'],
  },
  {
    id: 'mod-js-ts',
    title: 'Modern JavaScript & TypeScript',
    durationWeeks: 3,
    status: 'in_progress',
    skillsCovered: ['JavaScript', 'TypeScript'],
  },
  {
    id: 'mod-react',
    title: 'React Component Architecture',
    durationWeeks: 3,
    status: 'unlocked',
    skillsCovered: ['React', 'State Mgmt'],
  },
  {
    id: 'mod-node-api',
    title: 'Node.js & API Engineering',
    durationWeeks: 3,
    status: 'locked',
    skillsCovered: ['Node.js', 'REST APIs', 'Security'],
  },
  {
    id: 'mod-cloud',
    title: 'Cloud Deployment & Scaling',
    durationWeeks: 2,
    status: 'locked',
    skillsCovered: ['Docker', 'CI/CD', 'Cloud Basics'],
  },
];

export const INITIAL_EVALUATION_CRITERIA: EvaluationCriterion[] = [
  { id: 'correctness', name: 'Correctness', score: 22, maxScore: 25, feedback: 'Edge cases handled cleanly.' },
  { id: 'quality', name: 'Code Quality', score: 21, maxScore: 25, feedback: 'Modular functions with clear naming.' },
  { id: 'architecture', name: 'Architecture', score: 19, maxScore: 25, feedback: 'Good separation of concerns.' },
  { id: 'testing', name: 'Testing', score: 18, maxScore: 25, feedback: 'Needs stronger unit assertions.' },
  { id: 'security', name: 'Security', score: 20, maxScore: 25, feedback: 'Inputs validated with schema checks.' },
  { id: 'performance', name: 'Performance', score: 19, maxScore: 25, feedback: 'Low allocation overhead.' },
  { id: 'docs', name: 'Documentation', score: 21, maxScore: 25, feedback: 'Clear JSDoc and setup steps.' },
];

export const INITIAL_AGENT_LOGS: AgentLogEntry[] = [
  {
    id: 'log-1',
    from: 'profile',
    to: 'diagnosis',
    action: 'Synced learner skill profile',
    detail: 'Python (Lvl 3), SQL (Lvl 3), HTML (Lvl 4) verified; JS/React gaps flagged.',
    timestamp: '09:14:02',
  },
  {
    id: 'log-2',
    from: 'diagnosis',
    to: 'planning',
    action: 'Computed prerequisite graph',
    detail: 'Ordered Modern JS & TypeScript ahead of React Component Architecture.',
    timestamp: '09:14:15',
  },
  {
    id: 'log-3',
    from: 'planning',
    to: 'tutor',
    action: 'Prepared weekly study sprint',
    detail: 'Assigned 3 interactive coding drills for JavaScript closures and types.',
    timestamp: '09:14:29',
  },
];

export const AGENT_METADATA: Record<AgentId, { label: string; role: string }> = {
  profile: { label: 'Profile', role: 'Tracks verified competencies & target career role' },
  diagnosis: { label: 'Diagnosis', role: 'Identifies prerequisite gaps & mastery levels' },
  planning: { label: 'Planning', role: 'Sequences & adapts the learning roadmap' },
  evaluator: { label: 'Evaluator', role: 'Scores code submissions across 7 rubric criteria' },
  tutor: { label: 'Tutor', role: 'Generates targeted remediation & guided feedback' },
};

/**
 * Computes target career match percentage based on required skills and current levels.
 */
export function computeGoalMatchPercent(
  goalId: GoalId,
  skillLevels: Record<string, number>,
): number {
  const required = SKILLS_CATALOG.filter((s) => s.requiredFor.includes(goalId));
  if (required.length === 0) return 0;
  const maxPoints = required.length * 4;
  const earnedPoints = required.reduce(
    (sum, s) => sum + Math.min(4, Math.max(0, skillLevels[s.id] ?? 0)),
    0,
  );
  return Math.round((earnedPoints / maxPoints) * 100);
}

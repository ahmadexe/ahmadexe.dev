export const identity = {
  handle: "ahmadexe",
  fullName: "Muhammad Ahmad",
  role: "Software Engineer",
  location: "Islamabad, PK",
  tagline: "I build things that feel thoughtful and sharp.",
  bio: `I'm Muhammad Ahmad. Ahmadexe online. A software engineer who spends most of his time either building things or thinking about how to build them better. Frameworks, side projects, half-baked ideas that eventually grow up and ship. I came out of a computer science degree, though I was never the follow-the-syllabus type. What I keep coming back to is the same instinct: good software is equal parts logic and soul.`,
  socials: {
    github: "https://github.com/ahmadexe",
    medium: "https://medium.com/@ahmadexe",
    linkedin: "https://www.linkedin.com/in/ahmadexe/",
    email: "muahmad710@gmail.com",
  },
};

export type Project = {
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  links: { label: string; url: string }[];
  accent: "matrix" | "cyan" | "magenta";
};

export const projects: Project[] = [
  {
    name: "Agenix",
    tagline: "A Dart framework for multi-agent orchestration, past the toy stage.",
    description:
      "Now at v4.1.2. Agenix speaks to eight LLM providers — Gemini, OpenAI, Anthropic, Groq, xAI (Grok), Cohere, Mistral, DeepSeek — behind a single adapter, so swapping a model is a config change instead of a rewrite. The orchestration layer is what turned it into a framework rather than a wrapper: chains cap out at kMaxChainDepth (5) so runaway plans terminate, cycle detection throws a ConfigException the moment an agent tries to re-enter its own chain, and duplicate tool calls inside a single turn are refused before the LLM burns tokens rediscovering the same answer. FailureMode lets a caller pick between typed exceptions and a graceful AgentMessage — the same graph can be strict in tests and forgiving in a UI. Long conversations use a rolling memoryLimit (default 10 turns) so context windows stay bounded without dropping history entirely, and AgentScope with RegistrationPolicy keeps agent namespaces isolated when more than one graph shares a process. A companion agenix_firebase package handles persistent memory when an agent needs to remember across sessions, kept out of the core so non-Firebase apps don't drag it in. Open-source, and something I still tend to on my own time.",
    tags: [
      "Flutter",
      "Dart",
      "LLM",
      "Multi-Agent",
      "Orchestration",
      "Open Source",
    ],
    accent: "matrix",
    links: [
      { label: "GitHub", url: "https://github.com/ahmadexe/agenix" },
      { label: "pub.dev", url: "https://pub.dev/packages/agenix" },
    ],
  },
  {
    name: "PRISM",
    tagline: "A social network that gives users their data back.",
    description:
      "The current social landscape treats personal data like a commodity. Users don't own it, don't see how it moves, and don't share in the value it creates. PRISM tries a different arrangement. Built on blockchain, user data is stored securely, tamper-proof, and fully user-owned. No third party can access or monetize it without traceable consent. Paired with AI, it personalizes what you see without needing to surveil you to do it. A quiet attempt at rebuilding trust in a place that spent years earning distrust.",
    tags: [
      "Blockchain",
      "AI",
      "Mobile",
      "Privacy",
      "Go",
      "Gin",
      "Python",
      "Redis",
      "Kafka",
      "MongoDB",
      "Firebase",
      "AWS",
      "GCP",
    ],
    accent: "cyan",
    links: [
      {
        label: "Mobile",
        url: "https://github.com/ahmadexe/PRISM-Mobile-App",
      },
      {
        label: "Backend",
        url: "https://github.com/ahmadexe/PRISM-Backend",
      },
    ],
  },
  {
    name: "PRISM Chain",
    tagline: "A gasless chain for high-volume social data.",
    description:
      "A novel gasless blockchain architecture, taking cues from both Bitcoin and Ethereum. Bitcoin lends the decentralization and security posture, Ethereum informs the smart-contract flexibility. Where things diverge is the fee model: PRISM eliminates transaction costs for end users, which is what makes it viable for capturing high-volume social engagement data (likes, shares, comments, behavioral signals) without asking users to pay for their own presence. The chain sits beneath PRISM the app, but it can stand on its own.",
    tags: ["Blockchain", "Systems", "L1", "Consensus", "Go", "Gin"],
    accent: "magenta",
    links: [
      {
        label: "GitHub",
        url: "https://github.com/ahmadexe/prism-chain",
      },
    ],
  },
  {
    name: "ALNO AI",
    tagline: "A pocket studio for agents, public and private.",
    description:
      "A mobile app that lets anyone build AI agents the way they'd write a note. You spin up an agent, give it a persona, wire it to tools, and decide whether it's yours alone or something the world can meet. The public ones live in a shared space where people discover, remix, and follow the agents they trust. The private ones stay tucked away, doing the quieter work: journals, tutors, second brains. The whole idea was to move agent-building out of the terminal and into a place that feels closer to social software than infrastructure.",
    tags: ["Flutter", "AI", "Mobile", "Agents", "Go", "Gin"],
    accent: "cyan",
    links: [],
  },
  {
    name: "Bloom Booking",
    tagline: "The bridge between events and the people who make them.",
    description:
      "A booking platform sitting between two sides of the same industry that rarely speak the same language. On one side, planners hunting for talent, vendors, and venues. On the other, the artists, caterers, hosts, and spaces that make an event feel like one. Bloom Booking is the negotiation table: search, discovery, availability, contracts, and payments in one place, so nobody has to spend three weeks on WhatsApp to book a wedding. Built at Hareseca where I sat between architecture and system design.",
    tags: ["Flutter", "Backend", "Marketplace", "Systems", "Go", "Gin"],
    accent: "magenta",
    links: [],
  },
];

export type Award = {
  title: string;
  place: string;
  description: string;
  year: string;
};

export const awards: Award[] = [
  {
    title: "1st Prize, Global Finals ICT Innovation Competition",
    place: "Shenzhen, China",
    year: "2025",
    description:
      "Alongside my team, we took first prize at the 2025 ICT Innovation Global Finals. We presented PRISM and talked through Agenix, which put us among the first few people working on agentic social media applications.",
  },
  {
    title: "1st Prize, Regional Finals ICT Innovation Competition",
    place: "Riyadh, Saudi Arabia",
    year: "2025",
    description:
      "First prize at the 2025 ICT Innovation Regional Finals. We presented PRISM with a focus on the system design and software architecture underneath it.",
  },
  {
    title: "Seeds for the Future 2024",
    place: "Tashkent, Uzbekistan",
    year: "2024",
    description:
      "I had the privilege of representing Pakistan at Huawei's Seeds for the Future 2024 program. Our project was a women's healthcare application.",
  },
  {
    title: "Winner, Visio Spark Software Project Competition",
    place: "",
    year: "2024",
    description:
      "My team took home the 2024 Visio Spark Software Project Competition. We presented PRISM and PRISM Chain.",
  },
  {
    title: "1st Runner Up, Softec Mobile App Dev",
    place: "Lahore",
    year: "2024",
    description:
      "Softec 2024, held in Lahore, was one of the more memorable events of the year. I placed 1st Runner Up in the Mobile App Development track.",
  },
];

export type Experience = {
  company: string;
  role: string;
  period: string;
  description: string;
  current?: boolean;
};

export const experiences: Experience[] = [
  {
    company: "Tensor Labs",
    role: "Software Engineer",
    period: "Present",
    current: true,
    description:
      "The current chapter. Where the day's tabs actually get opened.",
  },
  {
    company: "ALNO",
    role: "Software Engineer",
    period: "Past",
    description:
      "A stop between Hareseca and Tensor Labs. Software engineering work in the shape it usually takes.",
  },
  {
    company: "Hareseca LLC",
    role: "Software Engineer, Bloom Booking",
    period: "Past",
    description:
      "Worked on Bloom Booking, their product. My role sat between software architecture and system design, mostly around making sure the thing stayed scalable and maintainable as it grew.",
  },
  {
    company: "Dexplat Technologies",
    role: "Intern, then Summer Program Lead",
    period: "Past",
    description:
      "Started as an intern, ended up leading their summer internship program. In between, I got my hands on a wider range of work than one usually does at that stage: web, mobile, backend, across e-commerce, social media, fintech, and healthcare.",
  },
  {
    company: "IEEE YESIST12",
    role: "Vice Chairperson, App Dev Committee",
    period: "Past",
    description:
      "Joined the App Development Committee to help build YESIST12's mobile application. Eventually led the committee as its Vice Chairperson.",
  },
];

export type Talk = {
  title: string;
  host: string;
  location: string;
};

export const talks: Talk[] = [
  {
    title: "NEXUS Pakistan",
    host: "Hazara University",
    location: "Mansehra",
  },
  {
    title: "Flutter Meetup 2024",
    host: "Flutter Islamabad",
    location: "Islamabad",
  },
  {
    title: "Flutter in Production Extended",
    host: "Flutter Islamabad",
    location: "Islamabad",
  },
  {
    title: "Flutter Bootcamp, Phase 2",
    host: "Flutter Sukkur",
    location: "Sukkur",
  },
  {
    title: "Flutter Learn from Experts",
    host: "Flutter Lahore",
    location: "Lahore",
  },
  {
    title: "Flutter Forward Extended",
    host: "Flutter Community",
    location: "Pakistan",
  },
];

export type Article = {
  title: string;
  blurb: string;
  url: string;
};

export const articles: Article[] = [
  {
    title: "Behind the Code: Journey Building PRISM",
    blurb:
      "The architecture behind PRISM's mobile application and backend, and a bit of the story that got us there.",
    url: "https://medium.com/@ahmadexe/behind-the-code-journey-building-prism-f3bf7de0883d",
  },
  {
    title: "Concurrency in Go: Everything You Need to Know",
    blurb:
      "Threads, concurrency, parallelism, goroutines, channels. The basics, and the patterns you'll actually reach for in Go.",
    url: "https://medium.com/@ahmadexe/concurrency-in-go-everything-you-need-to-know-5319e69a9e54",
  },
  {
    title: "Go gRPC: Understanding gRPC with Go",
    blurb:
      "A working guide to inter-service communication with gRPC, written in Go and paced for people building real systems.",
    url: "https://medium.com/@ahmadexe/go-grpc-understanding-grpc-with-go-a-guide-to-inter-service-communication-ea7eb8749c60",
  },
  {
    title: "The Prettiest Session Hijack I Ever Fell For",
    blurb:
      "A short, honest story about the day my session got hijacked in the most well-dressed way possible.",
    url: "https://medium.com/@ahmadexe/the-prettiest-session-hijack-i-ever-fell-for-cc9d93994305",
  },
  {
    title: "FlutterFire Push Notifications via FCM, Flutter Web",
    blurb:
      "A walk through sending push notifications on Flutter for the web — the pieces that are easy to miss the first time.",
    url: "https://medium.com/@ahmadexe/flutterfire-push-notifications-via-fcm-flutter-web-b475f3e0a5e2",
  },
];

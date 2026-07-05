export type FSNode =
  | { kind: "dir"; name: string; children: FSNode[] }
  | { kind: "file"; name: string; content: string };

const agenixDescription = `Agenix is a Flutter and Dart framework for building agentic applications. Modular by design. You define agents, plug in an LLM like Gemini, and manage state through built-in or custom data stores such as Firebase. Each agent can be equipped with tools to perform specific actions (fetching weather, pulling news, running business logic), and multiple agents can be chained for collaborative reasoning.

The system behavior lives in a simple configuration file, so setup stays customizable without turning into a mess. Open-source, and something I still tend to on my own time.

GitHub: https://github.com/ahmadexe/agenix
pub.dev: https://pub.dev/packages/agenix`;

const prismDescription = `The current social landscape treats personal data like a commodity. Users don't own it, don't see how it moves, and don't share in the value it creates.

PRISM tries a different arrangement. Built on blockchain, user data is stored securely, tamper-proof, and fully user-owned. No third party can access or monetize it without traceable consent. Paired with AI, it personalizes what you see without needing to surveil you to do it. A quiet attempt at rebuilding trust in a place that spent years earning distrust.

GitHub: https://github.com/ahmadexe/PRISM-Mobile-App`;

const prismChainDescription = `A novel gasless blockchain architecture, taking cues from both Bitcoin and Ethereum. Bitcoin lends the decentralization and security posture. Ethereum informs the smart-contract flexibility. Where things diverge is the fee model.

PRISM eliminates transaction costs for end users, which is what makes it viable for capturing high-volume social engagement data (likes, shares, comments, behavioral signals) without asking users to pay for their own presence. The chain sits beneath PRISM the app, but it can stand on its own.

GitHub: https://github.com/ahmadexe/prism-chain`;

const alnoAiDescription = `A mobile app that lets anyone build AI agents the way they'd write a note. You spin up an agent, give it a persona, wire it to tools, and choose whether it's yours alone or something the world can meet.

The public ones live in a shared space where people discover, remix, and follow the agents they trust. The private ones stay tucked away, doing the quieter work: journals, tutors, second brains. The whole idea was to move agent-building out of the terminal and into a place that feels closer to social software than infrastructure.`;

const bloomBookingDescription = `A booking platform sitting between two sides of the same industry that rarely speak the same language. Planners hunting for talent, vendors, and venues on one side. The artists, caterers, hosts, and spaces that make an event feel like one on the other.

Bloom Booking is the negotiation table: search, discovery, availability, contracts, and payments in one place, so nobody has to spend three weeks on WhatsApp to book a wedding. Built at Hareseca where I sat between architecture and system design.`;

export const root: FSNode = {
  kind: "dir",
  name: "~",
  children: [
    {
      kind: "dir",
      name: "projects",
      children: [
        {
          kind: "dir",
          name: "Agenix",
          children: [
            { kind: "file", name: "README.md", content: agenixDescription },
          ],
        },
        {
          kind: "dir",
          name: "PRISM",
          children: [
            { kind: "file", name: "README.md", content: prismDescription },
          ],
        },
        {
          kind: "dir",
          name: "PRISM-Chain",
          children: [
            { kind: "file", name: "README.md", content: prismChainDescription },
          ],
        },
        {
          kind: "dir",
          name: "ALNO-AI",
          children: [
            { kind: "file", name: "README.md", content: alnoAiDescription },
          ],
        },
        {
          kind: "dir",
          name: "Bloom-Booking",
          children: [
            { kind: "file", name: "README.md", content: bloomBookingDescription },
          ],
        },
      ],
    },
    {
      kind: "dir",
      name: "awards",
      children: [
        {
          kind: "file",
          name: "Global-Finals-ICT-2025-Shenzhen.md",
          content:
            "Alongside my team, we took first prize at the 2025 ICT Innovation Global Finals. We presented PRISM and talked through Agenix, which put us among the first few people working on agentic social media applications.",
        },
        {
          kind: "file",
          name: "Regional-Finals-ICT-2025-Riyadh.md",
          content:
            "First prize at the 2025 ICT Innovation Regional Finals. We presented PRISM with a focus on the system design and software architecture underneath it.",
        },
        {
          kind: "file",
          name: "Seeds-For-The-Future-2024.md",
          content:
            "I had the privilege of representing Pakistan at Huawei's Seeds for the Future 2024 program. Our project was a women's healthcare application.",
        },
        {
          kind: "file",
          name: "Visio-Spark-2024.md",
          content:
            "My team took home the 2024 Visio Spark Software Project Competition. We presented PRISM and PRISM Chain.",
        },
        {
          kind: "file",
          name: "Softec-2024-Mobile.md",
          content:
            "Softec 2024, held in Lahore, was one of the more memorable events of the year. I placed 1st Runner Up in the Mobile App Development track.",
        },
      ],
    },
    {
      kind: "dir",
      name: "experience",
      children: [
        {
          kind: "file",
          name: "Tensor-Labs.md",
          content:
            "The current chapter. Where the day's tabs actually get opened.",
        },
        {
          kind: "file",
          name: "ALNO.md",
          content:
            "A stop between Hareseca and Tensor Labs. Software engineering work in the shape it usually takes.",
        },
        {
          kind: "file",
          name: "Hareseca-LLC.md",
          content:
            "Worked on Bloom Booking, their product. My role sat between software architecture and system design, mostly around making sure the thing stayed scalable and maintainable as it grew.",
        },
        {
          kind: "file",
          name: "Dexplat-Technologies.md",
          content:
            "Started as an intern, ended up leading their summer internship program. In between, I got my hands on a wider range of work than one usually does at that stage: web, mobile, backend, across e-commerce, social media, fintech, and healthcare.",
        },
        {
          kind: "file",
          name: "IEEE-YESIST12.md",
          content:
            "Joined the App Development Committee to help build YESIST12's mobile application. Eventually led the committee as its Vice Chairperson.",
        },
      ],
    },
    {
      kind: "dir",
      name: "speaking",
      children: [
        {
          kind: "file",
          name: "NEXUS-Pakistan.md",
          content:
            "Invited talk at NEXUS Pakistan, hosted by Hazara University in Mansehra. Spoke on building with Flutter and where mobile is heading.",
        },
        {
          kind: "file",
          name: "Flutter-Meetup-2024-Islamabad.md",
          content:
            "Speaker at Flutter Meetup 2024, hosted by Flutter Islamabad. A room full of people who ship Dart on a good day.",
        },
        {
          kind: "file",
          name: "Flutter-In-Production-Extended.md",
          content:
            "Flutter in Production Extended, held in Islamabad. Talked through the parts of shipping Flutter that don't fit in a tutorial.",
        },
        {
          kind: "file",
          name: "Flutter-Bootcamp-Phase-2.md",
          content:
            "Flutter Bootcamp Phase 2, hosted by Flutter Sukkur. A longer-form session for people just past the starter tutorial phase.",
        },
        {
          kind: "file",
          name: "Flutter-Learn-From-Experts.md",
          content:
            "Learn from Experts, hosted by Flutter Lahore. A working-engineer's view on the parts of Flutter that reward second thoughts.",
        },
        {
          kind: "file",
          name: "Flutter-Forward-Extended.md",
          content:
            "Flutter Forward Extended. Talked through the parts of the keynote that mattered to people actually shipping.",
        },
      ],
    },
    {
      kind: "dir",
      name: "articles",
      children: [
        {
          kind: "file",
          name: "journey-building-prism.md",
          content:
            "The architecture behind PRISM's mobile application and backend, and a bit of the story that got us there.\nRead: https://medium.com/@ahmadexe/behind-the-code-journey-building-prism-f3bf7de0883d",
        },
        {
          kind: "file",
          name: "concurrency-in-go.md",
          content:
            "Threads, concurrency, parallelism, goroutines, channels. The basics, and the patterns you'll actually reach for in Go.\nRead: https://medium.com/@ahmadexe/concurrency-in-go-everything-you-need-to-know-5319e69a9e54",
        },
        {
          kind: "file",
          name: "go-grpc-inter-service.md",
          content:
            "A working guide to inter-service communication with gRPC, written in Go and paced for people building real systems.\nRead: https://medium.com/@ahmadexe/go-grpc-understanding-grpc-with-go-a-guide-to-inter-service-communication-ea7eb8749c60",
        },
        {
          kind: "file",
          name: "prettiest-session-hijack.md",
          content:
            "A short, honest story about the day my session got hijacked in the most well-dressed way possible.\nRead: https://medium.com/@ahmadexe/the-prettiest-session-hijack-i-ever-fell-for-cc9d93994305",
        },
        {
          kind: "file",
          name: "flutterfire-push-notifications.md",
          content:
            "A walk through sending push notifications on Flutter for the web — the pieces that are easy to miss the first time.\nRead: https://medium.com/@ahmadexe/flutterfire-push-notifications-via-fcm-flutter-web-b475f3e0a5e2",
        },
      ],
    },
  ],
};

export class FS {
  private stack: FSNode[] = [root];

  get cwd(): FSNode {
    return this.stack[this.stack.length - 1];
  }

  get pathString(): string {
    if (this.stack.length === 1) return "~";
    return this.stack.map((n) => n.name).join("/");
  }

  reset() {
    this.stack = [root];
  }

  ls(): string {
    if (this.cwd.kind !== "dir") return "";
    return this.cwd.children
      .map((c) => (c.kind === "dir" ? `${c.name}/` : c.name))
      .join("  ");
  }

  cd(target: string): string | null {
    if (!target || target === "~") {
      this.reset();
      return null;
    }
    if (target === "..") {
      if (this.stack.length > 1) this.stack.pop();
      return null;
    }
    if (this.cwd.kind !== "dir") return `cd: not a directory`;
    const parts = target.split("/").filter(Boolean);
    const snapshot = [...this.stack];
    for (const part of parts) {
      if (part === "..") {
        if (this.stack.length > 1) this.stack.pop();
        continue;
      }
      if (part === "~") {
        this.reset();
        continue;
      }
      const cur = this.cwd;
      if (cur.kind !== "dir") {
        this.stack = snapshot;
        return `cd: not a directory`;
      }
      const child = cur.children.find(
        (c) => c.name.toLowerCase() === part.toLowerCase()
      );
      if (!child) {
        this.stack = snapshot;
        return `cd: no such file or directory: ${target}`;
      }
      if (child.kind !== "dir") {
        this.stack = snapshot;
        return `cd: not a directory: ${child.name}`;
      }
      this.stack.push(child);
    }
    return null;
  }

  cat(name: string): string {
    if (!name) return "cat: missing operand";
    if (this.cwd.kind !== "dir") return "";
    const found = this.cwd.children.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (!found) return `cat: no such file or directory: ${name}`;
    if (found.kind === "dir") return `cat: ${found.name}: Is a directory`;
    return found.content;
  }
}

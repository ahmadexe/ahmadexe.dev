"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { FS } from "./fileSystem";
import { identity } from "@/lib/data";
import { SectionHeader } from "@/components/ui/SectionHeader";

type Entry =
  | { type: "prompt"; path: string; input: string }
  | { type: "out"; text: string }
  | { type: "banner"; text: string };

const banner = `Welcome to termolio.sh, the interactive shell.
Type 'help' for commands, or 'about' for who I am.
`;

const helpText = `Available commands:
  help, h, cmds        show this help
  clear, cls           clear the screen
  whoami, about        who is ahmadexe
  ls                   list current directory
  pwd, cwd             print working directory
  cd <path>            change directory
  cat <file>           print file contents
  socials              show my links
  banner               reprint the intro
  exit                 (does nothing, you're stuck with me)`;

const aboutText = `I'm Muhammad Ahmad. Ahmadexe online.
Software engineer, quietly obsessive builder.
Open-source. Agentic AI. Blockchain. Dev tools.
Good software is equal parts logic and soul.`;

const socialsText = `github    → ${identity.socials.github}
medium    → ${identity.socials.medium}
linkedin  → ${identity.socials.linkedin}`;

function longestCommonPrefix(strs: string[]): string {
  if (strs.length === 0) return "";
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (
      strs[i].toLowerCase().indexOf(prefix.toLowerCase()) !== 0 &&
      prefix.length > 0
    ) {
      prefix = prefix.slice(0, -1);
    }
    if (!prefix) return "";
  }
  return prefix;
}

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="link underline decoration-matrix/50 hover:decoration-matrix"
          data-cursor="hover"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function Terminal() {
  const fs = useMemo(() => new FS(), []);
  const [entries, setEntries] = useState<Entry[]>([
    { type: "banner", text: banner },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number>(-1);
  const [path, setPath] = useState("~");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const inView = useInView(sectionRef, { margin: "-20%" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [22, 0, -18]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [-8, 2, 10]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.92]);

  useEffect(() => {
    if (inView) inputRef.current?.focus();
  }, [inView]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [entries]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    setEntries((e) => [...e, { type: "prompt", path, input: cmd }]);
    if (!cmd) return;

    setHistory((h) => [...h, cmd]);
    setHistIdx(-1);

    const [head, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");

    const out = (text: string) =>
      setEntries((e) => [...e, { type: "out", text }]);

    switch (head.toLowerCase()) {
      case "help":
      case "h":
      case "commands":
      case "cmds":
      case "man":
        out(helpText);
        break;
      case "clear":
      case "cls":
        setEntries([]);
        break;
      case "whoami":
      case "wami":
      case "about":
      case "aboutme":
      case "ahmadexe":
        out(aboutText + `\n\n${socialsText}`);
        break;
      case "ls":
        out(fs.ls());
        break;
      case "pwd":
      case "cwd":
        out(fs.pathString);
        break;
      case "cd": {
        const err = fs.cd(arg);
        if (err) out(err);
        setPath(fs.pathString);
        break;
      }
      case "cat":
        out(fs.cat(arg));
        break;
      case "socials":
      case "links":
        out(socialsText);
        break;
      case "banner":
        setEntries((e) => [...e, { type: "banner", text: banner }]);
        break;
      case "exit":
      case "quit":
      case "logout":
        out("nice try. this shell doesn't quit.");
        break;
      case "sudo":
        out("nice try. sudo is not installed on this system.");
        break;
      case "rm":
        out("permission denied. this is a read-only shell.");
        break;
      default:
        out(
          `termolio: command not found: ${head}. Try 'help' for the list of commands.`
        );
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const next =
        histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setInput(history[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === -1) return;
      const next = histIdx + 1;
      if (next >= history.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(next);
        setInput(history[next]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const completed = complete(input);
      if (completed !== null) setInput(completed);
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setEntries([]);
    }
  };

  const complete = (raw: string): string | null => {
    const parts = raw.split(/(\s+)/);
    const last = parts[parts.length - 1] ?? "";
    const head = parts[0] ?? "";
    const isCmd = parts.length === 1;

    const commands = [
      "help", "clear", "whoami", "about", "ls", "pwd", "cd", "cat",
      "socials", "banner", "exit",
    ];

    const pool = isCmd
      ? commands
      : head.toLowerCase() === "cd"
      ? (fs.cwd.kind === "dir"
          ? fs.cwd.children.filter((c) => c.kind === "dir").map((c) => c.name)
          : [])
      : head.toLowerCase() === "cat"
      ? (fs.cwd.kind === "dir"
          ? fs.cwd.children.filter((c) => c.kind === "file").map((c) => c.name)
          : [])
      : fs.cwd.kind === "dir"
      ? fs.cwd.children.map((c) => c.name)
      : [];

    const matches = pool.filter((n) =>
      n.toLowerCase().startsWith(last.toLowerCase())
    );
    if (matches.length === 0) return null;
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      return parts.join("");
    }
    const common = longestCommonPrefix(matches);
    if (common.length > last.length) {
      parts[parts.length - 1] = common;
      return parts.join("");
    }
    return null;
  };

  return (
    <section
      ref={sectionRef}
      id="terminal"
      className="relative py-32 md:py-40"
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader
          index="02"
          eyebrow="./bin/terminal"
          title="The terminal that started all this."
          subtitle="This portfolio started life as a terminal. It still is one. Poke around, everything you can see on this site is browsable in here too."
        />

        <motion.div
          style={{
            rotateX,
            rotateY,
            scale,
            transformPerspective: 1400,
            transformStyle: "preserve-3d",
          }}
          className="relative mx-auto max-w-5xl"
        >
          {/* CRT bezel */}
          <div className="relative p-3 md:p-4 rounded-3xl bg-gradient-to-br from-[#0a1a10] to-[#020604] shadow-matrix-strong">
            {/* top bezel: fake screws + label */}
            <div className="flex items-center justify-between px-2 pb-2 text-[10px] text-ink-dim/40 uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-matrix/70 shadow-[0_0_6px_var(--matrix)]" />
                <span className="w-2 h-2 rounded-full bg-cyan-accent/50" />
                <span className="w-2 h-2 rounded-full bg-magenta/50" />
              </div>
              <div className="tracking-[0.4em]">TERMOLIO.CRT · v2.0</div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-matrix rounded-full animate-pulse" />
                <span>REC</span>
              </div>
            </div>

            {/* Screen */}
            <div
              className="crt relative h-[520px] md:h-[560px]"
              onClick={() => inputRef.current?.focus()}
            >
              <div
                ref={scrollRef}
                className="relative z-[2] h-full overflow-y-auto p-6 md:p-8 font-mono text-sm md:text-[15px] leading-relaxed"
              >
                {entries.map((e, i) => {
                  if (e.type === "banner") {
                    return (
                      <div key={i} className="mb-4">
                        <pre className="text-matrix glow-matrix text-xs md:text-sm leading-tight whitespace-pre-wrap">
{`  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
  ▄  T E R M O L I O  ·  ahmadexe@portfolio  ▄
  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`}
                        </pre>
                        <div className="mt-3 text-ink-dim/80 whitespace-pre-wrap">
                          {e.text}
                        </div>
                      </div>
                    );
                  }
                  if (e.type === "prompt") {
                    return (
                      <div key={i} className="flex flex-wrap gap-x-1">
                        <span className="text-cyan-accent">
                          {identity.handle}@termolio
                        </span>
                        <span className="text-ink-dim">:</span>
                        <span className="text-matrix">{e.path}</span>
                        <span className="text-ink-dim">$</span>
                        <span className="text-ink flex-1">{e.input}</span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={i}
                      className="whitespace-pre-wrap text-ink-dim/90 mb-2"
                    >
                      {linkify(e.text)}
                    </div>
                  );
                })}

                {/* Live prompt */}
                <div className="flex flex-wrap items-center gap-x-1 mt-1">
                  <span className="text-cyan-accent">
                    {identity.handle}@termolio
                  </span>
                  <span className="text-ink-dim">:</span>
                  <span className="text-matrix">{path}</span>
                  <span className="text-ink-dim">$</span>
                  <div className="relative flex-1 flex items-center min-w-[80px]">
                    <span className="whitespace-pre text-ink pointer-events-none">
                      {input}
                    </span>
                    <span className="caret" />
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKey}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="absolute inset-0 w-full h-full bg-transparent outline-none text-transparent caret-transparent selection:text-transparent"
                      aria-label="terminal input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom bezel: status line */}
            <div className="mt-2 px-2 flex items-center justify-between text-[10px] text-ink-dim/40 uppercase tracking-widest">
              <div>PID 0x0AE1 · MEM 42% · CPU 0.3%</div>
              <div className="flex items-center gap-4">
                <span className="hidden md:inline">
                  hint: try <span className="text-matrix">ls</span>,{" "}
                  <span className="text-matrix">cd projects</span>,{" "}
                  <span className="text-matrix">cat README.md</span>
                </span>
                <span>UTF-8</span>
              </div>
            </div>
          </div>

          {/* stand */}
          <div className="mx-auto mt-6 h-6 w-40 rounded-b-2xl bg-gradient-to-b from-[#0a1a10] to-transparent" />
          <div className="mx-auto h-1 w-56 rounded-full bg-matrix/30 blur-sm" />
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { FS } from "./fileSystem";
import { identity } from "@/lib/data";

export type ShellEntry =
  | { type: "prompt"; path: string; input: string }
  | { type: "out"; text: string }
  | { type: "banner"; text: string }
  | { type: "corrupt"; text: string };

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
  exit                 (does nothing, you're stuck with me)

warning: some incantations open holes in reality. type at your own risk.`;

const aboutText = `I'm Muhammad Ahmad. Ahmadexe online.
Software engineer, quietly obsessive builder.
Open-source. Agentic AI. Blockchain. Dev tools.
Good software is equal parts logic and soul.`;

const socialsText = `github    → ${identity.socials.github}
medium    → ${identity.socials.medium}
linkedin  → ${identity.socials.linkedin}`;

const DANGER_PATTERNS: RegExp[] = [
  /\bsudo\s+rm\s+-rf\b/i,
  /\brm\s+-rf\s*(\/|~|\.\/|\*|\.)/i,
  /:\s*\(\s*\)\s*\{[^}]*:\s*\|\s*:\s*&[^}]*\}\s*;\s*:/,
  /\(\s*\)\s*\{\s*\}\s*\(\s*\)\s*;/,
  /\bdd\s+if=\/dev\/(zero|random|urandom)/i,
  /\bmkfs(\.|\s)/i,
  />\s*\/dev\/sd[a-z]/i,
  /\bchmod\s+-R\s+000\s+\//i,
  /\bhalt\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /while\s*\(\s*true\s*\)/i,
  /\bfork\s*\(\s*\)/i,
  /\bkill\s+-9\s+1\b/i,
];

type State = {
  fs: FS;
  entries: ShellEntry[];
  history: string[];
  path: string;
};

function initialState(): State {
  return {
    fs: new FS(),
    entries: [{ type: "banner", text: banner }],
    history: [],
    path: "~",
  };
}

let state: State = initialState();

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

function push(e: ShellEntry) {
  setState({ entries: [...state.entries, e] });
}

function fireSingularity(cmd: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("termolio:singularity", { detail: { cmd } })
  );
}

function isDangerous(cmd: string) {
  return DANGER_PATTERNS.some((r) => r.test(cmd));
}

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

export const shell = {
  getState: (): State => state,

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  clear() {
    setState({ entries: [] });
  },

  resetAll() {
    const fresh = initialState();
    state = fresh;
    emit();
  },

  isDangerous,

  run(raw: string) {
    const cmd = raw.trim();
    push({ type: "prompt", path: state.path, input: cmd });
    if (!cmd) return;

    setState({ history: [...state.history, cmd] });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("termolio:activity", { detail: { cmd } })
      );
    }

    if (isDangerous(cmd)) {
      push({
        type: "corrupt",
        text:
          "SEGFAULT at 0x0000ae1f · memory protection violated\n" +
          "kernel panic — not syncing: attempted to kill init\n" +
          "opening event horizon ...",
      });
      fireSingularity(cmd);
      return;
    }

    const [head, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");
    const out = (text: string) => push({ type: "out", text });

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
        setState({ entries: [] });
        break;
      case "whoami":
      case "wami":
      case "about":
      case "aboutme":
      case "ahmadexe":
        out(aboutText + `\n\n${socialsText}`);
        break;
      case "ls":
        out(state.fs.ls());
        break;
      case "pwd":
      case "cwd":
        out(state.fs.pathString);
        break;
      case "cd": {
        const err = state.fs.cd(arg);
        if (err) out(err);
        setState({ path: state.fs.pathString });
        break;
      }
      case "cat":
        out(state.fs.cat(arg));
        break;
      case "socials":
      case "links":
        out(socialsText);
        break;
      case "banner":
        push({ type: "banner", text: banner });
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
  },

  complete(raw: string): string | null {
    const parts = raw.split(/(\s+)/);
    const last = parts[parts.length - 1] ?? "";
    const head = parts[0] ?? "";
    const isCmd = parts.length === 1;

    const cmds = [
      "help", "clear", "whoami", "about", "ls", "pwd", "cd", "cat",
      "socials", "banner", "exit",
    ];

    const fs = state.fs;
    const pool = isCmd
      ? cmds
      : head.toLowerCase() === "cd"
      ? fs.cwd.kind === "dir"
        ? fs.cwd.children.filter((c) => c.kind === "dir").map((c) => c.name)
        : []
      : head.toLowerCase() === "cat"
      ? fs.cwd.kind === "dir"
        ? fs.cwd.children.filter((c) => c.kind === "file").map((c) => c.name)
        : []
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
  },
};

export function useShell(): State {
  return useSyncExternalStore(shell.subscribe, shell.getState, shell.getState);
}

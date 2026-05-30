import {
  Archive,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Eraser,
  Folder,
  Highlighter,
  Lasso,
  Pen,
  Pencil,
  Plus,
  Redo2,
  Search,
  Sparkles,
  Undo2,
  User,
} from "lucide-react";
import { FOLDER_COLORS, NOTEBOOK_COLORS } from "../../types";

const colors = [
  { name: "Background", token: "knote-bg", value: "#FAF8F3" },
  { name: "Surface", token: "knote-surface", value: "#FFFFFF" },
  { name: "Border", token: "knote-border", value: "#ECE7DD" },
  { name: "Primary", token: "knote-primary", value: "#7C6A46" },
  { name: "Text", token: "knote-text", value: "#2D2D2D" },
  { name: "Success", token: "knote-success", value: "#6B8E6E" },
  { name: "Danger", token: "knote-danger", value: "#B56A6A" },
];

const principles = [
  "No decorative shadow",
  "Objects over cards",
  "Direct icon placement",
  "Readable touch targets",
  "Quiet native chrome",
];

const tools = [
  { icon: Pen, label: "Pen", active: true },
  { icon: Pencil, label: "Pencil" },
  { icon: Highlighter, label: "Highlighter" },
  { icon: Eraser, label: "Eraser" },
  { icon: Lasso, label: "Lasso" },
];

export default function DesignSystemPage() {
  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#FAF8F3] text-knote-text">
      <button
        type="button"
        aria-label="Profile"
        className="fixed right-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-knote-border bg-white text-knote-primary"
      >
        <User size={22} />
      </button>

      <div className="mx-auto flex w-full max-w-7xl gap-8 px-6 py-8 lg:px-10">
        <aside className="sticky top-8 hidden h-[calc(100vh-4rem)] w-72 shrink-0 flex-col rounded-[28px] border border-knote-border bg-white/74 p-4 backdrop-blur-xl lg:flex">
          <div className="px-2 pb-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-knote-text/35">
              KNote
            </p>
            <h1 className="text-[28px] font-semibold tracking-tight">
              Design System
            </h1>
          </div>
          <nav className="space-y-1 text-sm font-medium text-knote-text/62">
            {[
              "Foundation",
              "Color",
              "Typography",
              "Objects",
              "Controls",
              "Motion",
              "Future Auth",
            ].map((item, index) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className={`flex h-11 items-center justify-between rounded-[15px] px-3 transition-colors hover:bg-knote-bg ${
                  index === 0 ? "bg-knote-primary text-white" : ""
                }`}
              >
                {item}
                <ChevronRight size={15} />
              </a>
            ))}
          </nav>
          <div className="mt-auto rounded-[22px] border border-knote-border bg-white/78 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-knote-primary/12 text-knote-primary">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold">Local Profile</p>
                <p className="text-xs text-knote-text/40">Sign-in ready</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-8 pr-16">
          <header
            id="foundation"
            className="rounded-[32px] border border-knote-border bg-white/62 p-6 backdrop-blur-xl md:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-knote-primary">
              Product Language
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
              <div>
                <h2 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                  Flat, native notebook objects for iPad.
                </h2>
                <p className="mt-5 max-w-2xl text-[17px] leading-8 text-knote-text/58">
                  KNote uses soft borders, warm materials, and direct object
                  shapes. Avoid shadow-heavy cards. Folder and notebook icons
                  live on the object itself, not inside extra wrappers.
                </p>
              </div>
              <div className="rounded-[26px] border border-knote-border bg-white/72 p-4">
                <div className="grid grid-cols-2 gap-3">
                  {principles.map((principle) => (
                    <div
                      key={principle}
                      className="rounded-2xl border border-knote-border bg-knote-bg px-4 py-3 text-sm font-semibold"
                    >
                      {principle}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <Section id="color" title="Color">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {colors.map((color) => (
                <div
                  key={color.token}
                  className="rounded-[24px] border border-knote-border bg-white/66 p-4"
                >
                  <div
                    className="h-24 rounded-[18px] border border-black/5"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{color.name}</p>
                      <p className="mt-1 text-sm text-knote-text/42">
                        {color.token}
                      </p>
                    </div>
                    <code className="rounded-full bg-knote-bg px-2.5 py-1 text-xs font-semibold text-knote-text/50">
                      {color.value}
                    </code>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <SwatchStrip
                title="Notebook Covers"
                colors={[...NOTEBOOK_COLORS]}
              />
              <SwatchStrip title="Folder Covers" colors={[...FOLDER_COLORS]} />
            </div>
          </Section>

          <Section id="typography" title="Typography">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-[26px] border border-knote-border bg-white/66 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-knote-text/35">
                  Display
                </p>
                <p className="mt-3 text-5xl font-semibold tracking-tight">
                  Notebooks
                </p>
                <p className="mt-4 text-[17px] leading-8 text-knote-text/58">
                  Used for primary destinations. Keep headings plain, confident,
                  and visually separated from object labels.
                </p>
              </div>
              <div className="rounded-[26px] border border-knote-border bg-white/66 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-knote-text/35">
                  Object Labels
                </p>
                <div className="mt-3 space-y-3">
                  <p className="text-xl font-semibold">Ideas</p>
                  <p className="text-[15px] font-medium text-knote-text/70">
                    Daily Notes
                  </p>
                  <p className="text-sm text-knote-text/45">
                    4 folders · 12 notebooks
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section id="objects" title="Objects">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[28px] border border-knote-border bg-white/54 p-6 backdrop-blur-xl">
                <p className="mb-5 text-sm font-semibold text-knote-text/45">
                  Folder object
                </p>
                <div className="grid grid-cols-2 gap-5">
                  <FolderObject
                    color="#B9C7B1"
                    icon={<Sparkles size={34} />}
                    name="Ideas"
                    count={7}
                  />
                  <FolderObject
                    color="#B7C1CF"
                    icon={<Archive size={34} />}
                    name="Archive"
                    count={16}
                  />
                </div>
              </div>
              <div className="rounded-[28px] border border-knote-border bg-white/54 p-6 backdrop-blur-xl">
                <p className="mb-5 text-sm font-semibold text-knote-text/45">
                  Notebook object
                </p>
                <div className="grid grid-cols-2 gap-5">
                  <NotebookObject color="#7C6A46" name="Daily Notes" />
                  <NotebookObject color="#6B7B6E" name="Sketchbook" />
                </div>
              </div>
            </div>
          </Section>

          <Section id="controls" title="Controls">
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[28px] border border-knote-border bg-white/66 p-6">
                <p className="mb-4 text-sm font-semibold text-knote-text/45">
                  Buttons and search
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="flex h-12 items-center gap-2 rounded-2xl bg-knote-primary px-5 text-[15px] font-medium text-white"
                  >
                    <Plus size={19} />
                    Notebook
                  </button>
                  <button
                    type="button"
                    className="flex h-12 items-center gap-2 rounded-2xl border border-knote-border bg-white/75 px-4 text-[15px] font-medium"
                  >
                    <Folder size={18} />
                    Folder
                  </button>
                </div>
                <div className="mt-5 flex h-12 items-center gap-3 rounded-2xl border border-knote-border/80 bg-white/72 px-4">
                  <Search size={18} className="text-knote-text/35" />
                  <span className="text-[15px] text-knote-text/35">
                    Search notebooks and folders
                  </span>
                </div>
              </div>

              <div className="rounded-[28px] border border-knote-border bg-white/66 p-6">
                <p className="mb-4 text-sm font-semibold text-knote-text/45">
                  Writing toolbar
                </p>
                <div className="inline-flex items-center gap-1.5 rounded-[20px] border border-knote-border bg-white/78 px-3 py-2 backdrop-blur-xl">
                  {tools.map(({ icon: Icon, label, active }) => (
                    <button
                      type="button"
                      key={label}
                      aria-label={label}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
                        active
                          ? "bg-knote-primary text-white"
                          : "text-knote-text/60"
                      }`}
                    >
                      <Icon size={20} />
                    </button>
                  ))}
                  <div className="mx-1 h-7 w-px bg-knote-border" />
                  <Undo2 size={20} className="mx-3 text-knote-text/45" />
                  <Redo2 size={20} className="mx-3 text-knote-text/25" />
                </div>
              </div>
            </div>
          </Section>

          <Section id="motion" title="Motion And Interaction">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Tap", "Open notebook or folder immediately."],
                ["Long press", "Reveal rename, move, and delete actions."],
                ["Drag", "Move objects onto folders or back to Library."],
              ].map(([name, body]) => (
                <div
                  key={name}
                  className="rounded-[24px] border border-knote-border bg-white/66 p-5"
                >
                  <Circle size={18} className="text-knote-primary" />
                  <p className="mt-4 font-semibold">{name}</p>
                  <p className="mt-2 text-sm leading-6 text-knote-text/52">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="future-auth" title="Future Auth">
            <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
              <div className="rounded-[28px] border border-knote-border bg-white/72 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-knote-primary/12 text-knote-primary">
                    <User size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">
                      Local Profile
                    </p>
                    <p className="truncate text-sm text-knote-text/40">
                      Sign-in ready
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-knote-success/14 text-knote-success">
                    <Check size={17} />
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] border border-knote-border bg-white/66 p-6">
                <p className="text-[17px] leading-8 text-knote-text/58">
                  Authentication enters as a circular avatar in the top-right.
                  The rest of the app stays local-first and writing-first.
                </p>
              </div>
            </div>
          </Section>
        </section>
      </div>
    </main>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function SwatchStrip({ title, colors }: { title: string; colors: string[] }) {
  return (
    <div className="rounded-[24px] border border-knote-border bg-white/66 p-5">
      <p className="mb-4 text-sm font-semibold text-knote-text/45">{title}</p>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <div
            key={color}
            className="h-10 w-10 rounded-full border border-black/5"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

function FolderObject({
  color,
  icon,
  name,
  count,
}: {
  color: string;
  icon: React.ReactNode;
  name: string;
  count: number;
}) {
  return (
    <div className="relative aspect-[4/3]">
      <div className="absolute inset-x-0 bottom-0 top-5 rounded-[20px] border border-white/35">
        <div
          className="absolute -top-4 left-4 h-8 w-[46%] rounded-t-[14px] border border-white/30 border-b-0"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute inset-0 rounded-[20px]"
          style={{ backgroundColor: color }}
        />
        <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-[20px] bg-white/18" />
      </div>
      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex justify-end">
          <div className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white/86">
            {count}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-white">
          {icon}
        </div>
        <div>
          <p className="truncate text-[15px] font-semibold text-white">
            {name}
          </p>
          <p className="mt-1 text-xs font-medium text-white/72">
            {count} items
          </p>
        </div>
      </div>
    </div>
  );
}

function NotebookObject({ color, name }: { color: string; name: string }) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] border border-white/35">
      <div
        className="absolute inset-0 rounded-[20px]"
        style={{ backgroundColor: color }}
      />
      <div className="absolute bottom-0 left-0 top-0 w-3 bg-black/10" />
      <div className="absolute inset-x-4 top-5 h-px bg-white/18" />
      <div className="absolute inset-x-4 top-8 h-px bg-white/12" />
      <div className="relative flex h-full flex-col p-5 text-white">
        <div className="flex flex-1 items-center justify-center">
          <BookOpen size={38} strokeWidth={1.7} />
        </div>
        <div className="border-t border-white/22 pt-4">
          <p className="truncate text-[15px] font-semibold">{name}</p>
          <p className="mt-1 text-xs font-medium text-white/68">Notebook</p>
        </div>
      </div>
    </div>
  );
}

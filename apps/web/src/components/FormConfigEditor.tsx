"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Globe, Info, Loader2, Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { upsertFormConfig } from "@/actions/upsertFormConfig";
import { FormPreview } from "@/components/FormPreview";
import { resolveLabel } from "@repo/types";

type LabelMap = Record<string, string>;
type Polarity = "positive" | "negative";

interface EditorTag {
  id: string;
  labels: LabelMap;
  active: boolean;
  /** <7 days old AND unreferenced — the × hard-deletes; otherwise it deactivates. */
  deletable: boolean;
}

interface EditorCategory {
  id: string;
  labels: LabelMap;
  positive: EditorTag[];
  negative: EditorTag[];
}

interface Props {
  businessId: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  defaultValues: {
    brandColor: string;
    logoUrl: string;
    welcomeMessage: LabelMap;
    categories: {
      id: string;
      labels: LabelMap;
      tags: {
        id: string;
        labels: LabelMap;
        polarity: Polarity;
        active: boolean;
        order: number;
        deletable: boolean;
      }[];
    }[];
  };
}

const LANGUAGE_NAMES: Record<string, string> = { en: "English", de: "Deutsch" };
const languageName = (code: string) => LANGUAGE_NAMES[code] ?? code.toUpperCase();

// Languages the app supports authoring in — drives the toggles (never scanned label keys).
const APP_LANGUAGES = ["en", "de"];
// Cap on ACTIVE chips per polarity per category (mirrors the server guardrail).
const ACTIVE_CHIPS_CAP = 4;
const DELETE_RULE =
  "New chips with no feedback yet (under a week old) are removed permanently. Once a chip is used or older than a week, removing it just hides it from the form — past feedback stays attributed to it.";

function splitCategory(c: Props["defaultValues"]["categories"][number]): EditorCategory {
  const byOrder = [...c.tags].sort((a, b) => a.order - b.order);
  const pick = (p: Polarity) =>
    byOrder
      .filter((t) => t.polarity === p)
      .map((t) => ({ id: t.id, labels: t.labels, active: t.active, deletable: t.deletable }));
  return { id: c.id, labels: c.labels, positive: pick("positive"), negative: pick("negative") };
}

type ModalState = { catId: string; polarity: Polarity; tagId?: string; labels: LabelMap } | null;

export function FormConfigEditor({
  businessId,
  defaultLanguage,
  supportedLanguages,
  defaultValues,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const allLanguages = useMemo(
    () => Array.from(new Set([defaultLanguage, ...APP_LANGUAGES])),
    [defaultLanguage]
  );

  const initial = useMemo(
    () =>
      JSON.stringify({
        brandColor: defaultValues.brandColor,
        logoUrl: defaultValues.logoUrl,
        welcome: defaultValues.welcomeMessage,
        enabled: supportedLanguages,
        categories: defaultValues.categories.map(splitCategory),
        deletedIds: [],
      }),
    [defaultValues, supportedLanguages]
  );

  const [brandColor, setBrandColor] = useState(defaultValues.brandColor);
  const [logoUrl, setLogoUrl] = useState(defaultValues.logoUrl);
  const [welcome, setWelcome] = useState<LabelMap>(defaultValues.welcomeMessage);
  const [enabled, setEnabled] = useState<string[]>(supportedLanguages);
  const [categories, setCategories] = useState<EditorCategory[]>(
    defaultValues.categories.map(splitCategory)
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [editLang, setEditLang] = useState(defaultLanguage);
  const [modal, setModal] = useState<ModalState>(null);

  const editLanguages = allLanguages.filter((l) => l === defaultLanguage || enabled.includes(l));

  const current = JSON.stringify({ brandColor, logoUrl, welcome, enabled, categories, deletedIds });
  const isDirty = current !== initial;

  function toggleLanguage(lang: string, on: boolean) {
    setEnabled((prev) => (on ? Array.from(new Set([...prev, lang])) : prev.filter((l) => l !== lang)));
    if (!on && editLang === lang) setEditLang(defaultLanguage);
  }
  function updateWelcome(lang: string, value: string) {
    setWelcome((prev) => ({ ...prev, [lang]: value }));
  }
  function updateCategoryLabel(catId: string, lang: string, value: string) {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, labels: { ...c.labels, [lang]: value } } : c))
    );
  }

  // ── Chip add / edit / remove ──────────────────────────────
  function openAdd(catId: string, polarity: Polarity) {
    setModal({ catId, polarity, labels: { [defaultLanguage]: "" } });
  }
  function openEdit(catId: string, polarity: Polarity, tag: EditorTag) {
    setModal({ catId, polarity, tagId: tag.id, labels: { ...tag.labels } });
  }
  function saveModal() {
    if (!modal) return;
    const labels: LabelMap = {};
    for (const [lang, text] of Object.entries(modal.labels)) {
      const v = text.trim();
      if (v) labels[lang] = v;
    }
    if (!labels[defaultLanguage]) return; // base required (Save is disabled anyway)

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== modal.catId) return c;
        const list = c[modal.polarity];
        if (modal.tagId) {
          return { ...c, [modal.polarity]: list.map((t) => (t.id === modal.tagId ? { ...t, labels } : t)) };
        }
        return {
          ...c,
          [modal.polarity]: [
            ...list,
            { id: `new:${crypto.randomUUID()}`, labels, active: true, deletable: true },
          ],
        };
      })
    );
    setModal(null);
  }
  function removeChip(catId: string, polarity: Polarity, tag: EditorTag) {
    if (tag.deletable) {
      // Permanent delete: drop from the list; if it was persisted, stage its id for deletion.
      if (!tag.id.startsWith("new:")) setDeletedIds((prev) => [...prev, tag.id]);
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId ? { ...c, [polarity]: c[polarity].filter((t) => t.id !== tag.id) } : c
        )
      );
    } else {
      // Soft delete: deactivate (stays in payload as active=false, unrendered).
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId
            ? { ...c, [polarity]: c[polarity].map((t) => (t.id === tag.id ? { ...t, active: false } : t)) }
            : c
        )
      );
    }
  }

  function reset() {
    const v = JSON.parse(initial) as {
      brandColor: string;
      logoUrl: string;
      welcome: LabelMap;
      enabled: string[];
      categories: EditorCategory[];
    };
    setBrandColor(v.brandColor);
    setLogoUrl(v.logoUrl);
    setWelcome(v.welcome);
    setEnabled(v.enabled);
    setCategories(v.categories);
    setDeletedIds([]);
    setEditLang(defaultLanguage);
  }

  function onSubmit() {
    startTransition(async () => {
      const res = await upsertFormConfig({
        businessId,
        brandColor,
        logoUrl,
        welcomeMessage: welcome,
        supportedLanguages: enabled,
        deletedIds,
        categories: categories.map((c) => ({
          id: c.id,
          labels: c.labels,
          tags: [
            ...c.positive.map((t, i) => ({
              id: t.id,
              labels: t.labels,
              active: t.active,
              order: i,
              polarity: "positive" as const,
            })),
            ...c.negative.map((t, i) => ({
              id: t.id,
              labels: t.labels,
              active: t.active,
              order: 100 + i,
              polarity: "negative" as const,
            })),
          ],
        })),
      });
      if (res.success) {
        toast.success("Configuration saved.");
      } else {
        toast.error(res.error ?? "Failed to save. Please try again.");
      }
    });
  }

  const colorValid = /^#[0-9A-Fa-f]{6}$/.test(brandColor);
  const modalBaseFilled = !!modal?.labels[defaultLanguage]?.trim();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,360px)] gap-10">
      <div className="space-y-8 self-start">
        {/* ── Form languages ─────────────────────────────────── */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Globe className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Form languages</p>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                  {languageName(defaultLanguage)} is your base language. Toggle others on to
                  translate each label.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                {defaultLanguage.toUpperCase()}
                <span className="text-muted-foreground tracking-widest"> · BASE</span>
              </span>
              {allLanguages
                .filter((l) => l !== defaultLanguage)
                .map((lang) => (
                  <span key={lang} className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {languageName(lang)}
                    <Switch
                      checked={enabled.includes(lang)}
                      onCheckedChange={(on) => toggleLanguage(lang, on)}
                      aria-label={`Enable ${languageName(lang)}`}
                    />
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Editing language (governs the welcome + every label below) ── */}
        {editLanguages.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">Editing in</span>
            <div className="inline-flex gap-1 rounded-full bg-muted p-1 text-sm">
              {editLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setEditLang(lang)}
                  className={`rounded-full px-4 py-1 transition-colors ${
                    editLang === lang
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {languageName(lang)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Branding ───────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Branding</p>
          <h2 className="text-xl font-bold text-foreground mb-3">Branding</h2>
          <Card>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Brand color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorValid ? brandColor : "#2563EB"}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-transparent p-1"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#2563EB"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    Logo URL <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className={logoUrl ? "pr-8" : ""}
                    />
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear logo URL"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Welcome message{" "}
                  <span className="text-muted-foreground font-normal">· {languageName(editLang)}</span>
                </Label>
                <Input
                  value={welcome[editLang] ?? ""}
                  onChange={(e) => updateWelcome(editLang, e.target.value)}
                  placeholder={
                    editLang === defaultLanguage
                      ? "Thanks for visiting! We'd love your feedback."
                      : `Translate the welcome message into ${languageName(editLang)}…`
                  }
                  maxLength={200}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Form content ───────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Form content</p>
          <h2 className="flex items-center gap-1.5 text-xl font-bold text-foreground mb-1">
            Feedback Categories &amp; Chips
            <span title={DELETE_RULE} aria-label={DELETE_RULE} className="cursor-help text-muted-foreground">
              <Info className="size-4" />
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xl">
            Tap a chip to edit its wording and translation. Remove a chip with its ✕.
          </p>

          <div className="space-y-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="border-border/60">
                <CardHeader className="pb-3 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Category name <span className="font-normal">· {languageName(editLang)}</span>
                  </Label>
                  <Input
                    value={cat.labels[editLang] ?? ""}
                    onChange={(e) => updateCategoryLabel(cat.id, editLang, e.target.value)}
                    placeholder={editLang === defaultLanguage ? "Category name" : "Auto-translated if blank"}
                    className="h-9 text-sm font-medium"
                  />
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  {(["positive", "negative"] as const).map((polarity) => {
                    const activeChips = cat[polarity].filter((t) => t.active);
                    const atCap = activeChips.length >= ACTIVE_CHIPS_CAP;
                    return (
                      <div key={polarity} className="space-y-2">
                        <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <span
                            className={`size-1.5 rounded-full ${
                              polarity === "positive" ? "bg-primary" : "bg-destructive"
                            }`}
                          />
                          <span className="capitalize">{polarity} chips</span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            shown at {polarity === "positive" ? "4–5★" : "1–3★"}
                          </span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {activeChips.map((tag) => (
                            <span
                              key={tag.id}
                              className={`inline-flex items-center rounded-full border py-1 pl-3 pr-1 text-sm text-foreground ${
                                polarity === "positive"
                                  ? "border-primary/30 bg-primary/10"
                                  : "border-destructive/30 bg-destructive/10"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => openEdit(cat.id, polarity, tag)}
                                className="mr-1 max-w-[180px] truncate hover:underline"
                              >
                                {resolveLabel(tag.labels, { default: defaultLanguage, active: editLang })}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeChip(cat.id, polarity, tag)}
                                title={tag.deletable ? "Remove permanently" : "Hide from form"}
                                aria-label={tag.deletable ? "Remove chip permanently" : "Hide chip from form"}
                                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="size-3.5" />
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => openAdd(cat.id, polarity)}
                            disabled={atCap}
                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="size-3.5" /> Add chip
                          </button>
                        </div>
                        {atCap && (
                          <p className="text-[10px] text-muted-foreground">
                            Max {ACTIVE_CHIPS_CAP} active — remove one to add another.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending || !isDirty} onClick={reset}>
            Cancel
          </Button>
          <Button type="button" disabled={isPending || !isDirty} onClick={onSubmit}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Saving…" : "Save Configuration"}
          </Button>
        </div>
      </div>

      {/* ── Live preview ───────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="sticky top-8">
          <FormPreview
            brandColor={colorValid ? brandColor : "#2563EB"}
            logoUrl={logoUrl}
            welcome={welcome}
            categories={categories}
            defaultLanguage={defaultLanguage}
            languages={editLanguages}
          />
        </div>
      </div>

      {/* ── Add / edit chip modal ──────────────────────────── */}
      <Dialog open={modal !== null} onOpenChange={(open) => !open && setModal(null)}>
        {modal && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{modal.tagId ? "Edit chip" : "Add chip"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {editLanguages.map((lang) => (
                <div key={lang} className="space-y-1.5">
                  <Label className="text-xs">
                    {languageName(lang)}
                    {lang === defaultLanguage ? (
                      <span className="text-destructive"> *</span>
                    ) : (
                      <span className="text-muted-foreground font-normal"> (optional)</span>
                    )}
                  </Label>
                  <Input
                    value={modal.labels[lang] ?? ""}
                    onChange={(e) =>
                      setModal((m) => (m ? { ...m, labels: { ...m.labels, [lang]: e.target.value } } : m))
                    }
                    placeholder={
                      lang === defaultLanguage ? "e.g. Great Coffee" : "Leave blank to auto-translate"
                    }
                    maxLength={40}
                    autoFocus={lang === defaultLanguage}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={saveModal} disabled={!modalBaseFilled}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

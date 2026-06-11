"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { upsertFormConfig } from "@/actions/upsertFormConfig";
import { FormPreview } from "@/components/FormPreview";
import { resolveLabel } from "@repo/types";

type LabelMap = Record<string, string>;

interface EditorTag {
  id: string;
  labels: LabelMap;
  polarity: "positive" | "negative";
  active: boolean;
}

interface EditorCategory {
  id: string;
  labels: LabelMap;
  tags: EditorTag[];
}

interface Props {
  businessId: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  defaultValues: {
    brandColor: string;
    logoUrl: string;
    welcomeMessage: string;
    categories: EditorCategory[];
  };
}

const LANGUAGE_NAMES: Record<string, string> = { en: "English", de: "German" };
function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code.toUpperCase();
}

export function FormConfigEditor({
  businessId,
  defaultLanguage,
  supportedLanguages,
  defaultValues,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [previewScreen, setPreviewScreen] = useState<"stars" | "chips">("stars");

  const initial = useMemo(() => JSON.stringify(defaultValues), [defaultValues]);
  const [brandColor, setBrandColor] = useState(defaultValues.brandColor);
  const [logoUrl, setLogoUrl] = useState(defaultValues.logoUrl);
  const [welcomeMessage, setWelcomeMessage] = useState(defaultValues.welcomeMessage);
  const [categories, setCategories] = useState<EditorCategory[]>(defaultValues.categories);

  const current = { brandColor, logoUrl, welcomeMessage, categories };
  const isDirty = JSON.stringify(current) !== initial;

  function updateCategoryLabel(catId: string, lang: string, value: string) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, labels: { ...c.labels, [lang]: value } } : c
      )
    );
  }

  function updateTag(catId: string, tagId: string, patch: Partial<EditorTag>) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, tags: c.tags.map((t) => (t.id === tagId ? { ...t, ...patch } : t)) }
          : c
      )
    );
  }

  function updateTagLabel(catId: string, tagId: string, lang: string, value: string) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
              ...c,
              tags: c.tags.map((t) =>
                t.id === tagId ? { ...t, labels: { ...t.labels, [lang]: value } } : t
              ),
            }
          : c
      )
    );
  }

  function reset() {
    const v = JSON.parse(initial) as Props["defaultValues"];
    setBrandColor(v.brandColor);
    setLogoUrl(v.logoUrl);
    setWelcomeMessage(v.welcomeMessage);
    setCategories(v.categories);
  }

  function onSubmit() {
    startTransition(async () => {
      const result = await upsertFormConfig({
        businessId,
        brandColor,
        logoUrl,
        welcomeMessage,
        categories: categories.map((c) => ({
          id: c.id,
          labels: c.labels,
          tags: c.tags.map((t) => ({ id: t.id, labels: t.labels, active: t.active })),
        })),
      });
      if (result.success) {
        toast.success("Configuration saved.");
        // Persisted blank-fill translations may differ; a refresh re-syncs them.
      } else {
        toast.error(result.error ?? "Failed to save. Please try again.");
      }
    });
  }

  // Preview consumes resolved default-language labels for active tags only.
  const previewCategories = categories.map((c) => ({
    name: resolveLabel(c.labels, { default: defaultLanguage }),
    positiveChips: c.tags
      .filter((t) => t.active && t.polarity === "positive")
      .map((t) => resolveLabel(t.labels, { default: defaultLanguage })),
    negativeChips: c.tags
      .filter((t) => t.active && t.polarity === "negative")
      .map((t) => resolveLabel(t.labels, { default: defaultLanguage })),
  }));

  const colorValid = /^#[0-9A-Fa-f]{6}$/.test(brandColor);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10">
      <div className="space-y-6 self-start">
        {/* Branding */}
        <div onFocus={() => setPreviewScreen("stars")}>
          <p className="text-sm font-medium text-foreground mb-3">Branding</p>
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorValid ? brandColor : "#2563EB"}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Clear logo URL"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Input
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Thanks for visiting! We'd love your feedback."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories + tags (light edits: labels + active only) */}
        <div className="space-y-3" onFocus={() => setPreviewScreen("chips")}>
          <div>
            <p className="text-sm font-medium text-foreground">Feedback Categories &amp; Chips</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Edit the wording in each language and switch chips on or off. Turning a chip off
              hides it from the form but keeps past feedback attributed to it.
            </p>
          </div>

          {categories.map((cat) => (
            <Card key={cat.id} className="border-border/60">
              <CardHeader className="pb-3 space-y-2">
                <Label className="text-xs text-muted-foreground">Category name</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {supportedLanguages.map((lang) => (
                    <div key={lang} className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">{languageName(lang)}</span>
                      <Input
                        value={cat.labels[lang] ?? ""}
                        onChange={(e) => updateCategoryLabel(cat.id, lang, e.target.value)}
                        placeholder={lang === defaultLanguage ? "Category name" : "Auto-translated if left blank"}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {(["positive", "negative"] as const).map((polarity) => {
                  const tags = cat.tags.filter((t) => t.polarity === polarity);
                  if (tags.length === 0) return null;
                  return (
                    <div key={polarity} className="space-y-2">
                      <p className="text-xs font-medium text-foreground capitalize">
                        {polarity} chips
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          ({polarity === "positive" ? "shown at 4–5★" : "shown at 1–3★"})
                        </span>
                      </p>
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className={`flex items-end gap-2 rounded-md border border-border/60 p-2 ${
                            tag.active ? "" : "opacity-50"
                          }`}
                        >
                          <div className="grid flex-1 gap-2 sm:grid-cols-2">
                            {supportedLanguages.map((lang) => (
                              <div key={lang} className="space-y-1">
                                <span className="text-[11px] text-muted-foreground">
                                  {languageName(lang)}
                                </span>
                                <Input
                                  value={tag.labels[lang] ?? ""}
                                  onChange={(e) => updateTagLabel(cat.id, tag.id, lang, e.target.value)}
                                  placeholder={
                                    lang === defaultLanguage ? "Chip label" : "Auto-translated if blank"
                                  }
                                  className="h-8 text-sm"
                                  maxLength={40}
                                />
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant={tag.active ? "outline" : "ghost"}
                            size="sm"
                            className="h-8 shrink-0"
                            onClick={() => updateTag(cat.id, tag.id, { active: !tag.active })}
                          >
                            {tag.active ? "Active" : "Off"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
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

      {/* Live preview */}
      <div className="hidden lg:block">
        <div className="sticky top-8">
          <FormPreview
            brandColor={colorValid ? brandColor : "#2563EB"}
            logoUrl={logoUrl}
            welcomeMessage={welcomeMessage}
            categories={previewCategories}
            screen={previewScreen}
            onScreenChange={setPreviewScreen}
          />
        </div>
      </div>
    </div>
  );
}

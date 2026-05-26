"use client";

import { useState, useTransition, KeyboardEvent } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X, Loader2, Plus, Trash2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { upsertFormConfig } from "@/actions/upsertFormConfig";
import { FormPreview } from "@/components/FormPreview";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  positiveChips: z.array(z.string().min(1)).min(1, "Add at least one positive chip"),
  negativeChips: z.array(z.string().min(1)).min(1, "Add at least one negative chip"),
});

const schema = z.object({
  businessId: z.string().min(1),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  welcomeMessage: z.string().min(1, "Required").max(200),
  categories: z
    .array(categorySchema)
    .min(1, "Add at least one category")
    .max(3, "Maximum 3 categories"),
});

type FormValues = z.infer<typeof schema>;

interface CategoryData {
  name: string;
  positiveChips: string[];
  negativeChips: string[];
}

interface Props {
  businessId: string;
  defaultValues?: {
    brandColor?: string;
    logoUrl?: string;
    welcomeMessage?: string;
    categories?: CategoryData[];
  };
}

function ChipInput({
  chips,
  onChange,
  placeholder,
  chipClass,
}: {
  chips: string[];
  onChange: (chips: string[]) => void;
  placeholder: string;
  chipClass: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const addChip = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !chips.includes(trimmed)) {
      onChange([...chips, trimmed]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip();
    } else if (e.key === "Backspace" && inputValue === "" && chips.length > 0) {
      onChange(chips.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-transparent p-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 min-h-10">
      {chips.map((chip, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${chipClass}`}
        >
          {chip}
          <button
            type="button"
            onClick={() => onChange(chips.filter((_, idx) => idx !== i))}
            className="hover:opacity-70 transition-opacity"
            aria-label={`Remove ${chip}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addChip}
        placeholder={chips.length === 0 ? placeholder : "Add more…"}
        className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    name: "General",
    positiveChips: ["Great Service", "Friendly Staff"],
    negativeChips: ["Long Wait", "Poor Communication"],
  },
];

export function FormConfigEditor({ businessId, defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessId,
      brandColor: defaultValues?.brandColor ?? "#2563EB",
      logoUrl: defaultValues?.logoUrl ?? "",
      welcomeMessage:
        defaultValues?.welcomeMessage ?? "Thanks for visiting! We'd love your feedback.",
      categories: defaultValues?.categories?.length
        ? defaultValues.categories
        : DEFAULT_CATEGORIES,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "categories",
  });

  const watched = useWatch({ control: form.control });
  const [previewScreen, setPreviewScreen] = useState<"stars" | "chips">("stars");

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await upsertFormConfig(values);
      if (result.success) {
        toast.success("Configuration saved.");
        form.reset(values);
      } else {
        toast.error(result.error ?? "Failed to save. Please try again.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10">
        <div className="space-y-6 self-start">
        {/* Branding */}
        <div onFocus={() => setPreviewScreen("stars")}>
          <p className="text-sm font-medium text-foreground mb-3">Branding</p>
          <Card>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="brandColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={field.value}
                          onChange={field.onChange}
                          className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
                        />
                        <Input {...field} placeholder="#2563EB" className="font-mono" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} placeholder="https://example.com/logo.png" className={field.value ? "pr-8" : ""} />
                        {field.value && (
                          <button
                            type="button"
                            onClick={() => field.onChange("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Clear logo URL"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>Paste a publicly accessible image URL.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="welcomeMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome Message</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Thanks for visiting! We'd love your feedback." />
                  </FormControl>
                  <FormDescription>Displayed at the top of the customer feedback form.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <div className="space-y-3" onFocus={() => setPreviewScreen("chips")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Feedback Categories</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Up to 3 categories. Each appears as a tab in the customer form.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={fields.length >= 3}
              onClick={() =>
                append({ name: "", positiveChips: [], negativeChips: [] })
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Category
            </Button>
          </div>

          {form.formState.errors.categories?.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.categories.root.message}
            </p>
          )}

          {fields.map((field, index) => (
            <Card key={field.id} className="border-border/60">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <FormField
                  control={form.control}
                  name={`categories.${index}.name`}
                  render={({ field: nameField }) => (
                    <FormItem className="flex-1 mr-3">
                      <FormControl>
                        <Input
                          {...nameField}
                          placeholder={`Category ${index + 1} name (e.g. Kitchen)`}
                          className="text-sm font-medium h-8"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => remove(index)}
                    aria-label={`Remove category ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <FormField
                  control={form.control}
                  name={`categories.${index}.positiveChips`}
                  render={({ field: chipsField }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Positive chips</FormLabel>
                      <FormControl>
                        <ChipInput
                          chips={chipsField.value}
                          onChange={chipsField.onChange}
                          placeholder="Type and press Enter…"
                          chipClass="bg-chart-3/15 text-chart-5 dark:text-chart-2"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Shown when customer gives 4–5 stars.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`categories.${index}.negativeChips`}
                  render={({ field: chipsField }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Negative chips</FormLabel>
                      <FormControl>
                        <ChipInput
                          chips={chipsField.value}
                          onChange={chipsField.onChange}
                          placeholder="Type and press Enter…"
                          chipClass="bg-destructive/15 text-destructive"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Shown when customer gives 1–3 stars.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !form.formState.isDirty}
            onClick={() => form.reset()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Saving…" : "Save Configuration"}
          </Button>
        </div>
        </div> {/* end left col */}
        {/* Live preview — right column stretches full grid height so sticky can travel */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <FormPreview
              brandColor={watched.brandColor ?? "#2563EB"}
              logoUrl={watched.logoUrl ?? ""}
              welcomeMessage={watched.welcomeMessage ?? ""}
              categories={(watched.categories ?? []) as { name: string; positiveChips: string[]; negativeChips: string[] }[]}
              screen={previewScreen}
              onScreenChange={setPreviewScreen}
            />
          </div>
        </div>
        </div> {/* end grid */}
      </form>
    </Form>
  );
}

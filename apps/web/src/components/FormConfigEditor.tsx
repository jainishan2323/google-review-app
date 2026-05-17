"use client";

import { useState, useTransition, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upsertFormConfig } from "@/actions/upsertFormConfig";

const schema = z.object({
  businessId: z.string().min(1),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  welcomeMessage: z.string().min(1, "Required").max(200),
  positiveChips: z.array(z.string().min(1)).min(1, "Add at least one"),
  negativeChips: z.array(z.string().min(1)).min(1, "Add at least one"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  businessId: string;
  defaultValues?: Partial<FormValues>;
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

  const removeChip = (index: number) => {
    onChange(chips.filter((_, i) => i !== index));
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
            onClick={() => removeChip(i)}
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
      positiveChips: defaultValues?.positiveChips ?? [
        "Great Service",
        "Clean Environment",
        "Friendly Staff",
        "Highly Recommend",
      ],
      negativeChips: defaultValues?.negativeChips ?? [
        "Long Wait",
        "Poor Communication",
        "Needs Improvement",
        "Unprofessional",
      ],
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await upsertFormConfig(values);
      if (result.success) {
        toast.success("Form configuration saved.");
      } else {
        toast.error(result.error ?? "Failed to save.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                        <Input
                          {...field}
                          placeholder="#2563EB"
                          className="font-mono"
                        />
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
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <div>
                        <Input
                          {...field}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Optional. Paste a publicly accessible image URL.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Form Content</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="welcomeMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome Message</FormLabel>
                  <FormControl>
                    <div>
                      <Input {...field} placeholder="Thanks for visiting! We'd love your feedback." />
                    </div>
                  </FormControl>
                  <FormDescription>Displayed at the top of the customer feedback form.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Chips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Feedback Chips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="positiveChips"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Positive Chips</FormLabel>
                  <FormControl>
                    <div>
                      <ChipInput
                        chips={field.value}
                        onChange={field.onChange}
                        placeholder="Type and press Enter…"
                        chipClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Shown when customer gives 4–5 stars.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="negativeChips"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Negative Chips</FormLabel>
                  <FormControl>
                    <div>
                      <ChipInput
                        chips={field.value}
                        onChange={field.onChange}
                        placeholder="Type and press Enter…"
                        chipClass="bg-red-500/15 text-red-600 dark:text-red-400"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Shown when customer gives 1–3 stars.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Saving…" : "Save Configuration"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

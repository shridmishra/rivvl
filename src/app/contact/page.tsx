"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    company_name: "",
    phone: "",
    num_locations: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("contact_submissions")
        .insert({
          full_name: form.full_name,
          email: form.email,
          company_name: form.company_name,
          phone: form.phone || null,
          num_locations: form.num_locations || null,
          message: form.message,
        });

      if (dbError) {
        throw new Error(dbError.message);
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-morphism p-10 rounded-[2.5rem] text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <CheckCircle2 className="h-10 w-10 text-black dark:text-white" />
          </div>
          <h1 className="mt-8 text-3xl font-black tracking-tight text-black dark:text-white">
            Thank you!
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 font-medium">
            We&apos;ll be in touch within 24 hours.
          </p>
          <Button 
            onClick={() => window.location.href = "/"}
            className="mt-10 rounded-full px-8 py-3 bg-black text-white dark:bg-white dark:text-black font-bold"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const inputClass =
    "mt-1 block w-full rounded-2xl border border-border bg-white/50 px-4 py-3 text-sm font-bold shadow-sm transition-all focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 focus:outline-none placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-black/50 dark:focus:border-white dark:focus:ring-white/5";

  return (
    <div className="min-h-screen bg-mesh-gradient py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl text-black dark:text-white">
            Contact Us
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-600 dark:text-zinc-400 font-medium">
            Interested in rivvl Enterprise? Let&apos;s talk about a plan that fits
            your business.
          </p>
        </div>

        <div className="glass-morphism p-8 sm:p-12 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-black text-black/70 dark:text-white/70 mb-2 uppercase tracking-widest text-[10px]"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={form.full_name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-black text-black/70 dark:text-white/70 mb-2 uppercase tracking-widest text-[10px]"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              {/* Phone (optional) */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-black text-black/70 dark:text-white/70 mb-2 uppercase tracking-widest text-[10px]"
                >
                  Phone <span className="text-zinc-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label
                htmlFor="company_name"
                className="block text-sm font-black text-black/70 dark:text-white/70 mb-2 uppercase tracking-widest text-[10px]"
              >
                Company / Dealership Name <span className="text-red-500">*</span>
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                required
                value={form.company_name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Number of locations */}
            <div>
              <label
                htmlFor="num_locations"
                className="block text-sm font-black text-black/70 dark:text-white/70 mb-2 uppercase tracking-widest text-[10px]"
              >
                Number of Locations / Users
              </label>
              <select
                id="num_locations"
                name="num_locations"
                value={form.num_locations}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select...</option>
                <option value="1-5">1-5</option>
                <option value="6-20">6-20</option>
                <option value="21-50">21-50</option>
                <option value="50+">50+</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-black text-black/70 dark:text-white/70 mb-2 uppercase tracking-widest text-[10px]"
              >
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                value={form.message}
                onChange={handleChange}
                className={`${inputClass} resize-none`}
                placeholder="Tell us about your needs..."
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm font-bold text-red-500">{error}</p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              loading={submitting}
              loadingText="Sending..."
              className="w-full h-14 rounded-2xl text-base font-black bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-all active:scale-[0.98] shadow-xl"
            >
              {!submitting && <Send className="mr-2 h-4 w-4" />}
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-indigo-950 dark:text-gray-100">
          Thank you!
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-gray-400">
          We&apos;ll be in touch within 24 hours.
        </p>
      </div>
    );
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-[#1E1E30] dark:text-gray-100 dark:placeholder:text-gray-500";

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="gradient-text">Contact Us</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-slate-600 dark:text-gray-400">
          Interested in rivvl Enterprise? Let&apos;s talk about a plan that fits
          your business.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-12 space-y-6">
        {/* Full Name */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-slate-700 dark:text-gray-300"
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

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-gray-300"
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

        {/* Company Name */}
        <div>
          <label
            htmlFor="company_name"
            className="block text-sm font-medium text-slate-700 dark:text-gray-300"
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

        {/* Phone (optional) */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700 dark:text-gray-300"
          >
            Phone Number{" "}
            <span className="text-slate-400 font-normal dark:text-gray-500">(optional)</span>
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

        {/* Number of locations */}
        <div>
          <label
            htmlFor="num_locations"
            className="block text-sm font-medium text-slate-700 dark:text-gray-300"
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
            className="block text-sm font-medium text-slate-700 dark:text-gray-300"
          >
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={form.message}
            onChange={handleChange}
            className={`${inputClass} resize-y`}
            placeholder="Tell us about your needs..."
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="gradient-bg-hover inline-flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}

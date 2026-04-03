"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Car,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ShieldAlert,
  Quote,
  Users,
  Search,
  FileText,
  Sparkles,
  BadgeCheck,
  Zap,
  BarChart3,
  FileSearch,
  Compass,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Linkedin,
  Twitter,
} from "lucide-react";
import { useTheme } from "next-themes";
import { GuitarString } from "@/components/guitar-string";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const faqs = [
  {
    question: "What is rivvl?",
    answer:
      "rivvl is an intelligent comparison platform for two of the biggest purchases you will make: vehicles and real estate. You paste in listing URLs or enter details, and rivvl generates a structured report using government data, real listing information, and intelligent analysis to help you make a confident decision.",
  },
  {
    question: "How is rivvl different from Carfax or Zillow?",
    answer:
      "Those tools show you data about one property or vehicle at a time. rivvl compares multiple options side by side and tells you which one is the better choice based on your preferences, budget, and verified data. It also layers in risk data, government sources, and intelligently generated insights that listing sites do not provide.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. rivvl uses Supabase with row-level security, meaning your reports and personal data are only accessible to your account. Payments are processed entirely through Stripe and rivvl never stores your card details.",
  },
  {
    question: "Do I need to create an account to use rivvl?",
    answer:
      "You can view a basic comparison without an account. To save your report or access the full paid report, you will need to sign up. It takes under a minute.",
  },
  {
    question: "What does the free version include?",
    answer:
      "The free tier gives you a basic comparison with scores, key facts, and a limited set of sections so you can see how rivvl works before deciding to upgrade. Full analysis, recommendations, and all data sections are included in paid reports.",
  },
  {
    question: "How does rivvl get its data?",
    answer:
      "rivvl pulls data from government APIs including NHTSA, EPA, FEMA, USGS, FBI, and Census sources. Listing data is retrieved directly from the listing URL you provide. Intelligent analysis is layered on top to synthesize everything into a clear recommendation. See our data sources page for full details.",
  },
  {
    question: "Can I compare more than two properties or vehicles?",
    answer:
      "Yes. Depending on your plan, you can compare up to 3 or 4 properties or vehicles at once in a single report.",
  },
  {
    question: "What if I am not happy with my report?",
    answer:
      "Contact us at support@rivvl.ai and we will make it right. Data accuracy is our top priority, and we stand behind the quality of every report.",
  },
];

const testimonials = [
  {
    quote: "Rivvl turned our complex home-buying journey into a truly seamless experience. From the initial search to the final paperwork, their team was incredibly supportive, knowledgeable, and always one step ahead of the market.",
    author: "Sarah J.",
    role: "Real Estate Investor",
    image: "/images/testimonials/sarah.png"
  },
  {
    quote: "Finding a vehicle with a clean history and fair valuation was impossible until I used Rivvl. Their detailed reports gave me the absolute confidence I needed to move forward with my dream vintage Porsche purchase.",
    author: "Mark T.",
    role: "Car Enthusiast",
    image: "/images/testimonials/mark.png"
  },
  {
    quote: "As a professional property manager, I need accurate market data delivered fast. Rivvl has become my secret weapon for uncovering hidden risks and validating complex valuation trends in just a few seconds.",
    author: "Elena R.",
    role: "Property Manager",
    image: "/images/testimonials/elena.png"
  },
];

const services = [
  {
    title: "Verified Data",
    description: "Official government API and listing data provided for complete peace of mind.",
    icon: <BadgeCheck className="h-12 w-12 text-black" />,
  },
  {
    title: "Intelligent Analysis",
    description: "Spot hidden risks with personalized insights before they become problems.",
    icon: <Zap className="h-12 w-12 text-black" />,
  },
  {
    title: "Market Comparison",
    description: "Comprehensive side-by-side analysis, including historical trends and growth.",
    icon: <BarChart3 className="h-12 w-12 text-black" />,
  },
  {
    title: "Detailed Reports",
    description: "In-depth comparison reports covering everything from risks to history.",
    icon: <FileSearch className="h-12 w-12 text-black" />,
  },
  {
    title: "Unified Search",
    description: "Compare listings from any major platform in a single view.",
    icon: <Search className="h-12 w-12 text-black" />,
  },
  {
    title: "Risk Mitigation",
    description: "Maximize long-term value through detailed historical analysis.",
    icon: <Compass className="h-12 w-12 text-black" />,
  },
];

const howItWorksSteps = [
  {
    title: "Paste Your Links",
    description: "Drop in listing URLs from any major site—Zillow, Redfin, or Cars.com—into rivvl.",
    icon: <Search className="h-8 w-8 text-black" />,
  },
  {
    title: "We Analyze",
    description: "Our engine parses 10+ data layers and official records to synthesize the best insights.",
    icon: <Users className="h-8 w-8 text-black" />,
  },
  {
    title: "Get Your Report",
    description: "Receive your definitive comparison report with clear buy/avoid recommendations.",
    icon: <FileText className="h-8 w-8 text-black" />,
  },
  {
    title: "Make Confident Decisions",
    description: "Use our data-backed recommendations to finalize your purchase with total peace of mind.",
    icon: <ShieldCheck className="h-8 w-8 text-black" />,
  },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { setTheme } = useTheme();

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const timer = setInterval(nextTestimonial, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Testimonial Animation
    gsap.fromTo(".testimonial-content", 
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
    );
  }, [currentTestimonial]);

  // Force light mode on landing page
  useEffect(() => {
    setTheme("light");

    const ctx = gsap.context(() => {
      // Pin Hero section while About section overlaps it
      ScrollTrigger.create({
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        pin: true,
        pinSpacing: false,
        scrub: true,
      });

      // Hero background parallax
      gsap.to(".hero-section .hero-bg", {
        y: "30%", // Move it partially as we scroll
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: true,
        }
      });

      // Reveal animation for the About section (overlap effect)
      gsap.from(".about-section", {
        scrollTrigger: {
          trigger: ".about-section",
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
        y: 100,
      });

      // Text scrubbing for the heading
      const words = gsap.utils.toArray(".about-heading .word");
      gsap.fromTo(words, 
        { opacity: 0.1, color: "rgba(0,0,0,0.1)" },
        {
          opacity: 1,
          color: "rgba(0,0,0,1)",
          stagger: 0.5,
          ease: "power2.out",
          duration:2,
          scrollTrigger: {
            trigger: ".about-heading",
            start: "top 80%",
            end: "bottom 40%",
            scrub: true,
          }
        }
      );

      // Number counter animation for stats
      const stats = gsap.utils.toArray(".stat-value");
      stats.forEach((stat: any) => {
        const value = stat.getAttribute("data-value");
        const numeric = parseFloat(value);
        const suffix = value.replace(/[0-9.]/g, "");
        
        const obj = { count: 0 };
        gsap.to(obj, {
          count: numeric,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: stat,
            start: "top 90%",
            toggleActions: "play none none none",
          },
          onUpdate: () => {
            stat.innerText = Math.floor(obj.count) + suffix;
          }
        });
      });

      // Icon flip animation on scroll
      gsap.fromTo(".service-icon-container", 
        { rotateY: 180, opacity: 0, scale: 0.5 },
        {
          rotateY: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          stagger: 0.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".expert-services-grid",
            start: "top 80%",
            toggleActions: "restart none none restart",
          }
        }
      );

      // Interactive hover flip using GSAP for consistency
      const icons = gsap.utils.toArray(".service-icon-container");
      icons.forEach((icon: any) => {
        icon.parentElement.addEventListener("mouseenter", () => {
          gsap.to(icon, { rotateY: 360, duration: 0.6, ease: "power2.out" });
        });
        icon.parentElement.addEventListener("mouseleave", () => {
          gsap.to(icon, { rotateY: 0, duration: 0.6, ease: "power2.out" });
        });
      });

      // How It Works Cards Animation
      const cards = gsap.utils.toArray(".work-card");
      cards.forEach((card: any, i: number) => {
        if (i > 0) {
          gsap.from(card, {
            y: 400,
          
            scrollTrigger: {
              trigger: card,
              start: "top 95%",
              end: "top 30%",
              scrub: true,
            }
          });
        }
      });

      // Solutions Entrance Animation
      gsap.from(".solutions-card", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".solutions-grid",
          start: "top 85%",
        }
      });

      // FAQ Entrance
      gsap.from(".faq-header", {
        x: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".faq-section",
          start: "top 80%",
        }
      });

      gsap.from(".faq-item", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".faq-section",
          start: "top 70%",
        }
      });

      // Final CTA Entrance
      gsap.from(".cta-heading", {
        y: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".cta-section",
          start: "top 95%", // Fire as soon as it's almost in view
        }
      });

      gsap.from(".cta-button", {
        y: 20,
        duration: 1,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".cta-section",
          start: "top 95%",
        }
      });

      // Footer Reveal
      gsap.from(".footer-column", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".footer-section",
          start: "top bottom", // Fire immediately when footer hits bottom
        }
      });

      // Testimonial Nav Hover scaling
      const navButtons = gsap.utils.toArray(".testimonial-nav-btn");
      navButtons.forEach((btn: any) => {
        btn.addEventListener("mouseenter", () => {
          gsap.to(btn, { scale: 1.1, duration: 0.3, ease: "power2.out" });
        });
        btn.addEventListener("mouseleave", () => {
          gsap.to(btn, { scale: 1, duration: 0.3, ease: "power2.out" });
        });
      });
    });

    // Refresh ScrollTrigger to account for any layout shifts
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [setTheme]);

  return (
    <div className="flex flex-col bg-background">
      {/* ─── 1. HERO SECTION (RELATORA STYLE) ─── */}
      <section className="hero-section relative h-[100vh] w-full overflow-hidden flex flex-col justify-end bg-black">
        {/* Background Image */}
        <div className="hero-bg absolute inset-0 z-0 text-black">
          <Image
            src="/images/hero.png"
            alt="Hero Background"
            fill
            className="object-cover scale-110" // Initial scale for smoother parallax
            priority
            quality={100}
            unoptimized
          />
          <div className="absolute inset-0 bg-black/20" /> {/* Added subtle overlay for depth */}
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-24 pb-12">
          {/* Main Heading */}
          <div className="mb-12">
            <h1 className="text-white text-6xl sm:text-7xl md:text-8xl font-medium max-w-5xl leading-[1] tracking-tighter">
              Compare Any Vehicle <br className="hidden sm:block" />
              or Real Estate
            </h1>
          </div>

          {/* Separator line with guitar string animation */}
          <div className="w-full mb-10 overflow-visible">
            <GuitarString />
          </div>

          {/* Sub-info Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-white/90 text-lg font-medium mb-8">
            <div className="flex items-center gap-2">
              <span>Intelligent Comparison Reports</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Join 10k+ confident buyers</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. ABOUT RIVVL SECTION (RELATORA OVERLAP STYLE) ─── */}
      <section className="about-section relative z-20 bg-background pt-20 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 lg:px-24">
        <div className="mx-auto max-w-8xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 mb-20 sm:mb-32">
            {/* Left Label */}
            <div className="lg:col-span-3 lg:pl-24">
              <span className="text-lg sm:text-xl font-medium text-foreground tracking-tight">About Rivvl</span>
            </div>

            {/* Main About Content */}
            <div className="lg:col-span-9 max-w-5xl">
              <h2 className="about-heading text-black text-3xl sm:text-5xl md:text-5xl font-medium leading-[1.1] tracking-tighter mb-8 sm:mb-12">
                {"Rivvl is an intelligent comparison platform built to connect serious buyers, sellers, and investors with properties and vehicles."
                  .split(" ")
                  .map((word, i) => (
                    <span key={i} className="word mr-2 inline-block">
                      {word}
                    </span>
                  ))}
              </h2>
              <p className="text-black/80 text-base sm:text-lg font-normal max-w-3xl leading-relaxed ">
                With a strong presence in competitive markets, our team of experienced advisors understands that real estate and automotive purchases are more than transactions — they are long-term investments and life decisions. That is why we focus on transparency, accuracy, and tailored solutions for every client.
              </p>
            </div>
          </div>

          {/* Stats Section with Divider Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  gap-y-12 lg:gap-y-0">
            {[
              { label: "Scans Completed", value: "50K+" },
              { label: "Official Data Sources", value: "100+" },
              { label: "Active Users", value: "15K+" },
              { label: "Decision Confidence", value: "98%" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-start px-4 sm:px-8 lg:pl-24 ${
                  idx === 0 ? "lg:pl-0" : "lg:border-l border-black/10"
                } ${
                  idx % 2 !== 0 ? "sm:border-l sm:border-black/60 lg:border-l" : ""
                } ${
                  idx === 2 ? "lg:border-l border-black/60" : ""
                }`}
              >
                <div 
                  className="stat-value text-5xl sm:text-6xl font-medium tracking-tighter mb-4 sm:mb-6 text-black"
                  data-value={stat.value}
                >
                  0
                </div>
                <div className="text-base sm:text-lg font-medium text-black/80 tracking-tight uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2.2 EXPERT SERVICES SECTION (RELATORA STYLE) ─── */}
      <section className="expert-services-section relative z-20 bg-background pt-20 pb-24 sm:pt-32 sm:pb-48 px-4 sm:px-6 lg:px-48">
        <div className="mx-auto max-w-8xl">
          <div className="mb-16 sm:mb-24">
            <h2 className="text-black text-4xl sm:text-5xl font-medium leading-[1.1] tracking-tighter mb-6">
              Our Expert Services
            </h2>
            <p className="text-black/80 text-base sm:text-lg max-w-2xl leading-relaxed">
              Simplified vehicle and property research designed to help <br className="hidden sm:block" /> you make informed decisions.
            </p>
          </div>

          <div className="expert-services-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
            {services.map((service, idx) => (
              <div key={idx} className="flex flex-col items-start max-w-sm group cursor-default">
                <div className="service-icon-container mb-8">
                  {service.icon}
                </div>
                <h3 className="text-black text-2xl font-medium tracking-tight mb-4">
                  {service.title}
                </h3>
                <p className="text-black/80 text-lg leading-relaxed font-normal">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2.3 HOW WE WORK SECTION (STACKING CARDS) ─── */}
      <section className="how-we-work-section relative z-20 bg-[#0a0a0b] py-20 sm:py-32 px-4 sm:px-6 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 sm:gap-24 font-normal">
            {/* Left Column: Sticky Header */}
            <div className="lg:sticky lg:top-32 lg:h-fit">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-white text-4xl sm:text-6xl font-medium tracking-tighter leading-[1.1]">
                  How We Work
                </h2>
              </div>
              <p className="text-white/80 text-lg sm:text-xl max-w-sm leading-relaxed mt-4 sm:mt-8">
                A structured approach to seamless vehicle and property transactions.
              </p>
            </div>

            {/* Right Column: Stacking Cards */}
            <div className="flex flex-col gap-8 lg:gap-24">
              {howItWorksSteps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`work-card sticky top-32 bg-white p-8 sm:p-12 shadow-2xl min-h-[300px] sm:min-h-[350px] max-w-lg flex flex-col justify-between border border-white/10`}
                  style={{ zIndex: idx + 1 }}
                >
                  <div>
                    <div className="mb-8 overflow-hidden">
                      <h3 className="text-black text-2xl sm:text-4xl font-medium tracking-tight mb-4 sm:mb-8">
                        {step.title}
                      </h3>
                      <p className="text-black/80 text-base sm:text-xl leading-relaxed font-normal max-w-xl">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border border-black/10 flex items-center justify-center">
                      {step.icon}
                    </div>
                    <span className="text-black/20 text-2xl sm:text-3xl font-medium">0{idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ─── 4. SOLUTIONS TRACKS ─── */}
      <section className="solutions-section relative z-20 bg-background py-20 sm:py-32 px-4 sm:px-6 lg:px-24 border-t border-black/5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 sm:mb-24">
            <h2 className="text-black text-4xl sm:text-6xl font-medium tracking-tighter leading-[1.1] max-w-4xl">
              Everything You Need <br className="hidden sm:block" />To Decide
            </h2>
          </div>

          <div className="solutions-grid grid grid-cols-1 lg:grid-cols-2 gap-x-56 gap-y-32">
            {/* Real Estate card */}
            <div className="solutions-card flex flex-col items-start">
              <div className="h-16 w-16 mb-10 flex items-center justify-center bg-black text-white rounded-none">
                <Home className="h-8 w-8" />
              </div>
              <h3 className="text-black text-4xl font-medium tracking-tight mb-8">
                Real Estate Analysis
              </h3>
              <p className="text-black/80 text-xl leading-relaxed mb-12 max-w-lg">
                Deep-dive audit into property risks, community safety metrics using official data.
              </p>
              <ul className="space-y-6 mb-12">
                {[
                  "Hazard & Climate Risks",
                  "Verified Crime Data",
                  "School Performance Metrics",
                  "Valuation Trends",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-4 text-lg font-normal text-black/90">
                    <Check className="h-5 w-5 text-black" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/compare/homes" className="inline-flex items-center text-lg font-medium text-black group border-b-2 border-black/10 pb-1 hover:border-black transition-all">
                Start Home Comparison <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Vehicle Intelligence card */}
            <div className="solutions-card flex flex-col items-start px-0 sm:px-0">
              <div className="h-16 w-16 mb-10 flex items-center justify-center bg-black text-white rounded-none">
                <Car className="h-8 w-8" />
              </div>
              <h3 className="text-black text-4xl font-medium tracking-tight mb-8">
                Vehicle Intelligence
              </h3>
              <p className="text-black/80 text-xl leading-relaxed mb-12 max-w-lg">
                Safety-first comparison tool analyzing recalls, crashes and total cost forecasts.
              </p>
              <ul className="space-y-6 mb-12">
                {[
                  "Safety & Crash Scores",
                  "Full Recall Database",
                  "Real-world Efficiency",
                  "Total Cost Forecast",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-4 text-lg font-normal text-black/90">
                    <Check className="h-5 w-5 text-black" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/compare" className="inline-flex items-center text-lg font-medium text-black group border-b-2 border-black/10 pb-1 hover:border-black transition-all">
                Start Vehicle Analysis <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. TESTIMONIALS ─── */}
      <section className="px-4 py-20 sm:py-32 bg-white relative overflow-hidden">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-32 items-start">
            {/* Left Column: Header & Client Info */}
            <div className="flex flex-col h-full">
              <div className="mb-12 sm:mb-20">
                <h2 className="text-black text-4xl sm:text-[56px] font-medium tracking-tighter leading-[1.05] mb-6 sm:mb-8">
                  What Our Clients<br />Say About Us
                </h2>
                <p className="text-black/60 text-base sm:text-lg max-w-xl leading-relaxed">
                  Rivvl is committed to delivering seamless experiences for buyers and investors.
                </p>
              </div>

              <div className="testimonial-content mt-auto">
                <div className="relative aspect-square w-full sm:w-[320px] bg-secondary overflow-hidden mb-6 sm:mb-8">
                  <img 
                    src={testimonials[currentTestimonial].image} 
                    alt={testimonials[currentTestimonial].author}
                    className="h-full w-full object-cover transition-all duration-700" 
                  />
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-medium text-black tracking-tight">{testimonials[currentTestimonial].author}</h4>
                  <p className="text-black/60 text-sm sm:text-base font-normal">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Quote & Navigation */}
            <div className="pt-10 lg:pt-48 flex flex-col justify-between min-h-fit sm:min-h-[500px]">
              <div className="flex justify-end gap-2 mb-12 sm:mb-20">
                <button 
                  onClick={prevTestimonial}
                  className="testimonial-nav-btn h-11 w-11 rounded-lg bg-[#222] text-white flex items-center justify-center hover:bg-black transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={nextTestimonial}
                  className="testimonial-nav-btn h-11 w-11 rounded-lg bg-[#222] text-white flex items-center justify-center hover:bg-black transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="testimonial-content lg:pl-12">
                <p className="text-black text-2xl sm:text-4xl font-medium leading-[1.25] tracking-tight">
                  "{testimonials[currentTestimonial].quote}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section relative z-20 bg-black py-20 sm:py-48 px-4 sm:px-6 lg:px-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl text-white">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-12 sm:gap-32 items-start">
            {/* Left Column: Header */}
            <div className="faq-header lg:sticky lg:top-32 lg:h-fit">
              <h2 className="text-white text-3xl sm:text-6xl font-medium tracking-tighter leading-[1.1] mb-6 sm:mb-8">
                Frequently<br />Asked<br />Questions
              </h2>
              <p className="text-white/60 text-lg sm:text-xl max-w-sm leading-relaxed">
                Everything you need to know about our data sources, platform, and pricing.
              </p>
            </div>

            {/* Right Column: Accordion */}
            <div className="divide-y divide-white/10 border-t border-white/10">
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item group">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between py-6 sm:py-10 text-left transition-all"
                  >
                    <span className="text-lg sm:text-2xl lg:text-3xl font-medium text-white tracking-tight hover:opacity-70 transition-all max-w-2xl">
                      {faq.question}
                    </span>
                    <ChevronDown className={`h-6 w-6 sm:h-8 sm:w-8 text-white/20 transition-transform duration-500 ${openFaq === index ? "rotate-180 text-white/80" : ""}`} />
                  </button>
                  <div 
                    className="overflow-hidden transition-all duration-500 ease-in-out" 
                    style={{ maxHeight: openFaq === index ? "500px" : "0px" }}
                  >
                    <p className="pb-8 sm:pb-10 text-white/60 font-normal text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. FINAL CTA ─── */}
      <section className="cta-section px-4 py-24 sm:py-48 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02),transparent_70%)]" />
        <div className="mx-auto max-w-6xl text-center relative z-10">
          <h2 className="cta-heading text-black text-3xl sm:text-7xl font-medium leading-[1.05] tracking-tighter mb-12 sm:mb-16 max-w-5xl mx-auto">
            The biggest purchase of your life deserves algorithmic certainty.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <Link
              href="/homes"
              className="cta-button w-full sm:w-auto inline-flex items-center justify-center rounded-none bg-black px-8 py-4 sm:px-12 sm:py-6 text-base sm:text-lg font-medium text-white shadow-2xl hover:bg-neutral-800 transition-all"
            >
              Get Home Report
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/vehicles"
              className="cta-button w-full sm:w-auto inline-flex items-center justify-center rounded-none border border-black/20 bg-neutral-50 px-8 py-4 sm:px-12 sm:py-6 text-base sm:text-lg font-medium text-black hover:bg-black hover:text-white transition-all shadow-sm"
            >
              Get Vehicle Report
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 9. FOOTER ─── */}
      <footer className="footer-section relative z-20 bg-[#0a0a0b] py-16 sm:py-32 px-4 sm:px-6 lg:px-24 text-white">
        <div className="mx-auto max-w-8xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 sm:gap-24 mb-16 sm:mb-32">
            <div className="footer-column">
              <div className="text-white text-3xl sm:text-4xl font-medium tracking-tighter mb-8 sm:mb-10">rivvl.ai</div>
              <p className="text-white/60 text-base sm:text-lg font-normal max-w-sm leading-relaxed mb-8 sm:mb-12">
                Empowering individuals through algorithmic certainty in real estate and automotive acquisitions.
              </p>
              <div className="flex items-center gap-6">
                <Link href="#" className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link href="#" className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Linkedin className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="footer-column">
              <h4 className="text-white text-lg sm:text-xl font-medium tracking-tight mb-6 sm:mb-10">Platform</h4>
              <nav className="flex flex-col gap-4 sm:gap-6 text-base sm:text-lg font-normal text-white/60">
                <Link href="/homes" className="hover:text-white transition-colors">Home Reports</Link>
                <Link href="/vehicles" className="hover:text-white transition-colors">Vehicle Reports</Link>
                <Link href="/pricing" className="hover:text-white transition-colors">Pricing & Plans</Link>
              </nav>
            </div>

            <div className="footer-column">
              <h4 className="text-white text-lg sm:text-xl font-medium tracking-tight mb-6 sm:mb-10">Global</h4>
              <nav className="flex flex-col gap-4 sm:gap-6 text-base sm:text-lg font-normal text-white/60">
                <Link href="/contact" className="hover:text-white transition-colors">Contact Advisor</Link>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </nav>
            </div>

            <div className="footer-column">
              <h4 className="text-white text-lg sm:text-xl font-medium tracking-tight mb-6 sm:mb-10">Connect</h4>
              <nav className="flex flex-col gap-4 sm:gap-6 text-base sm:text-lg font-normal text-white/60">
                <Link href="#" className="hover:text-white transition-colors">Twitter (X)</Link>
                <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
                <Link href="mailto:hello@rivvl.com" className="hover:text-white transition-colors">Email Us</Link>
              </nav>
            </div>
          </div>
          <div className="pt-10 sm:pt-16 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 text-xs sm:text-sm font-normal text-white/40">
            <div className="text-center md:text-left">&copy; {new Date().getFullYear()} rivvl archive. all rights reserved.</div>
            <div className="flex gap-8 sm:gap-12">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

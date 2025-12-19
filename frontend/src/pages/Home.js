import React, { useEffect, useMemo, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import AnimatedButton from "../components/AnimatedButton";
import Loader from "../components/Loader";
import Button53 from "../components/Button53";
import "../styles/DesignSystem.css";

const experienceModes = [
  {
    id: "clubs",
    label: "Club intelligence",
    blurb: "Map club resonance, membership depth, and AI-ranked vitality signals.",
  },
  {
    id: "events",
    label: "Event spectrum",
    blurb: "Visualise cross-campus events with instant participation readiness scores.",
  },
  {
    id: "design",
    label: "Poster design flow",
    blurb: "Launch Canva-ready templates with live brand guards and auto-publishing.",
  },
];

const viewModes = [
  { id: "grid", label: "Holo grid" },
  { id: "list", label: "Signal stream" },
];

const featureZones = [
  {
    id: "leaders",
    title: "Leader dashboards",
    description: "Scenario planning, RSVPs, and QR telemetry in one adaptive cockpit.",
    actionLabel: "Launch control",
    href: "/leader",
  },
  {
    id: "events",
    title: "Event creation",
    description: "Guided workflows with AI checks for wording, compliance, and capacity.",
    actionLabel: "Create event",
    href: "/leader/create",
  },
  {
    id: "poster",
    title: "Poster studio",
    description: "Deep Canva integration with smart layers, presets, and auto-publish.",
    actionLabel: "Open studio",
    href: "/leader",
  },
  {
    id: "analytics",
    title: "Performance analytics",
    description: "Decision-grade dashboards across roles, permissions, and clusters.",
    actionLabel: "View analytics",
    href: "/university",
  },
];

export default function Home() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [experienceMode, setExperienceMode] = useState("clubs");
  const [viewMode, setViewMode] = useState("grid");
  const [spotlightClub, setSpotlightClub] = useState(null);
  const [viewKey, setViewKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchClubs() {
      try {
        const res = await API.get("/api/clubs");
        setClubs(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("❌ Error loading clubs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClubs();
  }, []);

  useEffect(() => {
    if (!spotlightClub && clubs.length > 0) {
      setSpotlightClub(clubs[0]);
    }
  }, [clubs, spotlightClub]);

  const categories = useMemo(() => {
    const unique = new Set();
    clubs.forEach((club) => {
      if (club.category) unique.add(club.category);
    });
    return ["all", ...Array.from(unique)];
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      const matchesCategory =
        categoryFilter === "all" ||
        (club.category || "").toLowerCase() === categoryFilter.toLowerCase();
      const matchesSearch =
        club.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        club.description?.toLowerCase().includes(searchValue.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [clubs, categoryFilter, searchValue]);

  const heroMetrics = useMemo(() => {
    return [
      {
        label: "Active clubs",
        value: clubs.length,
        trend: "+12%",
        accent: "Pulse",
      },
      {
        label: "Spotlight ready",
        value: filteredClubs.slice(0, 3).length,
        trend: "Live",
        accent: "Signal",
      },
      {
        label: "Pending posters",
        value: Math.max(0, clubs.length - filteredClubs.length),
        trend: "Sync",
        accent: "Design",
      },
    ];
  }, [clubs.length, filteredClubs]);

  const selectedExperience = experienceModes.find(
    (mode) => mode.id === experienceMode
  );

  const handleViewMode = (mode) => {
    if (mode === viewMode) return;
    setViewMode(mode);
    setViewKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div className="student-card max-w-md w-full ai-slide-fade flex flex-col items-center">
          <Loader text="Loading" className="mb-8" />
          <p className="ds-heading-3 text-white mb-4">
            Calibrating Student Club-Hub Intelligence
          </p>
          <p className="ds-body-large text-slate-300">
            Fetching live clubs, analytics and poster handoffs...
          </p>
        </div>
      </div>
    );
  }

  const rawSelectedIndex = viewModes.findIndex((mode) => mode.id === viewMode);
  const selectedIndex = rawSelectedIndex >= 0 ? rawSelectedIndex : 0;

  return (
    <div className="space-y-16 max-w-7xl mx-auto text-white">
      <section className="ai-module ai-slide-fade space-y-12">
        <div className="flex flex-wrap items-center gap-4">
          <span className="campus-badge">AI-first orchestration</span>
          <span className="glass-bubble glass-bubble--compact">
            <svg className="ds-icon ds-icon-sm text-[#A7B0BB]" fill="currentColor" strokeWidth={2} viewBox="0 0 20 20">
              <path d="M4 3h12l-1 9H5L4 3zm2 12a2 2 0 004 0h2a2 2 0 004 0" />
            </svg>
            Always-on sync
          </span>
        </div>
        <div className="grid lg:grid-cols-2 gap-16">
          <div className="space-y-10">
            <div>
              <p className="ds-caption text-slate-400 mb-6">
                Student Club-Hub 2.0
              </p>
              <h1 className="ds-heading-1 leading-tight mb-8">
                Futuristic club intelligence for{" "}
                <span className="text-[#A7B0BB]">leaders, universities</span>, and
                designers.
              </h1>
            </div>
            <p key={experienceMode} className="ds-body-large text-slate-200 ai-slide-fade">
              {selectedExperience?.blurb}
            </p>
            <div className="flex flex-wrap gap-4">
              {experienceModes.map((mode) => (
                <button
                  key={mode.id}
                  className={`glass-bubble ${experienceMode === mode.id ? "glass-bubble--active" : ""}`}
                  onClick={() => setExperienceMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <Button53 to="/participant" className="variant-purple">
                Launch Participant Suite
              </Button53>
              <Button53 to="/leader" className="variant-blue">
                Leader cockpit
              </Button53>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {heroMetrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`student-card ai-slide-fade ${index === 1 ? "ai-delay-1" : index === 2 ? "ai-delay-2" : ""}`}
              >
                <p className="ds-caption text-slate-400 mb-4">
                  {metric.accent}
                </p>
                <p className="ds-heading-2 mb-3">{metric.value}</p>
                <p className="ds-body text-slate-300 mb-4">{metric.label}</p>
                <p className="ds-body-small text-[#A7B0BB]">{metric.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
        <div className="space-y-8">
          <div className="student-card">
            <div className="flex flex-wrap items-center gap-6 justify-between mb-10">
              <div className="flex flex-wrap gap-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`glass-bubble glass-bubble--compact ${categoryFilter === category ? "glass-bubble--active" : ""}`}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category === "all" ? "All clubs" : category}
                  </button>
                ))}
              </div>
              <div className="glass-segmented"
                style={{
                  "--segments": viewModes.length,
                  "--segment-index": selectedIndex,
                }}
              >
                <span className="glass-segmented__indicator" />
                {viewModes.map((mode) => (
                  <button
                    key={mode.id}
                    className={viewMode === mode.id ? "active" : ""}
                    onClick={() => handleViewMode(mode.id)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-10">
              <input
                className="student-input bg-transparent ds-input ds-input-md"
                placeholder="Search clubs, initiatives, or tags"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>
            <div
              key={viewKey}
              className={`ai-slide-fade ${viewMode === "grid" ? "ds-grid ds-grid-3" : "flex flex-col gap-6"}`}
            >
              {filteredClubs.length === 0 ? (
                <div className="text-center text-slate-300 py-16 col-span-full">
                  <p className="ds-heading-3 mb-4">No clubs match your filters</p>
                  <p className="ds-body-large text-slate-400">
                    Adjust the category or search to discover more communities.
                  </p>
                </div>
              ) : (
                filteredClubs.map((club, index) => (
                  <article
                    key={club.id || `${club.name}-${index}`}
                    className={`student-card ai-slide-fade ${index % 3 === 1 ? "ai-delay-1" : index % 3 === 2 ? "ai-delay-2" : ""} ${viewMode === "list" ? "flex items-center gap-8" : ""}`}
                    onMouseEnter={() => setSpotlightClub(club)}
                    onFocus={() => setSpotlightClub(club)}
                    tabIndex={0}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#36454F]/20 border border-[#36454F]/50 flex items-center justify-center text-[#A7B0BB]">
                      <svg className="ds-icon ds-icon-lg" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v12m6-6H6"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="ds-heading-3">{club.name}</h3>
                        <span className="glass-bubble glass-bubble--compact ds-body-small">
                          {club.category || "Club"}
                        </span>
                      </div>
                      <p className="ds-body text-slate-300 line-clamp-3 mb-6">
                        {club.description || "No description available."}
                      </p>
                      <div className="flex flex-wrap items-center gap-4">
                        <Button53 to="/participant" className="compact variant-green">
                          View events
                        </Button53>
                        <Button53 to="/participant/create-club" className="compact variant-blue">
                          Collaborate
                        </Button53>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="student-card sticky top-24">
            <p className="ds-caption text-slate-400 mb-6">
              Live preview
            </p>
            {spotlightClub ? (
              <div className="space-y-6">
                <h3 className="ds-heading-2">{spotlightClub.name}</h3>
                <p className="ds-body-large text-slate-300">
                  {spotlightClub.description || "This club is synchronised with Student Club-Hub."}
                </p>
                <div className="glass-bubble glass-bubble--compact inline-flex">
                  {spotlightClub.category || "Category pending"}
                </div>
                <Button53 to="/participant/proposals" className="w-full variant-purple">
                  Preview proposal
                </Button53>
              </div>
            ) : (
              <div className="ds-body text-slate-400">
                Hover any card to see its intelligence preview.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="ai-card-grid">
        {featureZones.map((zone) => (
          <article key={zone.id} className="student-card ai-slide-fade">
            <p className="ds-caption text-slate-400 mb-6">
              {zone.title}
            </p>
            <p className="ds-body-large text-slate-200 mb-8">{zone.description}</p>
            <Button53 to={zone.href} className="w-full variant-green">
              {zone.actionLabel}
            </Button53>
          </article>
        ))}
      </section>
    </div>
  );
}

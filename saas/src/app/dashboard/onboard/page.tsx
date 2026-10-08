"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { KmlUploader } from "@/components/wizard/KmlUploader";
import { RadarScanner } from "@/components/wizard/RadarScanner";
import { ScoreCard } from "@/components/wizard/ScoreCard";
import { MiniMap } from "@/components/map/MiniMap";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EnrichedLandData, EnrichmentStepLog, GeoJsonFeature } from "@/types/geospatial";
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Layers,
  Box,
} from "lucide-react";

export default function OnboardingWizardPage() {
  const router = useRouter();

  // Wizard Steps: 1: Input, 2: Scanning, 3: Hydrated Result, 4: Saved
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Inputs
  const [farmName, setFarmName] = useState("Fazenda Buritis (Gleba Central)");
  const [carCode, setCarCode] = useState("MG-3109300-4829A0D7314B4A45A7C49102B94C7192");
  const [matriculaCode, setMatriculaCode] = useState("Matrícula 18.492 - CRI Buritis/MG");
  const [uploadedGeoJson, setUploadedGeoJson] = useState<GeoJsonFeature | null>(null);

  // Enrichment state
  const [enrichmentLogs, setEnrichmentLogs] = useState<EnrichmentStepLog[]>([
    {
      id: "step-1",
      layer: "SICAR",
      title: "Verificando SICAR nacional...",
      detail: "Extraindo limites oficiais, Área Preservação Permanente (APP) e Reserva Legal.",
      status: "processing",
      timestamp: new Date().toISOString(),
    },
    {
      id: "step-2",
      layer: "SIGEF",
      title: "Cruzando malha fundiária SIGEF / INCRA...",
      detail: "Verificando certificação de georreferenciamento e sobreposição com terras públicas.",
      status: "pending",
      timestamp: new Date().toISOString(),
    },
    {
      id: "step-3",
      layer: "IBGE_CPRM",
      title: "Calculando sobreposição de bioma & contexto ambiental...",
      detail: "Determinando zona fitogeográfica (IBGE) e bacia hidrográfica.",
      status: "pending",
      timestamp: new Date().toISOString(),
    },
    {
      id: "step-4",
      layer: "IBAMA",
      title: "Analisando embargos ambientais IBAMA...",
      detail: "Executando ST_Intersects espacial contra o banco georreferenciado de embargos.",
      status: "pending",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [enrichedData, setEnrichedData] = useState<EnrichedLandData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fast Fill Presets for Quick Testing
  const handleSelectPreset = (preset: "buritis_clean" | "sorriso_embargo") => {
    if (preset === "buritis_clean") {
      setFarmName("Fazenda Buritis (Gleba Central)");
      setCarCode("MG-3109300-4829A0D7314B4A45A7C49102B94C7192");
      setMatriculaCode("Matrícula 18.492 - CRI Buritis/MG");
      setUploadedGeoJson(null);
    } else {
      setFarmName("Fazenda Rio Preto (Safra 2026)");
      setCarCode("MT-5107909-6C8E91A0B2C3D4E5F67890123456789A");
      setMatriculaCode("Matrícula 42.104 - CRI Sorriso/MT");
      setUploadedGeoJson(null);
    }
  };

  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleStartEnrichment = async () => {
    setCurrentStep(2);
    setActiveStepIndex(0);
    setEnrichmentError(null);

    try {
      // Trigger API Orchestrator
      const response = await fetch("/api/land/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: farmName,
          car_code: carCode,
          matricula_code: matriculaCode,
          geojson: uploadedGeoJson || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        // Animate radar steps
        setActiveStepIndex(1);
        await new Promise((r) => setTimeout(r, 600));
        setActiveStepIndex(2);
        await new Promise((r) => setTimeout(r, 600));
        setActiveStepIndex(3);
        await new Promise((r) => setTimeout(r, 700));

        setEnrichedData(result.data);
        if (result.steps) {
          setEnrichmentLogs(result.steps);
        }
        setCurrentStep(3);
      } else {
        setEnrichmentError(result.error || "Falha no enriquecimento geoespacial.");
        setCurrentStep(1);
      }
    } catch (err: any) {
      console.error(err);
      setEnrichmentError(err.message || "Erro de conexão ao enriquecer dados.");
      setCurrentStep(1);
    }
  };

  // Step 4: Commit & Save to Supabase
  const handleCommitSave = async () => {
    if (!enrichedData) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/land/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enriched: enrichedData }),
      });

      const res = await response.json();
      if (response.ok && res.success) {
        setCurrentStep(4);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1800);
      } else {
        setSaveError(res.error || "Falha ao salvar o imóvel na base de dados.");
      }
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Erro de conexão ao salvar imóvel.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell noScroll={false}>
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-10">
        {/* Wizard Stepper Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-brand-neon">
                Pipeline de Ingestão & Fusão de Dados
              </span>
              <h1 className="text-2xl font-bold text-foreground font-display">
                Onboarding Territorial & Compliance ESG
              </h1>
            </div>

            {/* Stepper Status Indicators */}
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
              <span
                className={`px-2.5 py-1 rounded ${
                  currentStep === 1
                    ? "bg-brand-neon text-black font-bold shadow-neon"
                    : "bg-surface text-slate-muted"
                }`}
              >
                1. Entrada
              </span>
              <span className="text-slate-muted">&rarr;</span>
              <span
                className={`px-2.5 py-1 rounded ${
                  currentStep === 2
                    ? "bg-brand-neon text-black font-bold shadow-neon animate-pulse"
                    : "bg-surface text-slate-muted"
                }`}
              >
                2. Radar Scanner
              </span>
              <span className="text-slate-muted">&rarr;</span>
              <span
                className={`px-2.5 py-1 rounded ${
                  currentStep === 3
                    ? "bg-brand-neon text-black font-bold shadow-neon"
                    : "bg-surface text-slate-muted"
                }`}
              >
                3. Dossiê & Mini-Map
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: INPUT DATA (CAR, Matrícula, or KML Upload) */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {enrichmentError && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-2 text-xs font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{enrichmentError}</span>
              </div>
            )}

            {/* Quick Demo Test Buttons */}
            <div className="p-3 bg-surface rounded-lg border border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <span className="text-slate-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-neon" />
                Preenchimento Rápido para Demonstração:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset("buritis_clean")}
                  className="px-2.5 py-1 rounded bg-surface-hover hover:bg-surface-border border border-brand-neon/30 text-brand-neon hover:shadow-neon transition-all"
                >
                  Fazenda Buritis (100% Regular)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("sorriso_embargo")}
                  className="px-2.5 py-1 rounded bg-surface-hover hover:bg-surface-border border border-status-embargo/40 text-status-embargo hover:shadow-embargo transition-all"
                >
                  Fazenda Rio Preto (Alerta Embargo)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form Fields */}
              <Card className="space-y-4">
                <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-brand-neon" />
                  Dados Cadastrais do Imóvel
                </h3>

                <div className="space-y-1.5">
                  <label htmlFor="onboard-farm-name" className="text-xs font-mono text-slate-muted">Nome da Propriedade / Gleba:</label>
                  <input
                    id="onboard-farm-name"
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full bg-background border border-surface-border rounded px-3 py-3 sm:py-2 text-base sm:text-xs text-foreground font-mono focus:outline-none focus:border-brand-neon focus-visible:ring-2 focus-visible:ring-brand-neon"
                    placeholder="Ex: Fazenda Buritis"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="onboard-car-code" className="text-xs font-mono text-slate-muted">
                    Código do Cadastro Ambiental Rural (CAR):
                  </label>
                  <input
                    id="onboard-car-code"
                    type="text"
                    value={carCode}
                    onChange={(e) => setCarCode(e.target.value)}
                    className="w-full bg-background border border-surface-border rounded px-3 py-3 sm:py-2 text-base sm:text-xs text-foreground font-mono focus:outline-none focus:border-brand-neon focus-visible:ring-2 focus-visible:ring-brand-neon"
                    placeholder="Ex: MG-3109300-4829A0D7314B4A45A7C49102B94C7192"
                  />
                  <p className="text-xs text-gray-500 font-mono">
                    Usado para consulta federada ao WFS do SICAR nacional.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="onboard-matricula" className="text-xs font-mono text-slate-muted">
                    Matrícula Imobiliária / CRI:
                  </label>
                  <input
                    id="onboard-matricula"
                    type="text"
                    value={matriculaCode}
                    onChange={(e) => setMatriculaCode(e.target.value)}
                    className="w-full bg-background border border-surface-border rounded px-3 py-3 sm:py-2 text-base sm:text-xs text-foreground font-mono focus:outline-none focus:border-brand-neon focus-visible:ring-2 focus-visible:ring-brand-neon"
                    placeholder="Ex: Matrícula 18.492 - CRI Buritis/MG"
                  />
                </div>
              </Card>

              {/* Right Column: KML / GeoJSON Upload */}
              <Card className="space-y-4">
                <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-lime" />
                  Importação Vetorial de Limites (Opcional)
                </h3>

                <KmlUploader
                  onGeoJsonLoaded={(feature, filename) => {
                    setUploadedGeoJson(feature);
                    setFarmName(feature.properties?.name || filename.replace(/\.[^/.]+$/, ""));
                  }}
                />

                {uploadedGeoJson && (
                  <div className="p-3 bg-brand-neon/10 border border-brand-neon/30 rounded text-xs font-mono text-brand-neon flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Polígono carregado com sucesso. Coordenadas geoespaciais prontas para auditoria.</span>
                  </div>
                )}
              </Card>
            </div>

            {/* Launch Action */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartEnrichment}
                className="flex items-center gap-2 font-mono shadow-neon"
              >
                <span>Iniciar Varredura Geoespacial</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: THE "RADAR SCANNER" STATE */}
        {currentStep === 2 && (
          <RadarScanner
            currentStepIndex={activeStepIndex}
            steps={enrichmentLogs}
          />
        )}

        {/* STEP 3: DASHBOARD HYDRATION & COMPLIANCE SCORECARD */}
        {currentStep === 3 && enrichedData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Columns: Hydrated Mini Map & Geometry Data */}
              <div className="lg:col-span-7 space-y-4">
                <Card className="p-0 overflow-hidden">
                  <div className="p-3 bg-surface border-b border-surface-border flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-foreground flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-neon" />
                      Visualização Hidratada (Deck.gl)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                        (enrichedData as any).source === "live"
                          ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30"
                      }`}>
                        Origem: {(enrichedData as any).source === "live" ? "Base Homologada (Live)" : "Base de Demonstração (Fixture Offline)"}
                      </span>
                      <Badge variant={enrichedData.compliance_ibama.is_embargoed ? "embargo" : "regular"}>
                        {enrichedData.compliance_ibama.is_embargoed
                          ? "SOBREPOSIÇÃO COM EMBARGO"
                          : "POLÍGONO VERIFICADO"}
                      </Badge>
                    </div>
                  </div>
                  <MiniMap data={enrichedData} />
                </Card>

                {/* Recommendations Box */}
                <Card className="space-y-2 font-mono text-xs">
                  <h4 className="font-bold text-foreground uppercase text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-neon" />
                    Parecer Técnico Automatizado AgrosTech:
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-muted">
                    {enrichedData.scorecard.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs leading-relaxed">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Right 5 Columns: Compliance ScoreCard */}
              <div className="lg:col-span-5">
                <ScoreCard data={enrichedData} />
              </div>
            </div>

            {/* Step 4 CTA: Commit "Gerar Passaporte de Crédito" */}
            <div className="space-y-3">
              {saveError && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-2 text-xs font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-surface-border">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setCurrentStep(1)}
                  className="font-mono text-xs"
                >
                  &larr; Refazer Ingestão
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCommitSave}
                  isLoading={isSaving}
                  className="flex items-center gap-2 font-mono shadow-neon"
                >
                  <ShieldCheck className="w-5 h-5 text-black" />
                  <span>Gerar Passaporte de Crédito</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {currentStep === 4 && (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-neon/20 border border-brand-neon flex items-center justify-center text-brand-neon shadow-neon-lg animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground font-display">
              Passaporte de Crédito Emitido com Sucesso!
            </h2>
            <p className="text-sm text-slate-muted font-mono max-w-md">
              O imóvel foi inserido com sucesso na base de inteligência territorial. Redirecionando para o Radar 2D...
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

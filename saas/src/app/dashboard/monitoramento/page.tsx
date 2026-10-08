"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Satellite, Leaf, Droplets, Bell, Plus, Trash2, Radio } from "lucide-react";

type Index = "SAR" | "NDVI" | "NDWI" | "EVI";
type Condition = "abaixo" | "acima";

interface AlertRule {
  id: string;
  name: string;
  index: Index;
  condition: Condition;
  threshold: number;
  active: boolean;
}

const INDEX_INFO: Record<Index, { label: string; unit: string; icon: React.ReactNode; current: number; hint: string }> = {
  SAR: { label: "SAR Sentinel-1 (VH)", unit: "dB", icon: <Radio className="w-4 h-4 text-[#00e5ff]" />, current: -15.2, hint: "Estrutura da biomassa e umidade do solo, mesmo com nuvens" },
  NDVI: { label: "NDVI", unit: "", icon: <Leaf className="w-4 h-4 text-[#00e676]" />, current: 0.74, hint: "Vigor da vegetação / cultura" },
  NDWI: { label: "NDWI", unit: "", icon: <Droplets className="w-4 h-4 text-[#00e5ff]" />, current: 0.21, hint: "Água na vegetação e no solo" },
  EVI: { label: "EVI", unit: "", icon: <Leaf className="w-4 h-4 text-[#15803d]" />, current: 0.52, hint: "Vigor em áreas de vegetação densa" },
};

const DEFAULTS: AlertRule[] = [
  { id: "d1", name: "Queda de vigor da lavoura", index: "NDVI", condition: "abaixo", threshold: 0.5, active: true },
  { id: "d2", name: "Estresse hídrico no solo", index: "SAR", condition: "abaixo", threshold: -18, active: true },
];

const STORAGE_KEY = "agrostech_producer_alerts";

function isTriggered(r: AlertRule) {
  const cur = INDEX_INFO[r.index].current;
  return r.condition === "abaixo" ? cur < r.threshold : cur > r.threshold;
}

export default function MonitoramentoPage() {
  const [rules, setRules] = useState<AlertRule[]>(DEFAULTS);
  const [name, setName] = useState("");
  const [index, setIndex] = useState<Index>("NDVI");
  const [condition, setCondition] = useState<Condition>("abaixo");
  const [threshold, setThreshold] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setRules(JSON.parse(saved));
    } catch {}
  }, []);

  const persist = (next: AlertRule[]) => {
    setRules(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const addRule = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(threshold.replace(",", "."));
    if (Number.isNaN(value)) return;
    persist([
      ...rules,
      {
        id: `r${Date.now()}`,
        name: name.trim() || `${index} ${condition} de ${value}`,
        index,
        condition,
        threshold: value,
        active: true,
      },
    ]);
    setName("");
    setThreshold("");
  };

  const triggered = rules.filter((r) => r.active && isTriggered(r));
  const inputCls =
    "w-full bg-[#050505] border border-[#1f242b] rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00e676]";

  return (
    <div className="flex flex-col min-h-screen w-screen bg-[#050505] text-white">
      <Header portalRole="b2c" />
      <main className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto space-y-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#00e676] font-bold">
            Fazenda Buritis — 217,12 ha
          </span>
          <h1 className="text-xl font-bold font-display flex items-center gap-2">
            <Satellite className="w-5 h-5 text-[#00e676]" />
            Agricultura de Precisão
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Acompanhe sua lavoura por satélite (SAR, NDVI e outros índices) e crie seus próprios alertas.
          </p>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(INDEX_INFO) as Index[]).map((k) => {
            const i = INDEX_INFO[k];
            return (
              <div key={k} className="bg-[#12171e] border border-[#1f242b] rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono uppercase">
                  {i.icon}
                  {i.label}
                </div>
                <div className="text-2xl font-bold font-mono">
                  {i.current}
                  <span className="text-xs text-gray-400 ml-1">{i.unit}</span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono">{i.hint}</p>
              </div>
            );
          })}
        </section>

        <section className="bg-[#12171e] border border-[#1f242b] rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#00e676]" />
            Alertas ativos agora
            <Badge variant="regular" size="sm">{triggered.length}</Badge>
          </h2>
          {triggered.length === 0 ? (
            <p className="text-xs text-gray-400 font-mono">Nenhum alerta disparado. Tudo dentro dos limites que você definiu.</p>
          ) : (
            triggered.map((r) => (
              <div key={r.id} className="p-2 rounded bg-[#0a0d10] border border-amber-500/40 text-xs font-mono text-amber-300">
                {r.name}: {r.index} atual {INDEX_INFO[r.index].current} está {r.condition} de {r.threshold}
              </div>
            ))
          )}
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <form onSubmit={addRule} className="bg-[#12171e] border border-[#1f242b] rounded-lg p-4 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#00e676]" />
              Novo alerta
            </h2>
            <input className={inputCls} placeholder="Nome (ex: Talhão 3 seco)" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <select className={inputCls} value={index} onChange={(e) => setIndex(e.target.value as Index)}>
                {(Object.keys(INDEX_INFO) as Index[]).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <select className={inputCls} value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
                <option value="abaixo">abaixo de</option>
                <option value="acima">acima de</option>
              </select>
              <input className={inputCls} placeholder="valor" required value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </div>
            <button type="submit" className="w-full py-2 rounded bg-[#00e676] hover:bg-[#00ff85] text-black text-xs font-bold font-mono">
              Criar alerta
            </button>
          </form>

          <div className="bg-[#12171e] border border-[#1f242b] rounded-lg p-4 space-y-2">
            <h2 className="text-sm font-bold">Meus alertas ({rules.length})</h2>
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded bg-[#0a0d10] border border-[#1f242b] text-xs font-mono">
                <div className="min-w-0">
                  <div className="truncate text-white">{r.name}</div>
                  <div className="text-[10px] text-gray-500">{r.index} {r.condition} de {r.threshold}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => persist(rules.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)))}
                    className={r.active ? "text-[#00e676]" : "text-gray-500"}
                  >
                    {r.active ? "Ativo" : "Pausado"}
                  </button>
                  <button onClick={() => persist(rules.filter((x) => x.id !== r.id))} className="text-gray-400 hover:text-red-400" title="Remover">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

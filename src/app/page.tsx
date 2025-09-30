'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Image as ImageIcon, Loader2, Download, Share2, Copy, History,
  Maximize2, X, ChevronDown, Sliders
} from 'lucide-react';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useImageModels } from '@/hooks/useImageModels';

/* -------------------------------------------------- */
/*  TYPES & CONSTANTS                                 */
/* -------------------------------------------------- */
type Style = 'photorealistic' | 'anime' | 'fantasy-art' | 'abstract';
const styles: { value: Style; label: string }[] = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'anime', label: 'Anime' },
  { value: 'fantasy-art', label: 'Fantasy Art' },
  { value: 'abstract', label: 'Abstract' },
];

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: Date;
  model: string;
  style: Style;
}

/* -------------------------------------------------- */
/*  PAGE COMPONENT  (Next.js 13+ default export)      */
/* -------------------------------------------------- */
export default function HomePage() {
  /* ---------- state ---------- */
  const [prompt, setPrompt] = useState('');
  const [neg, setNeg] = useState('');
  const [style, setStyle] = useState<Style>('photorealistic');
  const [model, setModel] = useState<string>('turbo');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cfgScale, setCfgScale] = useState(7);
  const [seed, setSeed] = useState<string>('');
  const [numOutputs, setNumOutputs] = useState(1);
  const [isDiceSpinning, setIsDiceSpinning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const { models, loading: loadingModels } = useImageModels();
  const { generateImage, loading, error, clearImage } = useImageGeneration();

  /* ---------- side effects ---------- */
  useEffect(() => {
    if (!showHistory) return;
    const down = (e: KeyboardEvent) => e.key === 'Escape' && setShowHistory(false);
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [showHistory]);

  /* ---------- helpers ---------- */
  const buildPrompt = useCallback(() => {
    let p = prompt.trim();
    if (neg.trim()) p += `, ${neg.trim()}`;
    const suffix: Record<Style, string> = {
      photorealistic: ', photo, detailed',
      anime: ', anime, vibrant',
      'fantasy-art': ', fantasy, magical',
      abstract: ', abstract, artistic',
    };
    return p + suffix[style];
  }, [prompt, neg, style]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const res = await generateImage({
      prompt: buildPrompt(),
      model,
      width: 512,
      height: 512,
      seed: seed ? Number(seed) : Math.floor(Math.random() * 1e6),
      nologo: true,
      safe: true,
    });
    if (res?.url) {
      const urls = [res.url]; // backend returns single url today
      setGeneratedImages(urls);
      setSelectedIndex(0);
      const entry: GeneratedImage = {
        url: res.url,
        prompt: buildPrompt(),
        timestamp: new Date(),
        model,
        style,
      };
      setHistory((h) => [entry, ...h.slice(0, 19)]);
    }
  };

  const downloadImage = () => {
    if (!generatedImages[selectedIndex]) return;
    const a = document.createElement('a');
    a.href = generatedImages[selectedIndex];
    a.download = `generated-${Date.now()}.png`;
    a.click();
  };

  const shareImage = async () => {
    const url = generatedImages[selectedIndex];
    if (!url) return;
    if (navigator.share) {
      await navigator.share({ title: 'My AI Image', url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const randomSeed = () => setSeed(Math.floor(Math.random() * 1e9).toString());

  const surprisePrompt = () => {
    setIsDiceSpinning(true);
    const list = [
      'A city on a turtle’s back, golden hour, 4k',
      'Cyberpunk cat with neon headphones',
      'Floating island with waterfalls, dreamy',
      'Steampunk mechanical owl',
      'Underwater library, bioluminescent',
    ];
    setPrompt(list[Math.floor(Math.random() * list.length)]);
    setTimeout(() => setIsDiceSpinning(false), 800);
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* ---------- HEADER ---------- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-black">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange rounded-xl grid place-content-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">RAJ AI IMAGE</h1>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="relative px-3 py-2 rounded-lg hover:bg-orange/10 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange text-white text-[10px] rounded-full grid place-content-center">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT - Controls */}
          <section className="lg:col-span-1 space-y-6">
            {/* Prompt */}
            <div className="bg-white border border-black rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-2">Your Prompt</label>
              <textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="w-full h-28 px-4 py-3 border border-black rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange transition"
                disabled={loading}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={surprisePrompt}
                  disabled={loading}
                  className={`flex-1 px-3 py-2 border border-black rounded-lg hover:bg-orange hover:text-white transition disabled:opacity-50 text-sm font-medium ${isDiceSpinning ? 'animate-spin' : ''}`}
                >
                  🎲 Surprise
                </button>
                <button
                  onClick={copyPrompt}
                  className="px-3 py-2 border border-black rounded-lg hover:bg-orange hover:text-white transition text-sm"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Negative */}
            <div className="bg-white border border-black rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-2">Negative Prompt</label>
              <textarea
                value={neg}
                onChange={(e) => setNeg(e.target.value)}
                placeholder="What to avoid..."
                className="w-full h-20 px-4 py-3 border border-black rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange transition"
                disabled={loading}
              />
            </div>

            {/* Model / Outputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-black rounded-2xl p-4 shadow-sm">
                <label className="text-xs font-semibold mb-1 block">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loadingModels || loading}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange bg-white text-sm"
                >
                  {loadingModels ? (
                    <option>Loading...</option>
                  ) : (
                    models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="bg-white border border-black rounded-2xl p-4 shadow-sm">
                <label className="text-xs font-semibold mb-1 block">Outputs</label>
                <select
                  value={numOutputs}
                  onChange={(e) => setNumOutputs(Number(e.target.value))}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange bg-white text-sm"
                >
                  <option value={1}>1 Image</option>
                  <option value={2}>2 Images</option>
                  <option value={3}>3 Images</option>
                  <option value={4}>4 Images</option>
                </select>
              </div>
            </div>

            {/* Style */}
            <div className="bg-white border border-black rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold mb-3">Style</label>
              <div className="grid grid-cols-2 gap-3">
                {styles.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    disabled={loading}
                    className={`px-4 py-3 rounded-xl border-2 transition text-sm font-medium ${
                      style === s.value
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-black hover:border-orange'
                    } disabled:opacity-50`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 border border-black rounded-2xl hover:bg-orange/5 transition"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span className="text-sm font-semibold">Advanced Settings</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {/* Advanced Panel */}
            {showAdvanced && (
              <div className="bg-white border border-black rounded-2xl p-5 shadow-sm space-y-5">
                {/* CFG */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold">CFG Scale</label>
                    <span className="px-2 py-0.5 bg-orange text-white text-xs rounded-full">{cfgScale}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={cfgScale}
                    onChange={(e) => setCfgScale(Number(e.target.value))}
                    disabled={loading}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>

                {/* Seed */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Seed</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="Random"
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                    <button
                      onClick={randomSeed}
                      disabled={loading}
                      className="px-4 py-2 border border-black rounded-lg hover:bg-orange hover:text-white transition"
                    >
                      🎲
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Generate */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-orange text-white rounded-2xl hover:bg-black hover:text-orange transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="p-4 border border-black rounded-2xl bg-white text-sm flex items-center gap-3">
                <span className="text-orange">⚠️</span>
                {error.message}
              </div>
            )}
          </section>

          {/* RIGHT - Image Output */}
          <section className="lg:col-span-2 bg-white border border-black rounded-2xl shadow-sm flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm font-semibold">Generated Image</span>
              </div>
              {generatedImages.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadImage}
                    className="p-2 rounded-lg border border-black hover:bg-orange hover:text-white transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={shareImage}
                    className="p-2 rounded-lg border border-black hover:bg-orange hover:text-white transition"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="p-2 rounded-lg border border-black hover:bg-orange hover:text-white transition"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedImages([]);
                      setSelectedIndex(0);
                      clearImage();
                    }}
                    className="p-2 rounded-lg border border-black hover:bg-orange hover:text-white transition"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Image Canvas */}
            <div className="flex-1 p-6 grid place-content-center relative min-h-[24rem] lg:min-h-0">
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-orange" />
                  <p className="text-sm text-gray-600">Crafting your image…</p>
                </div>
              ) : generatedImages.length ? (
                <div className="flex flex-col items-center">
                  <img
                    src={generatedImages[selectedIndex]}
                    alt="Generated"
                    className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-xl"
                  />
                  {generatedImages.length > 1 && (
                    <div className="flex gap-2 mt-4">
                      {generatedImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedIndex(idx)}
                          className={`w-3 h-3 rounded-full transition ${idx === selectedIndex ? 'bg-orange' : 'bg-gray-300'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-400">
                  <ImageIcon className="w-16 h-16" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-600">Ready to generate</p>
                    <p className="text-sm mt-1">Enter a prompt and click Generate</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* ---------- HISTORY MODAL ---------- */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-content-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[80vh] flex flex-col border border-black rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black">
              <h2 className="text-base font-semibold">Generation History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg border border-black hover:bg-orange hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3" />
                  <p>No images in history yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {history.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={`history-${idx}`}
                      className="w-full h-32 object-cover rounded-xl border border-black cursor-pointer hover:scale-105 transition"
                      onClick={() => {
                        setGeneratedImages([img.url]);
                        setSelectedIndex(0);
                        setPrompt(img.prompt);
                        setModel(img.model);
                        setStyle(img.style);
                        setShowHistory(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- FULLSCREEN ---------- */}
      {isFullscreen && generatedImages[selectedIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black grid place-content-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={generatedImages[selectedIndex]}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </div>
      )}

      {/* ---------- COPIED TOAST ---------- */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black text-white text-sm rounded-xl shadow">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}

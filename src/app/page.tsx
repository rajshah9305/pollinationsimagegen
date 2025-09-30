'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Image as ImageIcon, Loader2, Download, Share2, Copy, History,
  Maximize2, X, ChevronDown, Sliders
} from 'lucide-react';

/* -------------------------------------------------- */
/*  TYPES & CONSTANTS                                 */
/* -------------------------------------------------- */
type Style = 'photorealistic' | 'anime' | 'fantasy-art' | 'abstract';

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: Date;
  model: string;
  style: Style;
}

const styles: { value: Style; label: string }[] = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'anime', label: 'Anime' },
  { value: 'fantasy-art', label: 'Fantasy Art' },
  { value: 'abstract', label: 'Abstract' },
];

const surprisePrompts = [
  'A city on a turtle\'s back, golden hour, 4k',
  'Cyberpunk cat with neon headphones',
  'Floating island with waterfalls, dreamy',
  'Steampunk mechanical owl',
  'Underwater library, bioluminescent',
  'Dragon made of crystals in sunset',
  'Robot gardener tending to flowers',
  'Magical forest with glowing mushrooms'
];

/* -------------------------------------------------- */
/*  FIXED API INTEGRATION                             */
/* -------------------------------------------------- */
const generateImageAPI = async (params: {
  prompt: string;
  model: string;
  width: number;
  height: number;
  seed: number;
  nologo: boolean;
  safe: boolean;
}) => {
  try {
    const searchParams = new URLSearchParams({
      model: params.model,
      width: params.width.toString(),
      height: params.height.toString(),
      seed: params.seed.toString(),
      nologo: params.nologo.toString(),
      safe: params.safe.toString(),
    });

    // FIXED: Remove extra space in URL
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(params.prompt)}?${searchParams}`;
    
    const response = await fetch(imageUrl, { mode: 'cors' });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return { url: URL.createObjectURL(blob) };
  } catch (error) {
    console.error('Generation error:', error);
    throw error;
  }
};

/* -------------------------------------------------- */
/*  MAIN PAGE COMPONENT                               */
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Memory cleanup
  useEffect(() => {
    return () => {
      generatedImages.forEach(url => URL.revokeObjectURL(url));
      history.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, []);

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
      photorealistic: ', photo, detailed, 4k',
      anime: ', anime, vibrant',
      'fantasy-art': ', fantasy, magical',
      abstract: ', abstract, artistic',
    };
    return p + suffix[style];
  }, [prompt, neg, style]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(new Error('Please enter a prompt'));
      return;
    }

    setLoading(true);
    setError(null);
    
    // Clean up previous images
    generatedImages.forEach(url => URL.revokeObjectURL(url));

    try {
      const seedValue = seed ? Number(seed) : Math.floor(Math.random() * 1e6);
      const result = await generateImageAPI({
        prompt: buildPrompt(),
        model,
        width: 1024,
        height: 1024,
        seed: seedValue,
        nologo: true,
        safe: true,
      });

      if (result?.url) {
        setGeneratedImages([result.url]);
        setSelectedIndex(0);
        
        const entry: GeneratedImage = {
          url: result.url,
          prompt: buildPrompt(),
          timestamp: new Date(),
          model,
          style,
        };
        
        setHistory((h) => {
          const newHistory = [entry, ...h.slice(0, 19)];
          if (h.length >= 20 && h[19].url) {
            URL.revokeObjectURL(h[19].url);
          }
          return newHistory;
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate image');
      setError(error);
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImages[selectedIndex]) return;
    const a = document.createElement('a');
    a.href = generatedImages[selectedIndex];
    a.download = `raj-ai-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const shareImage = async () => {
    const url = generatedImages[selectedIndex];
    if (!url) return;
    
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: 'RAJ AI Image Generator',
          text: `Check out this AI generated image: ${prompt}`,
          url 
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Share failed:', err);
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPrompt = async () => {
    if (!prompt.trim()) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const randomSeed = () => setSeed(Math.floor(Math.random() * 1e9).toString());

  const surprisePrompt = () => {
    setIsDiceSpinning(true);
    const randomPrompt = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
    setPrompt(randomPrompt);
    
    // Focus and select text
    if (promptRef.current) {
      promptRef.current.focus();
      setTimeout(() => {
        promptRef.current?.setSelectionRange(randomPrompt.length, randomPrompt.length);
      }, 0);
    }
    
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
              <div className="w-10 h-10 bg-orange-500 rounded-xl grid place-content-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                RAJ AI Image Generator
              </h1>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="relative px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2 text-sm font-medium border border-orange-200 hover:border-orange-300"
            >
              <History className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full grid place-content-center font-bold">
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
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:border-orange-300 transition-colors">
              <label className="block text-sm font-semibold mb-3 text-gray-800">Your Prompt</label>
              <textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="w-full h-28 px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-gray-800"
                disabled={loading}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={surprisePrompt}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 border-2 border-orange-200 rounded-lg hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 font-medium disabled:opacity-50 ${isDiceSpinning ? 'animate-spin' : ''}`}
                >
                  🎲 Surprise Me
                </button>
                <button
                  onClick={copyPrompt}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Negative */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:border-orange-300 transition-colors">
              <label className="block text-sm font-semibold mb-3 text-gray-800">Negative Prompt</label>
              <textarea
                value={neg}
                onChange={(e) => setNeg(e.target.value)}
                placeholder="What to avoid in the image..."
                className="w-full h-20 px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-gray-800"
                disabled={loading}
              />
            </div>

            {/* Model / Outputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:border-orange-300 transition-colors">
                <label className="text-sm font-semibold mb-2 block text-gray-800">AI Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white font-medium"
                >
                  <option value="turbo">Turbo (Fast)</option>
                  <option value="flux">Flux (High Quality)</option>
                  <option value="kontext">Kontext (Context-Aware)</option>
                </select>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:border-orange-300 transition-colors">
                <label className="text-sm font-semibold mb-2 block text-gray-800">Outputs</label>
                <select
                  value={numOutputs}
                  onChange={(e) => setNumOutputs(Number(e.target.value))}
                  disabled={loading}
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white font-medium"
                >
                  <option value={1}>1 Image</option>
                  <option value={2}>2 Images</option>
                  <option value={3}>3 Images</option>
                  <option value={4}>4 Images</option>
                </select>
              </div>
            </div>

            {/* Style */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:border-orange-300 transition-colors">
              <label className="block text-sm font-semibold mb-4 text-gray-800">Art Style</label>
              <div className="grid grid-cols-2 gap-3">
                {styles.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    disabled={loading}
                    className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                      style === s.value
                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md'
                        : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50'
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
              className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-2xl hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 font-semibold"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-600" />
                <span className="text-gray-800">Advanced Settings</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-orange-600 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {/* Advanced Panel */}
            {showAdvanced && (
              <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-sm space-y-5">
                {/* CFG */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-800">CFG Scale</label>
                    <span className="px-3 py-1 bg-orange-500 text-white text-xs rounded-full font-bold">{cfgScale}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={cfgScale}
                    onChange={(e) => setCfgScale(Number(e.target.value))}
                    disabled={loading}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>

                {/* Seed */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-800">Seed (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="Random seed"
                      disabled={loading}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    />
                    <button
                      onClick={randomSeed}
                      disabled={loading}
                      className="px-4 py-3 border-2 border-gray-200 rounded-lg hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 font-medium"
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
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
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
              <div className="p-4 border-2 border-red-300 rounded-2xl bg-red-50 text-sm flex items-center gap-3">
                <span className="text-red-500 font-bold">⚠️</span>
                <span className="text-red-700 font-medium">{error.message}</span>
              </div>
            )}
          </section>

          {/* RIGHT - Image Output */}
          <section className="lg:col-span-2 bg-white border-2 border-gray-200 rounded-2xl shadow-sm flex flex-col hover:border-orange-300 transition-colors">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-orange-600" />
                <span className="text-base font-bold text-gray-800">Generated Image</span>
              </div>
              {generatedImages.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadImage}
                    className="px-4 py-2 rounded-lg border-2 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 font-medium flex items-center gap-2"
                    title="Download Image"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button
                    onClick={shareImage}
                    className="px-4 py-2 rounded-lg border-2 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 font-medium flex items-center gap-2"
                    title="Share Image"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="px-4 py-2 rounded-lg border-2 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 font-medium"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      generatedImages.forEach(url => URL.revokeObjectURL(url));
                      setGeneratedImages([]);
                      setSelectedIndex(0);
                    }}
                    className="px-4 py-2 rounded-lg border-2 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 font-medium"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Image Canvas */}
            <div className="flex-1 p-6 grid place-content-center relative min-h-[24rem] lg:min-h-0 bg-gradient-to-br from-gray-50 to-gray-100">
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800">Creating your masterpiece...</p>
                    <p className="text-sm text-gray-600 mt-1">This usually takes 10-30 seconds</p>
                  </div>
                </div>
              ) : generatedImages.length ? (
                <div className="flex flex-col items-center">
                  <img
                    src={generatedImages[selectedIndex]}
                    alt="Generated by RAJ AI"
                    className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl border-4 border-white"
                  />
                  {generatedImages.length > 1 && (
                    <div className="flex gap-2 mt-4">
                      {generatedImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedIndex(idx)}
                          className={`w-3 h-3 rounded-full transition-all duration-200 ${idx === selectedIndex ? 'bg-orange-500 shadow-lg' : 'bg-gray-300 hover:bg-gray-400'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-500">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-700">Ready to Create</p>
                    <p className="text-base mt-2 text-gray-600">Enter a prompt and click generate to create amazing AI images</p>
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
          <div className="bg-white w-full max-w-4xl max-h-[80vh] flex flex-col border-2 border-orange-200 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
              <h2 className="text-lg font-bold text-gray-800">Generation History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg border-2 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <History className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                  <p className="text-lg font-semibold text-gray-700">No images in history yet</p>
                  <p className="text-base mt-2">Your generated images will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {history.map((img, idx) => (
                    <div key={idx} className="group relative">
                      <img
                        src={img.url}
                        alt={`History item ${idx + 1}`}
                        className="w-full aspect-square object-cover rounded-xl border-2 border-gray-200 cursor-pointer hover:border-orange-500 hover:shadow-lg transition-all duration-300"
                        onClick={() => {
                          setGeneratedImages([img.url]);
                          setSelectedIndex(0);
                          setPrompt(img.prompt.replace(/, (photorealistic|anime|fantasy art|abstract)(, detailed, 4k|, vibrant|, magical|, artistic)$/, ''));
                          setModel(img.model);
                          setStyle(img.style);
                          setShowHistory(false);
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-xl"></div>
                      <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="truncate font-medium">{img.prompt.substring(0, 40)}...</p>
                        <p className="text-gray-300 text-xs">{img.model} • {img.style}</p>
                      </div>
                    </div>
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
          className="fixed inset-0 z-50 bg-black grid place-content-center p-4 cursor-pointer"
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={generatedImages[selectedIndex]}
            alt="Fullscreen AI Generated Image"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
            <p className="text-sm">Click anywhere to close</p>
          </div>
        </div>
      )}

      {/* ---------- COPIED TOAST ---------- */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-orange-500 text-white text-base font-semibold rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Copied to clipboard!
          </div>
        </div>
      )}
    </div>
  );
}

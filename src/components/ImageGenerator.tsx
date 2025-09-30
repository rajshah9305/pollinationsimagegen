'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Image as ImageIcon, Loader2, Download, Share2, Copy, RotateCcw, Settings, History, Maximize2, X, Wand2, AlertTriangle } from 'lucide-react';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useImageModels } from '@/hooks/useImageModels';

/* -------------------------------------------------- */
/*  types & constants                                 */
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
/*  component                                         */
/* -------------------------------------------------- */
export function ImageGenerator() {
  /* ---------- state ---------- */
  const [prompt, setPrompt]           = useState('');
  const [neg, setNeg]                 = useState('');
  const [style, setStyle]             = useState<Style>('photorealistic');
  const [model, setModel]             = useState<string>('turbo');
  const [current, setCurrent]         = useState<string | null>(null);
  const [history, setHistory]         = useState<GeneratedImage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageScale, setImageScale]   = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]   = useState(false);
  const [dragStart, setDragStart]     = useState({ x: 0, y: 0 });
  const [cfgScale, setCfgScale]       = useState(7);
  const [seed, setSeed]               = useState<string>('');
  const [numOutputs, setNumOutputs]   = useState(1);

  const promptRef = useRef<HTMLTextAreaElement>(null);

  const { models, loading: loadingModels } = useImageModels();
  const { generateImage, loading, error, generatedImage, clearImage } = useImageGeneration();

  /* ---------- side effects ---------- */
  useEffect(() => {
    if (generatedImage) setCurrent(generatedImage.url);
  }, [generatedImage]);

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
      seed: Math.floor(Math.random() * 1e6),
      nologo: true,
      safe: true,
    });
    if (res) {
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

  const downloadImage = async () => {
    if (!current) return;
    const a = document.createElement('a');
    a.href = current;
    a.download = `generated-${Date.now()}.png`;
    a.click();
  };

  const shareImage = async () => {
    if (!current) return;
    if (navigator.share) {
      await navigator.share({ title: 'Generated Image', url: current });
    } else {
      await navigator.clipboard.writeText(current);
    }
  };

  const generateRandomSeed = useCallback(() => {
    setSeed(Math.floor(Math.random() * 1000000000).toString());
  }, []);

  /* ---------- UI ---------- */
  return (
    <div className="h-screen w-screen flex flex-col bg-white animate-fade-in">
      {/* header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-black shadow-sm animate-slide-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange rounded-lg grid place-content-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-hero text-black hover:text-orange transition-colors cursor-default">RAJ AI IMAGE</h1>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="p-2 text-black hover:text-orange hover:bg-orange rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          title="History"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      {/* main */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-3 lg:p-4 animate-fade-in overflow-hidden">
        {/* left panel */}
        <div className="w-full lg:w-72 xl:w-80 card-standard animate-slide-in hover:-translate-y-1 flex flex-col h-full lg:h-auto">
          <div className="space-y-3">
            <div>
              <label className="font-heading mb-1 block text-sm">Your Prompt</label>
              <textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., An astronaut riding a horse on Mars, cinematic lighting..."
                className="input-standard font-body"
                style={{ height: '100px', resize: 'none' }}
                disabled={loading}
              />
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => setPrompt('A city built on the back of a giant turtle, detailed illustration, fantasy.')}
                  className="flex-1 px-2 py-1 text-xs font-semibold bg-white border border-black hover:bg-orange-50 rounded transition-all"
                >
                  🎲 Surprise
                </button>
                <button
                  onClick={async () => { await navigator.clipboard.writeText(prompt); }}
                  className="flex-1 px-2 py-1 text-xs text-black hover:bg-white rounded transition-all"
                >
                  <Copy className="w-3 h-3 inline mr-1" />Copy
                </button>
              </div>
            </div>

            <div>
              <label className="font-heading mb-1 block text-sm">Negative Prompt</label>
              <textarea
                value={neg}
                onChange={(e) => setNeg(e.target.value)}
                placeholder="What to avoid..."
                className="input-standard font-body"
                style={{ height: '60px', resize: 'none' }}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-heading mb-1 block text-sm">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loadingModels || loading}
                  className="input-standard font-body text-sm"
                >
                  {loadingModels ? (
                    <option>Loading models...</option>
                  ) : (
                    models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="font-heading mb-1 block text-sm">Outputs</label>
                <select
                  value={numOutputs}
                  onChange={(e) => setNumOutputs(Number(e.target.value))}
                  disabled={loading}
                  className="input-standard font-body text-sm"
                >
                  <option value={1}>1 image</option>
                  <option value={2}>2 images</option>
                  <option value={3}>3 images</option>
                  <option value={4}>4 images</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-heading mb-1 block text-sm">Style</label>
              <div className="grid grid-cols-2 gap-1">
                {styles.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    disabled={loading}
                    className={`btn-secondary font-caption text-xs py-1.5 ${style === s.value ? 'border-orange bg-orange-light text-orange shadow-sm' : ''}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Settings Section */}
          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <label className="font-heading mb-2 block text-sm">Advanced Settings</label>

            <div className="space-y-2">
              <div>
                <label className="font-caption mb-1 block text-xs">CFG Scale</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={cfgScale}
                  onChange={(e) => setCfgScale(Number(e.target.value))}
                  disabled={loading}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                  <span>1</span>
                  <span className="font-medium">{cfgScale}</span>
                  <span>20</span>
                </div>
              </div>

              <div>
                <label className="font-caption mb-1 block text-xs">Seed</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Random"
                    disabled={loading}
                    className="flex-1 input-standard font-caption text-xs"
                  />
                  <button
                    onClick={generateRandomSeed}
                    disabled={loading}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 hover:bg-gray-50 rounded transition-all"
                    title="Generate random seed"
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="btn-primary font-body w-full mt-4"
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

          {/* NEW: inline error */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error.message}
            </div>
          )}
        </div>

        {/* right panel – image */}
        <div className="flex-1 card-standard animate-slide-in hover:-translate-y-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between p-3 border-b border-black">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-black" />
              <span className="font-heading text-black text-sm">Generated Image</span>
            </div>
            {current && (
              <div className="flex items-center gap-1">
                <button onClick={downloadImage} className="btn-secondary p-1.5" title="Download">
                  <Download className="w-3 h-3" />
                </button>
                <button onClick={shareImage} className="btn-secondary p-1.5" title="Share">
                  <Share2 className="w-3 h-3" />
                </button>
                <button onClick={() => setIsFullscreen(true)} className="btn-secondary p-1.5" title="Fullscreen">
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button onClick={clearImage} className="btn-secondary p-1.5" title="Clear">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-3 flex items-center justify-center relative overflow-hidden bg-white">
            {loading ? (
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--color-orange)' }} />
                <p className="font-body text-black">Generating your image...</p>
              </div>
            ) : current ? (
              <img
                src={current}
                alt="Generated"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-black animate-fade-in">
                <ImageIcon className="w-16 h-16" />
                <div className="text-center">
                  <p className="font-heading">Ready to generate</p>
                  <p className="font-caption mt-1">Enter a prompt and click Generate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HISTORY MODAL */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl border border-black rounded-lg">
            <div className="flex items-center justify-between p-4 border-b border-black">
              <h2 className="font-heading text-black">Generation History</h2>
              <button onClick={() => setShowHistory(false)} className="btn-secondary p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center text-black py-8">
                  <History className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-body">No images in history yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {history.map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      alt={`history-${i}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform border border-black"
                      onClick={() => {
                        setCurrent(img.url);
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

      {/* FULLSCREEN */}
      {isFullscreen && current && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setIsFullscreen(false)}>
          <img src={current} alt="Fullscreen" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}

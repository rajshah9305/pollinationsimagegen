'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Image as ImageIcon, Loader2, Download, Share2, Copy, RotateCcw, Settings, History, Maximize2, X, Wand2 } from 'lucide-react';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useImageModels } from '@/hooks/useImageModels';

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

export function ImageGenerator() {
  /* ---------- state ---------- */
  const [prompt, setPrompt] = useState('');
  const [neg, setNeg] = useState('');
  const [style, setStyle] = useState<Style>('photorealistic');
  const [model, setModel] = useState<string>('turbo');
  const [current, setCurrent] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cfgScale, setCfgScale] = useState(7);
  const [seed, setSeed] = useState<string>('');

  const imageRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const { models, loading: loadingModels } = useImageModels();
  const { generateImage, loading } = useImageGeneration();

  // Surprise me prompts
  const surprisePrompts = [
    "A city built on the back of a giant turtle, detailed illustration, fantasy.",
    "A robot tending to a zen garden, photorealistic, 4K.",
    "The library of Alexandria on fire, oil painting, dramatic lighting.",
    "A raccoon in a tiny steampunk suit, portrait, studio lighting.",
    "Bioluminescent mushrooms in a dark forest, fantasy, vibrant colors.",
    "A retro-futuristic diner in outer space, synthwave aesthetic.",
    "An astronaut riding a horse on Mars, cinematic lighting.",
    "A cat wizard casting spells in a magical library."
  ];

  const promptEnhancers = [
    ", hyperrealistic", ", trending on artstation", ", detailed illustration",
    ", 8K", ", cinematic lighting", ", sharp focus", ", volumetric lighting"
  ];

  /* ---------- logic ---------- */
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
    const seed = Math.floor(Math.random() * 1e6);
    const res = await generateImage({ prompt: buildPrompt(), model, width: 512, height: 512, seed, nologo: true, safe: true });
    if (res?.url) {
      setCurrent(res.url);
      const newImage: GeneratedImage = {
        url: res.url,
        prompt: buildPrompt(),
        timestamp: new Date(),
        model,
        style
      };
      setHistory(prev => [newImage, ...prev.slice(0, 19)]); // Keep last 20 images
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const downloadImage = async () => {
    if (!current) return;
    try {
      const response = await fetch(current);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  const shareImage = async () => {
    if (!current) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Generated Image',
          text: `Generated with prompt: "${prompt}"`,
          url: current,
        });
      } else {
        await navigator.clipboard.writeText(current);
      }
    } catch (err) {
      console.error('Failed to share image:', err);
    }
  };

  const clearImage = () => {
    setCurrent(null);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleImageWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setImageScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleImageMouseUp = () => {
    setIsDragging(false);
  };

  const resetImageView = () => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const loadFromHistory = (image: GeneratedImage) => {
    setCurrent(image.url);
    setPrompt(image.prompt);
    setModel(image.model);
    setStyle(image.style);
    setShowHistory(false);
  };

  const handleSurpriseMe = () => {
    const randomPrompt = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
    setPrompt(randomPrompt);
  };

  const enhancePrompt = () => {
    if (prompt && !promptEnhancers.some(enhancer => prompt.includes(enhancer))) {
      const randomEnhancer = promptEnhancers[Math.floor(Math.random() * promptEnhancers.length)];
      setPrompt(prev => prev + randomEnhancer);
    }
  };

  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000000).toString());
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            handleGenerate();
            break;
          case 'c':
            if (prompt && promptRef.current !== document.activeElement) {
              e.preventDefault();
              copyPrompt();
            }
            break;
          case 'l':
            e.preventDefault();
            promptRef.current?.focus();
            break;
        }
      } else {
        switch (e.key) {
          case 'Escape':
            setShowHistory(false);
            setIsFullscreen(false);
            setShowSettings(false);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [prompt, handleGenerate, copyPrompt]);

  // Auto-focus prompt on mount
  useEffect(() => {
    promptRef.current?.focus();
  }, []);

  /* ---------- UI ---------- */
  return (
    <div className="h-screen w-screen flex flex-col bg-white animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-black shadow-sm animate-slide-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange rounded-lg grid place-content-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-hero text-black hover:text-orange transition-colors cursor-default">RAJ AI IMAGE</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-black hover:text-orange hover:bg-orange rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            title="History (H)"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-black hover:text-orange hover:bg-orange rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 animate-fade-in">
        {/* Left Panel - Controls */}
        <div className="w-full lg:w-80 xl:w-96 card-standard animate-slide-in hover:-translate-y-1">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="font-heading" id="prompt-label">Your Prompt</label>
              <button
                onClick={enhancePrompt}
                className="text-black hover:text-orange hover:bg-orange transition-all duration-200 p-1 rounded"
                title="Enhance Prompt"
                aria-label="Enhance prompt with AI suggestions"
              >
                <Wand2 className="w-4 h-4" />
              </button>
            </div>
            <p className="font-caption mb-3" id="prompt-help">Describe what you want to generate. Be specific for better results.</p>
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., An astronaut riding a horse on Mars, cinematic lighting..."
              className="input-standard font-body"
              style={{ height: '128px', resize: 'none' }}
              disabled={loading}
              aria-label="Image generation prompt"
              aria-describedby="prompt-help"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSurpriseMe}
                className="flex-1 p-2 text-xs font-semibold bg-white border border-black hover:bg-orange-50 hover:border-black rounded transition-all duration-200 hover:scale-105 active:scale-95"
                title="Surprise Me"
              >
                🎲 Surprise
              </button>
              <button
                onClick={copyPrompt}
                className="flex-1 p-2 text-xs text-black hover:text-black hover:bg-white rounded transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
                title="Copy prompt (Ctrl+C)"
              >
                <Copy className="w-4 h-4 inline mr-1" />
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="font-heading mb-3">Negative Prompt</label>
            <textarea
              value={neg}
              onChange={(e) => setNeg(e.target.value)}
              placeholder="What to avoid... (e.g., blurry, ugly, deformed)"
              className="input-standard font-body"
              style={{ height: '80px', resize: 'none' }}
              disabled={loading}
            />
          </div>

          <div>
            <label className="font-heading mb-3">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loadingModels || loading}
              className="input-standard font-body"
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
            <label className="font-heading mb-3">Style</label>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  disabled={loading}
                  className={`btn-secondary font-caption ${
                    style === s.value
                      ? 'border-orange bg-orange-light text-orange shadow-sm'
                      : ''
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="btn-primary font-body"
            style={{
              width: '100%',
              gap: 'var(--space-sm)'
            }}
            aria-label={loading ? "Generating image..." : "Generate new image"}
            aria-describedby="generate-help"
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

          <div className="font-caption text-black" id="generate-help">
            <p><kbd className="px-1 py-0.5 bg-white border border-black rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white border border-black rounded">Enter</kbd> to generate</p>
            <p><kbd className="px-1 py-0.5 bg-white border border-black rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white border border-black rounded">L</kbd> to focus prompt</p>
            <p><kbd className="px-1 py-0.5 bg-white border border-black rounded">Esc</kbd> to close dialogs</p>
          </div>

        </div>

        {/* Right Panel - Image Display */}
        <div className="flex-1 card-standard animate-slide-in hover:-translate-y-1">
          {/* Image Header */}
          <div className="flex items-center justify-between p-4 border-b border-black">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-black" />
              <span className="font-heading text-black">Generated Image</span>
            </div>
            {current && (
              <div className="flex items-center gap-1">
                <button
                  onClick={downloadImage}
                  className="btn-secondary"
                  style={{
                    padding: 'var(--space-sm)',
                    color: 'var(--color-black)',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'transparent'
                  }}
                  title="Download image"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={shareImage}
                  className="btn-secondary"
                  style={{
                    padding: 'var(--space-sm)',
                    color: 'var(--color-black)',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'transparent'
                  }}
                  title="Share image"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="btn-secondary"
                  style={{
                    padding: 'var(--space-sm)',
                    color: 'var(--color-black)',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'transparent'
                  }}
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={clearImage}
                  className="btn-secondary"
                  style={{
                    padding: 'var(--space-sm)',
                    color: 'var(--color-black)',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'transparent'
                  }}
                  title="Clear image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Image Container */}
          <div className="flex-1 p-4 flex items-center justify-center relative overflow-hidden bg-white">
            {loading ? (
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--color-orange)' }} />
                  <div className="absolute inset-0 w-12 h-12 border-2 border-t-transparent rounded-full animate-ping opacity-20" style={{ borderColor: 'var(--color-orange)' }}></div>
                </div>
                <div className="text-center">
                  <p className="font-body text-black" style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-black)' }}>Generating your image...</p>
                  <p className="font-caption text-black mt-1" style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-black)' }}>This may take a few moments</p>
                </div>
              </div>
            ) : current ? (
              <div
                ref={imageRef}
                className="relative max-w-full max-h-full cursor-move select-none"
                onWheel={handleImageWheel}
                onMouseDown={handleImageMouseDown}
                onMouseMove={handleImageMouseMove}
                onMouseUp={handleImageMouseUp}
                onMouseLeave={handleImageMouseUp}
              >
                <img
                  src={current}
                  alt="Generated"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg transition-transform duration-200"
                  style={{
                    transform: `scale(${imageScale}) translate(${imagePosition.x / imageScale}px, ${imagePosition.y / imageScale}px)`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  draggable={false}
                />
                {imageScale !== 1 && (
                  <div className="absolute bg-black text-white px-2 py-1 rounded font-caption" style={{
                    top: 'var(--space-sm)',
                    right: 'var(--space-sm)',
                    backgroundColor: 'var(--color-black)',
                    color: 'var(--color-white)',
                    padding: '4px 8px',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: 'var(--font-size-caption)'
                  }}>
                    {Math.round(imageScale * 100)}%
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-black animate-fade-in">
                <div className="relative">
                  <ImageIcon className="w-16 h-16" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-[var(--accent-primary)] rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-heading text-black" style={{ fontSize: 'var(--font-size-heading)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-black)' }}>Ready to generate</p>
                  <p className="font-caption text-black" style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-black)' }}>Enter a prompt and click Generate</p>
                  <button
                    onClick={handleSurpriseMe}
                    className="btn-primary font-caption mt-3"
                    style={{
                      marginTop: 'var(--space-md)',
                      fontSize: 'var(--font-size-caption)',
                      fontWeight: 'var(--font-weight-medium)',
                      padding: '8px 16px'
                    }}
                  >
                    🎲 Try Surprise Me
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Image Controls */}
          {current && (
            <div className="p-4 border-t border-black">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={resetImageView}
                  className="btn-secondary font-caption"
                  style={{
                    padding: '6px 12px',
                    fontSize: 'var(--font-size-caption)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--color-black)',
                    backgroundColor: 'transparent'
                  }}
                  title="Reset view"
                >
                  <RotateCcw className="w-4 h-4 inline mr-1" />
                  Reset
                </button>
                <span className="font-caption text-black" style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-black)' }}>
                  Scroll to zoom • Drag to pan
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
          <div className="bg-white w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl border border-black" style={{ backgroundColor: 'var(--color-white)', borderRadius: 'var(--border-radius-lg)', maxWidth: '896px', maxHeight: '80vh' }}>
            <div className="flex items-center justify-between p-4 border-b border-black" style={{ padding: 'var(--space-lg)' }}>
              <h2 className="font-heading text-black" style={{ fontSize: 'var(--font-size-heading)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-black)' }}>Generation History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="btn-secondary"
                style={{
                  padding: 'var(--space-sm)',
                  color: 'var(--color-black)',
                  backgroundColor: 'transparent'
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto" style={{ padding: 'var(--space-lg)' }}>
              {history.length === 0 ? (
                <div className="text-center text-black py-8" style={{ color: 'var(--color-black)', paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-2xl)' }}>
                  <History className="w-12 h-12 mx-auto mb-4" style={{ width: '48px', height: '48px', marginBottom: 'var(--space-lg)' }} />
                  <p className="font-body" style={{ fontSize: 'var(--font-size-body)' }}>No images in history yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" style={{ gap: 'var(--space-lg)' }}>
                  {history.map((image, index) => (
                    <div key={index} className="group relative">
                      <img
                        src={image.url}
                        alt={`Generated ${index + 1}`}
                        className="w-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 hover:shadow-lg border border-black"
                        style={{ height: '128px', borderRadius: 'var(--border-radius-md)', border: 'var(--border-standard)' }}
                        onClick={() => loadFromHistory(image)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0)', borderRadius: 'var(--border-radius-md)' }}>
                        <button
                          onClick={() => loadFromHistory(image)}
                          className="opacity-0 group-hover:opacity-100 bg-white text-black px-3 py-1 rounded font-caption transition-opacity"
                          style={{
                            backgroundColor: 'var(--color-white)',
                            color: 'var(--color-black)',
                            padding: '6px 12px',
                            borderRadius: 'var(--border-radius-sm)',
                            fontSize: 'var(--font-size-caption)',
                            fontWeight: 'var(--font-weight-medium)'
                          }}
                        >
                          Load
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded font-caption" style={{
                        top: 'var(--space-sm)',
                        left: 'var(--space-sm)',
                        backgroundColor: 'var(--color-black)',
                        color: 'var(--color-white)',
                        padding: '4px 8px',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: 'var(--font-size-caption)'
                      }}>
                        {image.style}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {isFullscreen && current && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative max-w-full max-h-full p-4">
            <img
              src={current}
              alt="Generated (Fullscreen)"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={toggleFullscreen}
              className="absolute p-2 bg-black text-white rounded-full hover:bg-black transition-colors"
              style={{
                top: 'var(--space-lg)',
                right: 'var(--space-lg)',
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--color-black)',
                color: 'var(--color-white)',
                borderRadius: '50%'
              }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

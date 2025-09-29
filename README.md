# RAJ AI Image Generator

A professional AI-powered image generation web application built with Next.js, TypeScript, and Tailwind CSS. Powered by Pollinations.ai for high-quality image generation.

## Features

- 🤖 **Multiple AI Models**: Choose from Flux, Turbo, Kontext, and other advanced AI models
- 🎨 **Artistic Styles**: Photorealistic, Anime, Fantasy Art, and Abstract styles
- 📝 **Advanced Prompting**: Support for positive and negative prompts
- 🎛️ **Advanced Settings**: Customize CFG scale, seed, and other parameters
- 🔄 **Real-time Generation**: Instant image generation and display
- 📱 **Responsive Design**: Works seamlessly on all devices
- ⚡ **Fast & Efficient**: Optimized for performance with caching
- 🛡️ **Enterprise-Ready**: Production-ready with error handling and fallbacks

## Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hooks** for state management
- **Lucide React** for icons

### Backend
- **Next.js API Routes** for serverless functions
- **Pollinations.ai API** integration for image generation
- **Enterprise caching** with fallback models
- **Error handling** and retry logic

### Key Components

- `ImageGenerator`: Main UI component
- `useImageGeneration`: Custom hook for image generation
- `useImageModels`: Custom hook for model fetching
- `api/test-models`: API endpoint for models

## Getting Started

### Prerequisites
- Node.js 18.0.0 or later
- npm 8.0.0 or later

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rajshah9305/pollinationsimagegen.git
cd pollinationsimagegen
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. Select an AI model from the dropdown
2. Enter your image prompt
3. Optionally add a negative prompt
4. Choose an artistic style
5. Adjust advanced settings if needed
6. Click "Generate" or "Surprise Me"

## API Endpoints

### GET /api/test-models
Fetches available AI models from Pollinations.ai

**Response:**
```json
{
  "success": true,
  "models": ["flux", "turbo", "kontext"]
}
```

## Models

- **Flux**: High-quality image generation with excellent detail
- **Turbo**: Fast image generation optimized for speed
- **Kontext**: Context-aware model for complex prompts

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy your Next.js app
3. Set environment variables if needed

### Other Platforms
The app can be deployed to any platform supporting Node.js:
- Netlify
- Railway
- Render
- DigitalOcean App Platform

## Environment Variables

No environment variables are required. The app uses public APIs from Pollinations.ai.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Credits

- Powered by [Pollinations.ai](https://pollinations.ai)
- Built with [Next.js](https://nextjs.org)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons by [Lucide](https://lucide.dev)

## Support

For support, please open an issue on GitHub or contact the maintainer.

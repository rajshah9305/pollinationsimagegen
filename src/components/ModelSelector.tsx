import { List, ChevronDown } from 'lucide-react';
import { ImageModel } from '@/types';

interface ModelSelectorProps {
  models: ImageModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ModelSelector({ 
  models, 
  selectedModel, 
  onModelChange, 
  loading = false,
  disabled = false 
}: ModelSelectorProps) {
  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <div className="relative">
      <div className="relative">
        <select
           value={selectedModel}
           onChange={(e) => onModelChange(e.target.value)}
           disabled={loading || disabled}
           className="w-full appearance-none bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 text-sm backdrop-blur-sm transition-all duration-300 hover:border-gray-400 hover:shadow-sm"
         >
           {loading ? (
             <option value="" className="bg-gray-50 text-gray-500">Loading models...</option>
           ) : (
             models.map((model) => (
               <option key={model.id} value={model.id} className="bg-gray-50 text-gray-900">
                 {model.name}
               </option>
             ))
           )}
         </select>
         <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
      {selectedModelData?.description && (
         <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-200">{selectedModelData.description}</p>
       )}
    </div>
  );
}

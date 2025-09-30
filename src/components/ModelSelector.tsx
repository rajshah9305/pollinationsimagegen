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
           className="input-standard w-full appearance-none pr-10"
         >
           {loading ? (
             <option value="">Loading models...</option>
           ) : (
             models.map((model) => (
               <option key={model.id} value={model.id}>
                 {model.name}
               </option>
             ))
           )}
         </select>
         <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
      </div>
      {selectedModelData?.description && (
         <p className="font-caption mt-2 text-black bg-white p-2 rounded-lg border border-black">{selectedModelData.description}</p>
       )}
    </div>
  );
}

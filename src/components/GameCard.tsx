import React, { useState } from 'react';
import { motion } from "motion/react";
import { Clock, X, ExternalLink, Sparkles, Coffee, Edit3, Trash2, Check, Crown } from "lucide-react";

interface GameCardProps {
  key?: string | number;
  name: string;
  image?: string;
  appId?: number;
  playtime?: number; // in minutes
  reason?: string;
  match?: number; // 0-100 percentage
  genres?: string[];
  timeToBeat?: number;
  onDiscard?: () => void;
  discardIcon?: React.ReactNode;
  discardLabel?: string;
  
  // Manual additions support
  isManual?: boolean;
  onEditPlaytime?: (minutes: number) => void;
  onRemoveManual?: () => void;
}

export default function GameCard({ 
  name, 
  image, 
  appId, 
  playtime = 0, 
  reason, 
  match, 
  genres,
  timeToBeat,
  onDiscard, 
  discardIcon, 
  discardLabel,
  isManual,
  onEditPlaytime,
  onRemoveManual
}: GameCardProps) {
  
  const [isEditing, setIsEditing] = useState(false);
  const [editHours, setEditHours] = useState(Math.round(playtime / 60).toString());

  // Use Steam standard image if appId is available, else premium dynamic gradients or placeholder
  const imageUrl = image || (appId ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg` : undefined);
  const steamUrl = appId ? `https://store.steampowered.com/app/${appId}` : undefined;

  const handleSavePlaytime = () => {
    const hours = parseFloat(editHours);
    if (!isNaN(hours) && hours >= 0) {
      onEditPlaytime?.(Math.round(hours * 60));
    }
    setIsEditing(false);
  };

  const isLegendaryMatch = match !== undefined && match >= 95;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
      whileHover={{ 
        y: -6, 
        boxShadow: isLegendaryMatch 
          ? "0 12px 30px rgba(139, 69, 19, 0.12), 0 4px 10px rgba(139, 69, 19, 0.05)" 
          : "0 10px 20px rgba(139, 69, 19, 0.06)" 
      }}
      className={`rounded-3xl overflow-hidden flex flex-col h-full relative group transition-all duration-300 border shadow-sm ${
        isLegendaryMatch 
          ? "bg-gradient-to-b from-[#FFFDF9] via-[#FFF9F0] to-[#FFF6EB] border-[#D2691E]/30"
          : "bg-[#FFFDF9] border-[#EAE2D8] hover:border-[#CD853F]/40"
      }`}
    >
      {/* Light warm background subtle glow */}
      {isLegendaryMatch && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(210,105,30,0.04),transparent_70%)] pointer-events-none z-0" />
      )}

      {/* Remove / Discard Button (Top Right) */}
      {onDiscard && (
        <button
          onClick={onDiscard}
          className="absolute top-2.5 right-2.5 p-1.5 bg-[#FFFDF9]/90 hover:bg-red-500 hover:text-white text-[#3E2723] rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-20 flex items-center justify-center border border-[#EAE2D8] shadow-sm cursor-pointer"
          title={discardLabel || "Descartar recomendação"}
        >
          {discardIcon || <X className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Manual Delete Button */}
      {isManual && onRemoveManual && (
        <button
          onClick={onRemoveManual}
          className="absolute top-2.5 right-2.5 p-1.5 bg-[#FFFDF9]/90 hover:bg-red-500 hover:text-white text-[#3E2723] rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-20 flex items-center justify-center border border-[#EAE2D8] shadow-sm cursor-pointer"
          title="Remover Jogo Manual"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover:text-white" />
        </button>
      )}

      {/* Game Image Header */}
      <div className="relative h-32 w-full overflow-hidden shrink-0 bg-[#F5EBE0]">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                const fallbackDiv = parent.querySelector('.cover-fallback');
                if (fallbackDiv) fallbackDiv.classList.remove('hidden');
              }
            }} 
          />
        ) : null}

        {/* Cafe Graphic Fallback Cover */}
        <div className={`cover-fallback ${imageUrl ? 'hidden' : ''} absolute inset-0 bg-gradient-to-br from-[#FAF6F0] to-[#EAE2D8] flex flex-col items-center justify-center p-3 text-center`}>
          <Coffee className="w-6 h-6 text-[#CD853F]/40 mb-1 animate-pulse" />
          <span className="font-extrabold text-[12px] text-[#5C4D45] tracking-wide line-clamp-2 uppercase font-sans">{name}</span>
        </div>

        {/* Soft Shadow Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 pointer-events-none z-10">
          {isManual && (
            <span className="text-[10px] bg-[#8B4513]/10 text-[#8B4513] px-2 py-0.5 rounded-full border border-[#8B4513]/10 font-sans font-bold uppercase tracking-wider">
              Manual
            </span>
          )}
          {genres && genres.slice(0, 2).map(g => (
            <span key={g} className="text-[10px] bg-[#FFFDF9]/95 text-[#6D5C54] px-2 py-0.5 rounded-full border border-[#EAE2D8] font-sans font-medium">
              {g}
            </span>
          ))}
        </div>

        {/* Legendary Crown badge */}
        {isLegendaryMatch && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-gradient-to-r from-[#D2691E] to-[#CD853F] text-white text-[9px] font-extrabold rounded-full flex items-center gap-1 shadow-md shadow-[#D2691E]/20 animate-bounce z-10">
            <Crown className="w-3 h-3 text-white" />
            <span>SINTONIA MÁXIMA</span>
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 font-sans z-10">
        <div className="space-y-1.5">
          <div className="flex justify-between items-start gap-2">
            <h3 className={`font-bold transition-colors line-clamp-1 text-sm sm:text-base ${
              isLegendaryMatch ? "text-[#8B4513]" : "text-[#2C1B14] group-hover:text-[#CD853F]"
            }`}>
              {name}
            </h3>
            {match !== undefined && (
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap flex items-center gap-0.5 ${
                isLegendaryMatch
                  ? "bg-[#D2691E]/10 text-[#D2691E] border-[#D2691E]/20 shadow-sm"
                  : "bg-[#CD853F]/5 text-[#CD853F] border-[#CD853F]/10 shadow-sm"
              }`}>
                <Sparkles className="w-3 h-3 text-[#CD853F] animate-pulse" />
                <span>{match}% Sabor</span>
              </div>
            )}
          </div>

          {/* Recommendation Reason (Coffee Taste Description) */}
          {reason && (
            <div className={`p-2.5 rounded-2xl border text-xs leading-relaxed transition-colors ${
              isLegendaryMatch
                ? "bg-[#FAF6F0] border-[#D2691E]/15 text-[#5C4D45]"
                : "bg-[#FAF6F0]/70 border border-[#EAE2D8] text-[#5C4D45]"
            }`}>
              <span className={`font-bold text-[9px] uppercase block tracking-wider mb-0.5 ${
                isLegendaryMatch ? "text-[#D2691E]" : "text-[#8B4513]"
              }`}>Sabor da Mistura:</span>
              "{reason}"
            </div>
          )}
          {timeToBeat !== undefined && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8B4513] bg-[#8B4513]/5 border border-[#8B4513]/10 w-fit px-2 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              <span>~{timeToBeat}h para degustar (HLTB)</span>
            </div>
          )}
        </div>

        {/* Footer info & Buttons */}
        <div className="pt-2.5 border-t border-[#F2EDE4] space-y-2">
          <div className="flex items-center justify-between text-xs">
            {isEditing ? (
              <div className="flex items-center gap-1.5 w-full">
                <input 
                  type="text" 
                  value={editHours} 
                  onChange={(e) => setEditHours(e.target.value)}
                  className="bg-[#FFFDF9] border border-[#CD853F]/40 rounded-xl px-2 py-0.5 text-xs w-16 text-[#3E2723] focus:outline-none focus:ring-1 focus:ring-[#CD853F] text-center font-bold"
                  placeholder="Horas"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-[#6D5C54] text-[11px] font-bold">hs</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSavePlaytime(); }}
                  className="p-1 bg-[#CD853F]/10 hover:bg-[#CD853F] hover:text-white rounded-lg text-[#CD853F] transition-colors cursor-pointer"
                  title="Salvar"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                  className="p-1 bg-red-100 hover:bg-red-500 hover:text-white rounded-lg text-red-500 transition-colors cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full font-medium">
                <div className="flex items-center gap-1 text-[#6D5C54]">
                  <Clock className="w-3.5 h-3.5 text-[#CD853F]" />
                  <span>
                    {playtime > 0 ? `${Math.round(playtime / 60)}h` : '0h'}{' '}
                    <span className="text-[#8D7B70] text-[11px]">saboreadas</span>
                  </span>
                  
                  {/* Edit hours button for manual games */}
                  {isManual && onEditPlaytime && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                      className="ml-1 p-0.5 text-[#CD853F] hover:text-[#8B4513] rounded transition-colors cursor-pointer"
                      title="Editar tempo jogado"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {appId ? (
                  <span className="text-[11px] text-[#8D7B70] font-bold">Steam #{appId}</span>
                ) : (
                  <span className={`text-[10px] uppercase tracking-wider font-extrabold ${
                    isLegendaryMatch ? "text-[#D2691E]" : "text-[#8B4513]"
                  }`}>Custom</span>
                )}
              </div>
            )}
          </div>

          {steamUrl && !isEditing && (
            <a
              href={steamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 border active:scale-95 cursor-pointer ${
                isLegendaryMatch
                  ? "bg-[#D2691E] hover:bg-[#B15310] text-white border-transparent"
                  : "bg-[#CD853F]/10 hover:bg-[#CD853F] hover:text-white text-[#CD853F] border-[#CD853F]/20"
              }`}
            >
              <span>Degustar na Steam</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

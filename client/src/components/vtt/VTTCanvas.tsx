import { useState, useEffect } from "react";
import { type Scene, type Token } from "@shared/schema";
import { useTokens, useUpdateToken } from "@/hooks/use-vtt-api";

interface VTTCanvasProps {
  scene: Scene;
  gameId: number;
  lastWsMessage: any;
  sendMessage: (msg: any) => void;
  myCharacterId?: number | null;
}

export function VTTCanvas({ scene, gameId, lastWsMessage, sendMessage, myCharacterId }: VTTCanvasProps) {
  const { data: initialTokens = [] } = useTokens(scene.id);
  const { mutate: updateToken } = useUpdateToken();
  const [tokens, setTokens] = useState<Token[]>([]);
  
  useEffect(() => {
    if (initialTokens.length > 0) {
      setTokens(initialTokens);
    }
  }, [initialTokens]);

  useEffect(() => {
    if (lastWsMessage?.type === "tokenUpdate" && lastWsMessage.payload.sceneId === scene.id) {
      setTokens(prev => {
        const payloadToken = lastWsMessage.payload;
        const index = prev.findIndex(t => t.id === payloadToken.id);
        if (index === -1) return [...prev, payloadToken];
        const next = [...prev];
        next[index] = payloadToken;
        return next;
      });
    }
  }, [lastWsMessage, scene.id]);

  const gridSize = 40; // pixel size per map grid square

  return (
    <div className="relative overflow-auto border border-border/50 rounded-lg w-full h-[500px] md:h-[700px] bg-neutral-900 hide-scrollbar shadow-inner">
      <div 
        className="relative"
        style={{
          width: scene.gridWidth ? scene.gridWidth * gridSize : 800,
          height: scene.gridHeight ? scene.gridHeight * gridSize : 800,
          backgroundImage: scene.backgroundUrl ? `url(${scene.backgroundUrl})` : 'none',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Draw Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`,
            backgroundSize: `${gridSize}px ${gridSize}px`
          }}
        />

        {tokens.map(token => (
          <div
            key={token.id}
            draggable
            onDragEnd={(e) => {
              const rect = e.currentTarget.parentElement!.getBoundingClientRect();
              let newX = Math.floor((e.clientX - rect.left) / gridSize);
              let newY = Math.floor((e.clientY - rect.top) / gridSize);
              
              // Bounds checking
              if (newX < 0) newX = 0;
              if (newY < 0) newY = 0;
              if (scene.gridWidth && newX >= scene.gridWidth) newX = scene.gridWidth - 1;
              if (scene.gridHeight && newY >= scene.gridHeight) newY = scene.gridHeight - 1;
              
              if (newX !== token.x || newY !== token.y) {
                 const updated = { ...token, x: newX, y: newY };
                 setTokens(prev => prev.map(t => t.id === token.id ? updated : t));
                 updateToken({ id: token.id!, sceneId: scene.id, x: newX, y: newY });
                 sendMessage({ type: "tokenUpdate", payload: updated });
              }
            }}
            className="absolute rounded-full shadow-lg border-2 overflow-hidden cursor-move hover:border-accent z-10 backdrop-blur transition-all duration-200"
            style={{
              left: (token.x ?? 0) * gridSize,
              top: (token.y ?? 0) * gridSize,
              width: (token.size ?? 1) * gridSize,
              height: (token.size ?? 1) * gridSize,
              backgroundImage: token.imageUrl ? `url(${token.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderColor: token.characterId === myCharacterId ? 'var(--primary)' : 'rgba(255,255,255,0.8)',
              backgroundColor: token.imageUrl ? 'transparent' : 'rgba(0,0,0,0.5)',
            }}
          >
             {!token.imageUrl && <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold truncate px-1 text-white text-shadow-sm">{token.name}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

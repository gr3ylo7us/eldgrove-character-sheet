import { useState, useEffect, useRef } from "react";
import { type Scene, type Token } from "@shared/schema";
import { useTokens, useUpdateToken, useDeleteToken } from "@/hooks/use-vtt-api";
import Draggable from 'react-draggable';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Settings, Image as ImageIcon } from "lucide-react";

interface VTTCanvasProps {
  scene: Scene;
  gameId: number;
  lastWsMessage: any;
  sendMessage: (msg: any) => void;
  myCharacterId?: number | null;
  isGM?: boolean;
  players?: any[];
}

function TokenNode({ 
  token, gridSize, isGM, myCharacterId, players, 
  onMove, onSaveSettings, onDelete 
}: { 
  token: Token; 
  gridSize: number; 
  isGM?: boolean; 
  myCharacterId?: number | null; 
  players?: any[];
  onMove: (x: number, y: number) => void;
  onSaveSettings: (updates: Partial<Token>) => void;
  onDelete: () => void;
}) {
  const nodeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [editImg, setEditImg] = useState(token.imageUrl || "");
  const [editChar, setEditChar] = useState(token.characterId?.toString() || "none");
  const [editName, setEditName] = useState(token.name || "");
  
  const canDrag = isGM || (token.characterId && token.characterId === myCharacterId);

  const handleDoubleClick = () => {
    if (token.characterId) {
      window.open(`/character/${token.characterId}`, '_blank');
    }
  };

  const saveSettings = () => {
    onSaveSettings({
      name: editName,
      imageUrl: editImg.trim() || null,
      characterId: editChar === "none" ? null : parseInt(editChar)
    });
    setOpen(false);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      grid={[gridSize, gridSize]}
      bounds="parent"
      position={{ x: (token.x ?? 0) * gridSize, y: (token.y ?? 0) * gridSize }}
      onStop={(e, data) => {
         // Data.x and data.y are the absolute dragged pixel coordinates relative to the parent.
        const newX = Math.round(data.x / gridSize);
        const newY = Math.round(data.y / gridSize);
        if (newX !== token.x || newY !== token.y) {
           onMove(newX, newY);
        }
      }}
      disabled={!canDrag}
      cancel=".no-drag"
    >
      <div 
        ref={nodeRef}
        onDoubleClick={handleDoubleClick}
        className={`absolute rounded-full shadow-lg border-2 !pointer-events-auto group ${canDrag ? 'cursor-move hover:scale-105 hover:border-accent' : 'cursor-default'} z-10 backdrop-blur transition-transform duration-200`}
        style={{
          width: (token.size ?? 1) * gridSize,
          height: (token.size ?? 1) * gridSize,
          backgroundImage: token.imageUrl ? `url(${token.imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderColor: token.characterId === myCharacterId ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
          backgroundColor: token.imageUrl ? 'transparent' : 'rgba(0,0,0,0.6)',
        }}
      >
        {!token.imageUrl && <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold truncate px-1 text-white drop-shadow-md select-none pointer-events-none">{token.name}</span>}
        
        {isGM && (
          <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity no-drag" onDoubleClick={e => e.stopPropagation()}>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button size="icon" variant="secondary" className="w-6 h-6 rounded-full bg-background border border-primary/20 shadow-xl hover:bg-primary/20 hover:text-primary">
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 z-50 pointer-events-auto shadow-2xl" onPointerDownOutside={() => setOpen(false)}>
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm border-b pb-2 font-display">Token Configuration</h4>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Name</label>
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Token Name" 
                      className="h-8 text-xs" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Avatar Image URL</label>
                    <div className="flex gap-1">
                      <Input 
                        value={editImg} 
                        onChange={(e) => setEditImg(e.target.value)}
                        placeholder="https://..." 
                        className="h-8 text-xs flex-1" 
                      />
                      <Button size="icon" variant="outline" className="h-8 w-8 shrink-0"><ImageIcon className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Bind to Player Character</label>
                    <Select value={editChar} onValueChange={setEditChar}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned / NPC</SelectItem>
                        {players?.filter((p: any) => p.character).map((p: any) => (
                          <SelectItem key={p.id} value={p.characterId?.toString()!}>{p.character?.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-2 border-t mt-2">
                    <Button variant="default" size="sm" className="flex-1 h-8 text-xs" onClick={saveSettings}>
                      Save
                    </Button>
                    <Button variant="destructive" size="sm" className="h-8 px-2" onClick={() => { onDelete(); setOpen(false); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </Draggable>
  );
}

export function VTTCanvas({ scene, gameId, lastWsMessage, sendMessage, myCharacterId, isGM, players }: VTTCanvasProps) {
  const { data: initialTokens = [] } = useTokens(scene.id);
  const { mutate: updateToken } = useUpdateToken();
  const { mutate: deleteTokenMut } = useDeleteToken();
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
    } else if (lastWsMessage?.type === "tokenDelete" && lastWsMessage.payload.sceneId === scene.id) {
      setTokens(prev => prev.filter(t => t.id !== lastWsMessage.payload.tokenId));
    }
  }, [lastWsMessage, scene.id]);

  const gridSize = 40; // pixel size per map grid square

  const handleUpdatePosition = (token: Token, newX: number, newY: number) => {
    const updated = { ...token, x: newX, y: newY };
    setTokens(prev => prev.map(t => t.id === token.id ? updated : t));
    updateToken({ id: token.id!, sceneId: scene.id, x: newX, y: newY });
    sendMessage({ type: "tokenUpdate", payload: updated });
  };

  const handleSaveSettings = (token: Token, updates: Partial<Token>) => {
    const updated = { ...token, ...updates };
    setTokens(prev => prev.map(t => t.id === token.id ? updated : t));
    updateToken({ id: token.id!, sceneId: scene.id, ...updates });
    sendMessage({ type: "tokenUpdate", payload: updated });
  };

  const handleDeleteToken = (tokenId: number) => {
    setTokens(prev => prev.filter(t => t.id !== tokenId));
    deleteTokenMut({ id: tokenId, sceneId: scene.id });
    sendMessage({ type: "tokenDelete", payload: { tokenId, sceneId: scene.id } });
  };

  return (
    <div className="relative overflow-auto border border-border/50 rounded-lg w-full h-[500px] md:h-[750px] bg-neutral-900 shadow-inner"
         style={scene.atmosphereUrl ? {
           backgroundImage: `url(${scene.atmosphereUrl})`,
           backgroundSize: 'cover',
           backgroundPosition: 'center'
         } : undefined}
    >
      <div 
        className="relative mx-auto my-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] ring-4 ring-black/80"
        style={{
          width: scene.gridWidth ? scene.gridWidth * gridSize : 800,
          height: scene.gridHeight ? scene.gridHeight * gridSize : 800,
          backgroundImage: scene.backgroundUrl ? `url(${scene.backgroundUrl})` : 'none',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#111',
        }}
      >
        {/* Draw Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.15]"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: `${gridSize}px ${gridSize}px`
          }}
        />

        {tokens.map(token => (
          <TokenNode 
            key={token.id}
            token={token}
            gridSize={gridSize}
            isGM={isGM}
            myCharacterId={myCharacterId}
            players={players}
            onMove={(x, y) => handleUpdatePosition(token, x, y)}
            onSaveSettings={(updates) => handleSaveSettings(token, updates)}
            onDelete={() => handleDeleteToken(token.id!)}
          />
        ))}
      </div>
    </div>
  );
}

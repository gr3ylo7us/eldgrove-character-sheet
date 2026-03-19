import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Scene, type Token, type ChatMessage } from "@shared/schema";

export function useGameChat(gameId: number) {
  return useQuery<ChatMessage[]>({
    queryKey: ["/api/games", gameId, "chat"],
    enabled: !!gameId,
  });
}

export function useCreateChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { gameId: number; type: string; content: string; senderName: string; characterId?: number }) => {
      const res = await fetch(`/api/games/${vars.gameId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    // We don't invalidate here because websockets will push the message to everyone (including the sender)
  });
}

export function useScenes(gameId: number) {
  return useQuery<Scene[]>({
    queryKey: ["/api/games", gameId, "scenes"],
    enabled: !!gameId,
  });
}

export function useCreateScene() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { gameId: number; name: string; backgroundUrl?: string; atmosphereUrl?: string; gridWidth?: number; gridHeight?: number }) => {
      const res = await fetch(`/api/games/${vars.gameId}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ["/api/games", vars.gameId, "scenes"] }),
  });
}

export function useUpdateScene() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: number; gameId: number; name?: string; backgroundUrl?: string; atmosphereUrl?: string; isActive?: boolean }) => {
      const res = await fetch(`/api/scenes/${vars.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ["/api/games", vars.gameId, "scenes"] }),
  });
}

export function useTokens(sceneId: number | undefined) {
  return useQuery<Token[]>({
    queryKey: ["/api/scenes", sceneId, "tokens"],
    enabled: !!sceneId,
  });
}

export function useCreateToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { sceneId: number; name: string; imageUrl?: string; characterId?: number; x?: number; y?: number }) => {
      const res = await fetch(`/api/scenes/${vars.sceneId}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ["/api/scenes", vars.sceneId, "tokens"] }),
  });
}

export function useUpdateToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: number; sceneId: number; name?: string; imageUrl?: string | null; characterId?: number | null; x?: number | null; y?: number | null; size?: number | null }) => {
      const res = await fetch(`/api/tokens/${vars.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ["/api/scenes", vars.sceneId, "tokens"] }),
  });
}

export function useDeleteToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: number; sceneId: number }) => {
      const res = await fetch(`/api/tokens/${vars.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      return res; // no json parsing for 204
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ["/api/scenes", vars.sceneId, "tokens"] }),
  });
}

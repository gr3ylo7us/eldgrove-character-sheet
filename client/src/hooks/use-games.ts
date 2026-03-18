import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Game, type GameMember, type Character } from "@shared/schema";

export function useGames() {
  return useQuery<{ game: Game; role: string }[]>({
    queryKey: ["/api/games"],
  });
}

export function useGame(id: number) {
  return useQuery<Game>({
    queryKey: [`/api/games/${id}`],
    enabled: !!id,
  });
}

export function useGameMembers(id: number) {
  return useQuery<(GameMember & { character?: Character | null })[]>({
    queryKey: [`/api/games/${id}/members`],
    enabled: !!id,
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch(api.games.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Game>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });
}

export function useJoinGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { inviteCode: string }) => {
      const res = await fetch(api.games.join.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Game>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });
}

export function useUpdateGameMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ gameId, characterId }: { gameId: number; characterId: number | null }) => {
      const url = buildUrl(api.games.updateMember.path, { id: gameId });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${variables.gameId}/members`] });
    },
  });
}

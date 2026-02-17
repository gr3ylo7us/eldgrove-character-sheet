import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { InsertCharacter, Character } from "@shared/schema";

export function useCharacters() {
  return useQuery<Character[]>({ queryKey: ["/api/characters"] });
}

export function useCharacter(id: number) {
  return useQuery<Character>({
    queryKey: ["/api/characters", id],
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertCharacter) => {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create character");
      return res.json() as Promise<Character>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Hero Born", description: "A new legend begins." });
    },
  });
}

export function useUpdateCharacter(id: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: Partial<InsertCharacter>) => {
      const res = await fetch(`/api/characters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update character");
      return res.json() as Promise<Character>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", id] });
      toast({ title: "Saved", description: "Character updated." });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/characters/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Fallen Hero", description: "Their memory fades.", variant: "destructive" });
    },
  });
}

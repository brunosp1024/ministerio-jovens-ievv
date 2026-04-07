"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { centsToNormalizedCurrency, normalizedCurrencyToCents } from "@/lib/currency";
import { financeiroApi } from "@/services/api";
import type { GanhoVenda, Jovem, VendaSemanal } from "@/types";

interface UseDistribuirGanhosModalParams {
  open: boolean;
  venda: VendaSemanal;
  jovens: Jovem[];
  onSuccess: () => void;
}

function criarEstadoInicial(jovens: Jovem[], ganhosSalvos: GanhoVenda[]) {
  const valores: Record<number, string> = {};

  jovens.forEach((jovem) => {
    valores[jovem.id] = "";
  });

  const selecionados = new Set<number>();

  ganhosSalvos.forEach((ganho) => {
    valores[ganho.jovem_id] = ganho.valor;
    selecionados.add(ganho.jovem_id);
  });

  return { valores, selecionados };
}

export function useDistribuirGanhosModal({ open, venda, jovens, onSuccess }: UseDistribuirGanhosModalParams) {
  const queryClient = useQueryClient();
  const [valores, setValores] = useState<Record<number, string>>({});
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [editando, setEditando] = useState(true);
  const estadoInicializadoRef = useRef<number | null>(null);

  const queryKey = ["ganhos-venda", venda.id] as const;

  const { data: ganhosSalvos = [], isLoading: loadingGanhos } = useQuery({
    queryKey,
    queryFn: () => financeiroApi.ganhosPorVenda(venda.id),
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      estadoInicializadoRef.current = null;
      setValores({});
      setSelecionados(new Set());
      setEditando(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open || loadingGanhos || estadoInicializadoRef.current === venda.id) {
      return;
    }

    const estadoInicial = criarEstadoInicial(jovens, ganhosSalvos);

    setValores(estadoInicial.valores);
    setSelecionados(estadoInicial.selecionados);
    setEditando(ganhosSalvos.length === 0);
    estadoInicializadoRef.current = venda.id;
  }, [open, loadingGanhos, venda.id, jovens, ganhosSalvos]);

  const distribuirMut = useMutation({
    mutationFn: financeiroApi.distribuirGanhos,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      onSuccess();
    },
    onError: () => toast.error("Erro ao distribuir ganhos."),
  });

  const lucroEmCentavos = normalizedCurrencyToCents(venda.lucro_liquido);
  const totalDistribuidoEmCentavos = Array.from(selecionados).reduce(
    (total, jovemId) => total + normalizedCurrencyToCents(valores[jovemId]),
    0,
  );
  const totalDistribuido = centsToNormalizedCurrency(totalDistribuidoEmCentavos);
  const lucroDisponivel = centsToNormalizedCurrency(lucroEmCentavos);
  const possuiDistribuicaoSalva = ganhosSalvos.length > 0;
  const bloqueado = possuiDistribuicaoSalva && !editando;
  const excedeLucro = totalDistribuidoEmCentavos > lucroEmCentavos;
  const statusMessage = loadingGanhos
    ? "Carregando distribuição salva..."
    : possuiDistribuicaoSalva
      ? bloqueado
        ? "Distribuição já salva. Clique em editar para desbloquear os campos."
        : "Editando distribuição salva."
      : "Nenhuma distribuição salva para esta semana.";
  const submitLabel = possuiDistribuicaoSalva ? "Salvar alterações" : "Distribuir";

  function habilitarEdicao() {
    setEditando(true);
  }

  function alternarSelecionado(jovemId: number, checked: boolean) {
    setSelecionados((atual) => {
      const next = new Set(atual);

      if (checked) {
        next.add(jovemId);
      } else {
        next.delete(jovemId);
      }

      return next;
    });
  }

  function atualizarValor(jovemId: number, value: string) {
    setValores((atual) => ({ ...atual, [jovemId]: value }));
  }

  function dividirIgualmente() {
    if (bloqueado || selecionados.size === 0) {
      return;
    }

    const valorPorJovemEmCentavos = Math.floor(lucroEmCentavos / selecionados.size);

    setValores((atual) => {
      const next = { ...atual };
      selecionados.forEach((jovemId) => {
        next[jovemId] = centsToNormalizedCurrency(valorPorJovemEmCentavos);
      });
      return next;
    });
  }

  function onSubmit() {
    if (bloqueado || excedeLucro) {
      return;
    }

    const distribuicoes = Array.from(selecionados)
      .map((jovemId) => ({ jovem_id: jovemId, valor: valores[jovemId] ?? "" }))
      .filter((distribuicao) => normalizedCurrencyToCents(distribuicao.valor) > 0);

    if (distribuicoes.length === 0) {
      toast.error("Selecione jovens e defina valores.");
      return;
    }

    distribuirMut.mutate({ venda_id: venda.id, distribuicoes });
  }

  return {
    bloqueado,
    editando,
    excedeLucro,
    loadingGanhos,
    lucroDisponivel,
    possuiDistribuicaoSalva,
    selecionados,
    statusMessage,
    submitLabel,
    totalDistribuido,
    valores,
    alternarSelecionado,
    atualizarValor,
    dividirIgualmente,
    habilitarEdicao,
    onSubmit,
    salvando: distribuirMut.isPending,
  };
}
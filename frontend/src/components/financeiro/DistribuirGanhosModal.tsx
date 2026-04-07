"use client";
import { useDistribuirGanhosModal } from "./useDistribuirGanhosModal";
import { Jovem, VendaSemanal } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Pencil } from "lucide-react";

interface Props {
  open: boolean;
  venda: VendaSemanal;
  jovens: Jovem[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function DistribuirGanhosModal({ open, venda, jovens, onClose, onSuccess }: Props) {
  const {
    bloqueado,
    editando,
    excedeLucro,
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
    salvando,
  } = useDistribuirGanhosModal({ open, venda, jovens, onSuccess });

  return (
    <Modal open={open} onClose={onClose} title="Distribuir Ganhos" size="md">
      <div className="space-y-4">
        <div className="distribuir__info">
          <p className="alert-info__title">Semana: {formatDate(venda.semana_inicio)} — {formatDate(venda.semana_fim)}</p>
          <p className="alert-info__text">Lucro líquido disponível: <strong>{formatCurrency(lucroDisponivel)}</strong></p>
        </div>

        <div className="flex items-center justify-between">
          <p className="form-label">Selecione os participantes</p>
          {possuiDistribuicaoSalva ? (
            bloqueado && (
              <Button variant="outline" size="sm" onClick={habilitarEdicao}>
                <Pencil className="w-4 h-4" /> Editar
              </Button>
            )
          ) : (
            <button onClick={dividirIgualmente} className="venda-form__add-item">
              Dividir igualmente entre selecionados
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500">{statusMessage}</p>

        <div className="distribuir__participants">
          {jovens.map((jovem) => (
            <div key={jovem.id} className="distribuir__participant">
              <input
                type="checkbox"
                id={`jov-${jovem.id}`}
                checked={selecionados.has(jovem.id)}
                onChange={(e) => alternarSelecionado(jovem.id, e.target.checked)}
                disabled={bloqueado}
                className="distribuir__checkbox"
              />
              <label htmlFor={`jov-${jovem.id}`} className={`flex-1 text-sm font-medium ${bloqueado ? "text-slate-500" : "text-slate-700 cursor-pointer"}`}>
                {jovem.nome}
              </label>
              <CurrencyInput
                value={valores[jovem.id] ?? ""}
                onValueChange={(value) => atualizarValor(jovem.id, value)}
                disabled={bloqueado || !selecionados.has(jovem.id)}
                wrapperClassName="w-24"
                className="px-2 py-1 text-right disabled:bg-slate-50 disabled:text-slate-400 focus:ring-1"
                placeholder="0,00"
              />
            </div>
          ))}
        </div>

        <div className="distribuir__footer">
          <div className="text-sm">
            <span className="text-slate-500">Total distribuído: </span>
            <span className={`font-bold ${excedeLucro ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(totalDistribuido)}
            </span>
            {excedeLucro && (
              <p className="distribuir__warning">⚠ Excede o lucro disponível</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            {editando && (
              <Button onClick={onSubmit} loading={salvando} disabled={excedeLucro}>
                <DollarSign className="w-4 h-4" /> {submitLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

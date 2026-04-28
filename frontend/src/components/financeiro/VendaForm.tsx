"use client";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeiroApi } from "@/services/api";
import { VendaSemanal, VendaSemanalCreate, Evento } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { eventosApi } from "@/services/api";
import Button from "@/components/ui/Button";
import CurrencyInput from "@/components/ui/CurrencyInput";
import DatePicker from "@/components/ui/DatePicker";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { centsToNormalizedCurrency, normalizedCurrencyToCents } from "@/lib/currency";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  editing: VendaSemanal | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VendaForm({ editing, onSuccess, onCancel }: Props) {
  const { data: eventos = [] } = useQuery<Evento[]>({
    queryKey: ["eventos"],
    queryFn: ({ queryKey }) => eventosApi.listar(),
  });
  const { register, handleSubmit, control, getValues, setValue } = useForm<VendaSemanalCreate>({
    defaultValues: editing
      ? {
          semana_inicio: editing.semana_inicio,
          semana_fim: editing.semana_fim,
          total_investido: editing.total_investido,
          total_arrecadado: editing.total_arrecadado,
          observacoes: editing.observacoes,
          evento_id: editing.evento_id,
          itens: editing.itens.map((i) => ({
            produto: i.produto,
            quantidade: i.quantidade,
            preco_unitario: i.preco_unitario,
            total: i.total,
          })),
        }
      : {
          itens: [{ produto: "", quantidade: 1, preco_unitario: "0", total: "0" }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const qc = useQueryClient();
  const createMut = useMutation({
    mutationFn: financeiroApi.criarVenda,
    onSuccess: () => {
      toast.success("Venda registrada!");
      qc.invalidateQueries({ queryKey: ["resumo-caixa"] });
      onSuccess();
    },
    onError: () => toast.error("Erro ao registrar venda."),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<VendaSemanalCreate> }) => financeiroApi.atualizarVenda(id, data),
    onSuccess: () => { toast.success("Venda atualizada!"); onSuccess(); },
    onError: () => toast.error("Erro ao atualizar venda."),
  });

  function onSubmit(data: VendaSemanalCreate) {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  }

  function getQuantidade(path: `itens.${number}.quantidade`) {
    const rawValue = getValues(path);
    return typeof rawValue === "number" && Number.isFinite(rawValue) ? rawValue : 0;
  }

  function updateItemTotal(index: number, quantidade: number, precoUnitario?: string) {
    const totalPath = `itens.${index}.total` as const;
    const precoEmCentavos = normalizedCurrencyToCents(precoUnitario);

    if (quantidade > 0 && precoEmCentavos > 0) {
      setValue(totalPath, centsToNormalizedCurrency(quantidade * precoEmCentavos), { shouldDirty: true });
      return;
    }

    setValue(totalPath, "", { shouldDirty: true });
  }

  function updateItemUnitPrice(index: number, quantidade: number, total?: string) {
    const precoPath = `itens.${index}.preco_unitario` as const;
    const totalEmCentavos = normalizedCurrencyToCents(total);

    if (quantidade > 0 && totalEmCentavos > 0) {
      setValue(precoPath, centsToNormalizedCurrency(Math.round(totalEmCentavos / quantidade)), { shouldDirty: true });
      return;
    }

    setValue(precoPath, "", { shouldDirty: true });
  }

  function renderCurrencyField(
    name: "total_investido" | "total_arrecadado",
    label: string,
    required = false,
  ) {
    return (
      <Controller
        control={control}
        name={name}
        rules={required ? { required: true } : undefined}
        render={({ field }) => (
          <CurrencyInput
            label={label}
            placeholder="0,00"
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
          />
        )}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="form-grid-2">
        <Controller
          control={control}
          name="semana_inicio"
          rules={{ required: true }}
          render={({ field }) => (
            <DatePicker
              label="Início da semana *"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              placeholder="dd/mm/aaaa"
            />
          )}
        />
        <Controller
          control={control}
          name="semana_fim"
          rules={{ required: true }}
          render={({ field }) => (
            <DatePicker
              label="Fim da semana *"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              placeholder="dd/mm/aaaa"
            />
          )}
        />
      </div>

      <div className="form-grid-2">
        {renderCurrencyField("total_investido", "Total investido (R$) *", true)}
        {renderCurrencyField("total_arrecadado", "Total arrecadado (R$) *", true)}
      </div>


      {/* Itens vendidos */}
      <div>
        <div className="venda-form__items-header">
          <label className="form-label">Itens vendidos</label>
          <button type="button" onClick={() => append({ produto: "", quantidade: 1, preco_unitario: "0", total: "0" })} className="venda-form__add-item">
            <Plus className="venda-form__add-icon" /> Adicionar item
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="venda-form__item-row">
              <div className="col-span-4">
                <input {...register(`itens.${idx}.produto`)} placeholder="Produto" className="venda-form__item-input" />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  {...register(`itens.${idx}.quantidade`, {
                    setValueAs: (value) => Number(value) || 0,
                    onChange: (event) => {
                      const quantidade = Number(event.target.value) || 0;
                      const precoPath = `itens.${idx}.preco_unitario` as const;
                      const totalPath = `itens.${idx}.total` as const;
                      const precoUnitario = getValues(precoPath);
                      const total = getValues(totalPath);

                      if (normalizedCurrencyToCents(precoUnitario) > 0) {
                        updateItemTotal(idx, quantidade, precoUnitario);
                        return;
                      }

                      if (normalizedCurrencyToCents(total) > 0) {
                        updateItemUnitPrice(idx, quantidade, total);
                      }
                    },
                  })}
                  placeholder="Qtd"
                  className="venda-form__item-input"
                />
              </div>
              <div className="col-span-2">
                <Controller
                  control={control}
                  name={`itens.${idx}.preco_unitario`}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        updateItemTotal(idx, getQuantidade(`itens.${idx}.quantidade`), value);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      placeholder="0,00"
                      wrapperClassName="space-y-0"
                      className="px-2 py-1.5 focus:ring-1"
                    />
                  )}
                />
              </div>
              <div className="col-span-3">
                <Controller
                  control={control}
                  name={`itens.${idx}.total`}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        updateItemUnitPrice(idx, getQuantidade(`itens.${idx}.quantidade`), value);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      placeholder="0,00"
                      wrapperClassName="space-y-0"
                      className="px-2 py-1.5 focus:ring-1"
                    />
                  )}
                />
              </div>
              <div className="col-span-1 flex justify-center">
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(idx)} className="venda-form__remove-btn">
                    <Trash2 className="venda-form__remove-icon" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="venda-form__hint">Produto | Qtd | Preço unit. | Total</p>
      </div>

      <div className="form-group">
        <Select
          label="Evento"
          {...register("evento_id")}
          options={[
            { label: "Selecione um evento", value: "" },
            ...eventos.map(ev => ({ label: ev.nome, value: String(ev.id) }))
          ]}
        />
      </div>
      <Input label="Observações" {...register("observacoes")} placeholder="Notas adicionais..." />

      <div className="form-actions">
        <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={createMut.isPending || updateMut.isPending}>{editing ? "Salvar" : "Registrar Venda"}</Button>
      </div>
    </form>
  );
}

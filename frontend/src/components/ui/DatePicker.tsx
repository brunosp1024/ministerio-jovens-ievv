"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface DatePickerProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  className?: string;
}

const weekDays = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

function parseValue(value?: string) {
  if (!value) {
    return null;
  }

  try {
    const dateOnly = value.includes("T") ? value.split("T")[0] : value;
    return parseISO(`${dateOnly}T00:00:00`);
  } catch {
    return null;
  }
}

function formatDisplay(value?: string, placeholder?: string) {
  const parsed = parseValue(value);
  if (!parsed) {
    return placeholder ?? "Selecione uma data";
  }

  return format(parsed, "dd/MM/yyyy", { locale: ptBR });
}

export default function DatePicker({
  label,
  error,
  placeholder,
  value,
  onChange,
  onBlur,
  name,
  disabled = false,
  className,
}: DatePickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonId = useId();
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;
  const selectedDate = parseValue(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate ?? new Date());
  const [inputValue, setInputValue] = useState(() => value ? formatDisplay(value) : "");

  useEffect(() => {
    setInputValue(value ? formatDisplay(value) : "");
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = raw;
    if (raw.length > 2) formatted = raw.slice(0, 2) + "/" + raw.slice(2);
    if (raw.length > 4) formatted = raw.slice(0, 2) + "/" + raw.slice(2, 4) + "/" + raw.slice(4);
    setInputValue(formatted);

    if (raw.length === 8) {
      const day = parseInt(raw.slice(0, 2), 10);
      const month = parseInt(raw.slice(2, 4), 10);
      const year = parseInt(raw.slice(4, 8), 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        onChange(iso);
      }
    }
  }

  function handleInputBlur() {
    const raw = inputValue.replace(/\D/g, "");
    if (raw.length === 0) {
      onChange("");
    } else if (raw.length < 8) {
      setInputValue(value ? formatDisplay(value) : "");
    }
    onBlur?.();
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        onBlurRef.current?.();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        onBlurRef.current?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const monthStart = startOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(viewDate), { locale: ptBR, weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  function handleSelectDay(day: Date) {
    onChange(format(day, "yyyy-MM-dd"));
    setViewDate(day);
    setOpen(false);
    onBlur?.();
  }

  function handleToday() {
    const today = new Date();
    onChange(format(today, "yyyy-MM-dd"));
    setViewDate(today);
    setOpen(false);
    onBlur?.();
  }

  function handleClear() {
    onChange("");
    setOpen(false);
    onBlur?.();
  }

  return (
    <div className={cn("form-group", className)} ref={pickerRef}>
      {label && <label className="form-label">{label}</label>}

      <div className="relative">
        <div
          className={cn(
            "datepicker__trigger",
            error ? "datepicker__trigger--error" : "datepicker__trigger--default",
            disabled && "datepicker__trigger--disabled"
          )}
        >
          <input
            id={buttonId}
            type="text"
            inputMode="numeric"
            name={name}
            disabled={disabled}
            placeholder={placeholder ?? "dd/mm/aaaa"}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => setOpen(true)}
            className="datepicker__input"
            autoComplete="off"
          />

          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((current) => !current)}
            className="datepicker__trigger-badge"
            tabIndex={-1}
            aria-label="Abrir calendário"
          >
            <CalendarDays className="datepicker__trigger-badge-icon" />
          </button>
        </div>

        {open && (
          <div className="datepicker__dropdown">
            <div className="datepicker__header">
              <div className="datepicker__header-nav">
                <button
                  type="button"
                  onClick={() => setViewDate((current) => addMonths(current, -1))}
                  className="datepicker__nav-btn"
                >
                  <ChevronLeft className="datepicker__nav-icon" />
                </button>
                <div className="text-center">
                  <p className="datepicker__month-label">{format(viewDate, "MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewDate((current) => addMonths(current, 1))}
                  className="datepicker__nav-btn"
                >
                  <ChevronRight className="datepicker__nav-icon" />
                </button>
              </div>
            </div>

            <div className="datepicker__calendar">
              <div className="datepicker__weekdays">
                {weekDays.map((weekDay) => (
                  <div key={weekDay} className="datepicker__weekday">
                    {weekDay}
                  </div>
                ))}
              </div>

              <div className="datepicker__days-grid">
                {days.map((day) => {
                  const selected = !!selectedDate && isSameDay(day, selectedDate);
                  const currentMonth = isSameMonth(day, viewDate);
                  const today = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={cn(
                        "datepicker__day",
                        selected && "datepicker__day--selected",
                        !selected && currentMonth && "datepicker__day--current",
                        !selected && !currentMonth && "datepicker__day--other",
                        today && !selected && "datepicker__day--today"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              <div className="datepicker__footer">
                <button
                  type="button"
                  onClick={handleClear}
                  className="datepicker__clear-btn"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="datepicker__today-btn"
                >
                  Hoje
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
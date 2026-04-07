"use client";
import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  loading?: boolean;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title = "Confirmar ação", message, loading }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="confirm-dialog">
        <div className="confirm-dialog__icon">
          <AlertTriangle className="confirm-dialog__icon-svg" />
        </div>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>Confirmar</Button>
        </div>
      </div>
    </Modal>
  );
}

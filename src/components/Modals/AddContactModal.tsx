import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (pin: string) => void;
}

export const AddContactModal: React.FC<Props> = ({ isOpen, onClose, onAddContact }) => {
  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = pin.trim().toUpperCase();
    if (!trimmed || trimmed.length !== 8) {
      alert('PIN harus 8 digit!');
      return;
    }
    onAddContact(trimmed);
    setPin('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xs p-4 shadow-2xl border border-white">
        <h3 className="font-bold text-sm text-slate-800 mb-1">Tambah Kontak Baru</h3>
        <p className="text-xs text-slate-500 mb-3">Masukkan 8 digit PIN Chatzz temanmu.</p>
        <input
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value.toUpperCase())}
          placeholder="Contoh: ZZ8K9X2P"
          maxLength={8}
          className="w-full inset-panel px-3 py-2 text-xs uppercase font-mono font-bold tracking-wider mb-3 outline-none text-center"
        />
        <div className="flex space-x-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 btn-jelly py-2 rounded-xl text-xs font-bold"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

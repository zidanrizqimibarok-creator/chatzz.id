import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveSchedule: (timeVal: string, text: string) => void;
}

export const ScheduleModal: React.FC<Props> = ({ isOpen, onClose, onSaveSchedule }) => {
  const [timeVal, setTimeVal] = useState('');
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedText = text.trim();
    if (!timeVal || !trimmedText) {
      alert('Lengkapi waktu dan isi pesan!');
      return;
    }
    const targetTime = new Date(timeVal).getTime();
    if (targetTime <= Date.now()) {
      alert('Waktu harus di masa depan!');
      return;
    }
    onSaveSchedule(timeVal, trimmedText);
    setText('');
    setTimeVal('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xs p-4 shadow-2xl border border-white">
        <h3 className="font-bold text-sm text-slate-800 mb-1">Kirim Pesan Terjadwal</h3>
        <p className="text-xs text-slate-500 mb-3">Pesan dikirim otomatis pada waktu yang diatur.</p>
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              WAKTU PENGIRIMAN
            </label>
            <input
              type="datetime-local"
              value={timeVal}
              onChange={(e) => setTimeVal(e.target.value)}
              className="w-full inset-panel px-3 py-2 text-xs outline-none rounded-xl"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              ISI PESAN
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="Tulis pesan..."
              className="w-full inset-panel p-2 text-xs outline-none rounded-xl resize-none"
            />
          </div>
        </div>
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
            Jadwalkan
          </button>
        </div>
      </div>
    </div>
  );
};

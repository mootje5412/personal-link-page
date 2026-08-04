import { useEffect, useState } from 'react';
import { TOKEN_DEFS, type WalletState } from '../utils/wallet';
import './AddFundsModal.css';

interface AddFundsModalProps {
  open: boolean;
  onClose: () => void;
  wallet: WalletState;
  onSave: (wallet: WalletState) => void;
}

export default function AddFundsModal({ open, onClose, wallet, onSave }: AddFundsModalProps) {
  const [cash, setCash] = useState(String(wallet.cash));
  const [eth, setEth] = useState(String(wallet.holdings.ethereum ?? 0));
  const [sol, setSol] = useState(String(wallet.holdings.solana ?? 0));

  useEffect(() => {
    if (open) {
      setCash(String(wallet.cash));
      setEth(String(wallet.holdings.ethereum ?? 0));
      setSol(String(wallet.holdings.solana ?? 0));
    }
  }, [open, wallet]);

  if (!open) return null;

  const apply = () => {
    const next: WalletState = {
      ...wallet,
      cash: parseFloat(cash) || 0,
      holdings: {
        ...wallet.holdings,
        ethereum: parseFloat(eth) || 0,
        solana: parseFloat(sol) || 0,
      },
    };
    onSave(next);
    onClose();
  };

  const quickAdd = (type: 'cash' | 'eth' | 'sol', amount: number) => {
    if (type === 'cash') setCash(String((parseFloat(cash) || 0) + amount));
    if (type === 'eth') setEth(String((parseFloat(eth) || 0) + amount));
    if (type === 'sol') setSol(String((parseFloat(sol) || 0) + amount));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2>Add funds</h2>
        <p className="modal-sub">Set your balance — saved on this device only.</p>

        <label className="field">
          <span>Cash (EUR)</span>
          <input type="number" step="any" value={cash} onChange={(e) => setCash(e.target.value)} />
          <div className="quick-row">
            {[10, 50, 100, 500].map((n) => (
              <button key={n} type="button" onClick={() => quickAdd('cash', n)}>
                +€{n}
              </button>
            ))}
          </div>
        </label>

        {TOKEN_DEFS.map((token) => {
          const val = token.id === 'ethereum' ? eth : sol;
          const set = token.id === 'ethereum' ? setEth : setSol;
          const quick = token.id === 'ethereum' ? 0.1 : 1;
          return (
            <label key={token.id} className="field">
              <span>{token.name} ({token.symbol})</span>
              <input type="number" step="any" value={val} onChange={(e) => set(e.target.value)} />
              <div className="quick-row">
                <button type="button" onClick={() => quickAdd(token.id === 'ethereum' ? 'eth' : 'sol', quick)}>
                  +{quick} {token.symbol}
                </button>
                <button type="button" onClick={() => quickAdd(token.id === 'ethereum' ? 'eth' : 'sol', quick * 5)}>
                  +{quick * 5} {token.symbol}
                </button>
              </div>
            </label>
          );
        })}

        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="modal-save" onClick={apply}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

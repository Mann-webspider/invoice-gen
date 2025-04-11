import React from 'react';
import { Invoice } from '../../lib/types';

interface TotalsSectionProps {
  invoice: Invoice;
  onTaxOptionChange: (option: 'with' | 'without') => void;
  onAmountInWordsChange: (words: string) => void;
}

const TotalsSection: React.FC<TotalsSectionProps> = ({
  invoice,
  onTaxOptionChange,
  onAmountInWordsChange
}) => {
  return (
    <div className="totals-section">
      <div className="tax-options">
        <h3>Tax Payment Option</h3>
        <label>
          <input
            type="radio"
            name="taxOption"
            checked={invoice.taxPaymentOption === 'with'}
            onChange={() => onTaxOptionChange('with')}
          />
          With Tax
        </label>
        <label>
          <input
            type="radio"
            name="taxOption"
            checked={invoice.taxPaymentOption === 'without'}
            onChange={() => onTaxOptionChange('without')}
          />
          Without Tax
        </label>
      </div>

      <div className="totals-display">
        <div className="total-row">
          <span>Total SQM:</span>
          <span>{invoice.totalSQM.toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Total FOB (Euro):</span>
          <span>{invoice.totalFOBEuro.toFixed(2)}</span>
        </div>
      </div>

      <div className="amount-in-words">
        <label>Amount in Words:</label>
        <textarea
          value={invoice.amountInWords}
          onChange={(e) => onAmountInWordsChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};

export default TotalsSection;

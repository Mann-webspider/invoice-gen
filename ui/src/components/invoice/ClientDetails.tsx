import React from 'react';
import { Client, ShippingTerm, Invoice } from '../../lib/types';

interface ClientDetailsProps {
  client: Client;
  shippingTerm: ShippingTerm;
  onClientChange: (client: Partial<Client>) => void;
  onShippingTermChange: (term: Partial<ShippingTerm>) => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({
  client,
  shippingTerm,
  onClientChange,
  onShippingTermChange
}) => {
  return (
    <div className="client-details">
      <h3>Client Information</h3>
      <div className="form-group">
        <label>Consignee:</label>
        <input
          type="text"
          value={client.consignee}
          onChange={(e) => onClientChange({ consignee: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Notify Party:</label>
        <input
          type="text"
          value={client.notifyParty}
          onChange={(e) => onClientChange({ notifyParty: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Buyer Order No Format:</label>
        <input
          type="text"
          value={client.buyerOrderNoFormat}
          onChange={(e) => onClientChange({ buyerOrderNoFormat: e.target.value })}
        />
      </div>

      <h3>Shipping Terms</h3>
      <div className="form-group">
        <label>FOB:</label>
        <input
          type="text"
          value={shippingTerm.fob}
          onChange={(e) => onShippingTermChange({ fob: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Port:</label>
        <input
          type="text"
          value={shippingTerm.port}
          onChange={(e) => onShippingTermChange({ port: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Currency:</label>
        <input
          type="number"
          value={shippingTerm.euroRate}
          onChange={(e) => onShippingTermChange({ euroRate: parseFloat(e.target.value) })}
        />
      </div>
    </div>
  );
};

export default ClientDetails;

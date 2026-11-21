import React from 'react';
import { ChevronRight } from 'lucide-react';

export function PanelHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action && (
        <button className="text-button" onClick={onAction}>
          {action}
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}

export default PanelHeader;

import React from 'react';
import { AnamneseMetricas } from '../../../types/anamnese';

interface MetricasCardsProps {
  metricas: AnamneseMetricas | null;
  loading: boolean;
}

export const MetricasCards: React.FC<MetricasCardsProps> = ({ metricas, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metricas) return null;

  const cards = [
    {
      label: 'Total',
      value: metricas.total,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: '📋'
    },
    {
      label: 'Preenchidas',
      value: metricas.preenchidas,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: '✅'
    },
    {
      label: 'Em Preenchimento',
      value: metricas.em_preenchimento,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: '⏳'
    },
    {
      label: 'Expiradas',
      value: metricas.expiradas,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: '❌'
    },
    {
      label: 'Taxa de Conversão',
      value: `${metricas.taxa_conversao}%`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: '📈'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className={`${card.bgColor} rounded-lg shadow p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{card.icon}</span>
          </div>
          <div className={`text-3xl font-bold ${card.color} mb-1`}>
            {card.value}
          </div>
          <div className="text-sm text-gray-600">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
};
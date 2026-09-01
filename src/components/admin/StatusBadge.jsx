import React from 'react';
import { Badge } from '../ui/Badge';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'CONFIRMED':
    case 'PUBLISHED':
    case 'ACTIVE':
    case 'PAID':
    case 'SUCCESSFUL':
    case 'DELIVERED':
      return <Badge variant="emerald" dot>{status}</Badge>;

    case 'CLEANING':
    case 'PROCESSING':
    case 'INSPECTION':
    case 'FINISHING':
    case 'INITIATED':
      return <Badge variant="brand" dot>{status}</Badge>;

    case 'PICKUP_SCHEDULED':
    case 'PICKED_UP':
    case 'PACKED':
      return <Badge variant="royal">{status}</Badge>;

    case 'OUT_FOR_DELIVERY':
    case 'PENDING':
    case 'DRAFT':
      return <Badge variant="amber">{status}</Badge>;

    case 'CANCELLED':
    case 'FAILED':
    case 'ARCHIVED':
    case 'REFUNDED':
      return <Badge variant="rose">{status}</Badge>;

    default:
      return <Badge variant="slate">{status}</Badge>;
  }
};

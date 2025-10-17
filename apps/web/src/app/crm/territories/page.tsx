'use client';

import React from 'react';
import { TerritoryManagement } from '@/components/modules/crm';

const TerritoriesPage: React.FC = () => {
  const handleCreateTerritory = () => {
    console.log('Create new territory');
    // TODO: Implement territory creation
  };

  const handleEditTerritory = (territory: any) => {
    console.log('Edit territory:', territory);
    // TODO: Implement territory editing
  };

  const handleViewTerritory = (territory: any) => {
    console.log('View territory:', territory);
    // TODO: Implement territory view
  };

  return (
    <TerritoryManagement
      onCreateTerritory={handleCreateTerritory}
      onEditTerritory={handleEditTerritory}
      onViewTerritory={handleViewTerritory}
    />
  );
};

export default TerritoriesPage;
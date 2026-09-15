import React from 'react';
import { AdminDashboard } from './AdminDashboard';
import { DoctorDashboard } from './DoctorDashboard';
import { FrontDeskDashboard } from './FrontDeskDashboard';
import { LabAssistantDashboard } from './LabAssistantDashboard';
import { PharmacyDashboard } from './PharmacyDashboard';

export function Dashboard(props) {
  const normRole = (props.profile?.role || 'Admin').toLowerCase().trim();

  if (normRole.includes('doctor') || normRole.includes('physician')) {
    return <DoctorDashboard {...props} />;
  }
  if (normRole.includes('lab') || normRole.includes('patholog')) {
    return <LabAssistantDashboard {...props} />;
  }
  if (normRole.includes('pharm')) {
    return <PharmacyDashboard {...props} onAddPharmacySale={() => props.onNavigate && props.onNavigate('/pharmacy/new')} />;
  }
  if (normRole.includes('front') || normRole.includes('reception')) {
    return <FrontDeskDashboard {...props} />;
  }
  return <AdminDashboard {...props} />;
}

export default Dashboard;

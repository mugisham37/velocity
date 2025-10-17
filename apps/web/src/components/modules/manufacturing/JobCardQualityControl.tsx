'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  Eye,
  FileText,
  Settings
} from 'lucide-react';
import { JobCard, JobCardQualityInspection } from '@/types/manufacturing';

interface JobCardQualityControlProps {
  jobCardData: Partial<JobCard>;
  onChange: (data: Partial<JobCard>) => void;
}

interface QualityParameter {
  parameter: string;
  specification: string;
  min_value?: number;
  max_value?: number;
  actual_value?: number;
  status: 'Pass' | 'Fail' | 'Pending';
  remarks?: string;
}

export function JobCardQualityControl({ jobCardData, onChange }: JobCardQualityControlProps) {
  const [qualityParameters, setQualityParameters] = useState<QualityParameter[]>([
    {
      parameter: 'Dimension Check',
      specification: '100mm ± 0.5mm',
      min_value: 99.5,
      max_value: 100.5,
      status: 'Pending'
    },
    {
      parameter: 'Surface Finish',
      specification: 'Ra 1.6 μm',
      status: 'Pending'
    },
    {
      parameter: 'Visual Inspection',
      specification: 'No defects',
      status: 'Pending'
    }
  ]);

  const [newInspection, setNewInspection] = useState<Partial<JobCardQualityInspection>>({
    inspection_type: 'In Process',
    reference_type: 'Job Card',
    status: 'Pending'
  });

  const [showAddInspection, setShowAddInspection] = useState(false);

  const handleParameterChange = (index: number, field: keyof QualityParameter, value: any) => {
    const updatedParameters = [...qualityParameters];
    updatedParameters[index] = { ...updatedParameters[index], [field]: value };
    
    // Auto-calculate status for numeric parameters
    if (field === 'actual_value' && updatedParameters[index].min_value !== undefined && updatedParameters[index].max_value !== undefined) {
      const actual = parseFloat(value);
      const min = updatedParameters[index].min_value!;
      const max = updatedParameters[index].max_value!;
      updatedParameters[index].status = (actual >= min && actual <= max) ? 'Pass' : 'Fail';
    }
    
    setQualityParameters(updatedParameters);
  };

  const handleAddInspection = () => {
    if (newInspection.quality_inspection) {
      const inspection: JobCardQualityInspection = {
        quality_inspection: newInspection.quality_inspection,
        inspection_type: newInspection.inspection_type || 'In Process',
        reference_type: 'Job Card',
        reference_name: jobCardData.name || '',
        status: newInspection.status || 'Pending'
      };
      
      const updatedInspections = [...(jobCardData.quality_inspections || []), inspection];
      onChange({ quality_inspections: updatedInspections });
      
      setNewInspection({
        inspection_type: 'In Process',
        reference_type: 'Job Card',
        status: 'Pending'
      });
      setShowAddInspection(false);
    }
  };

  const handleRemoveInspection = (index: number) => {
    const updatedInspections = (jobCardData.quality_inspections || []).filter((_, i) => i !== index);
    onChange({ quality_inspections: updatedInspections });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pass':
      case 'Accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Fail':
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass':
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Fail':
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const passedParameters = qualityParameters.filter(p => p.status === 'Pass').length;
  const failedParameters = qualityParameters.filter(p => p.status === 'Fail').length;
  const pendingParameters = qualityParameters.filter(p => p.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Quality Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-gray-600">Passed</p>
            <p className="text-2xl font-bold text-green-600">{passedParameters}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failedParameters}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingParameters}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Settings className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">{qualityParameters.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Quality Parameters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Parameter</th>
                  <th className="text-left py-2">Specification</th>
                  <th className="text-center py-2">Actual Value</th>
                  <th className="text-center py-2">Status</th>
                  <th className="text-left py-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {qualityParameters.map((param, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{param.parameter}</td>
                    <td className="py-3">{param.specification}</td>
                    <td className="py-3 text-center">
                      {param.min_value !== undefined && param.max_value !== undefined ? (
                        <Input
                          type="number"
                          className="w-20 text-center"
                          value={param.actual_value || ''}
                          onChange={(e) => handleParameterChange(index, 'actual_value', e.target.value)}
                          placeholder="Value"
                        />
                      ) : (
                        <select
                          className="border rounded px-2 py-1"
                          value={param.status}
                          onChange={(e) => handleParameterChange(index, 'status', e.target.value as any)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {getStatusIcon(param.status)}
                        <Badge className={getStatusColor(param.status)}>
                          {param.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3">
                      <Input
                        type="text"
                        className="w-full"
                        value={param.remarks || ''}
                        onChange={(e) => handleParameterChange(index, 'remarks', e.target.value)}
                        placeholder="Add remarks..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quality Inspections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Quality Inspections</span>
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddInspection(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Inspection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Inspection Form */}
          {showAddInspection && (
            <Card className="mb-4 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Inspection
                    </label>
                    <Input
                      type="text"
                      placeholder="QI-2024-001"
                      value={newInspection.quality_inspection || ''}
                      onChange={(e) => setNewInspection(prev => ({ ...prev, quality_inspection: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inspection Type
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={newInspection.inspection_type || 'In Process'}
                      onChange={(e) => setNewInspection(prev => ({ ...prev, inspection_type: e.target.value }))}
                    >
                      <option value="Incoming">Incoming</option>
                      <option value="In Process">In Process</option>
                      <option value="Final">Final</option>
                      <option value="Outgoing">Outgoing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={newInspection.status || 'Pending'}
                      onChange={(e) => setNewInspection(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddInspection(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddInspection}
                  >
                    Add Inspection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inspections List */}
          {!jobCardData.quality_inspections || jobCardData.quality_inspections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quality inspections recorded</p>
              <p className="text-sm">Add quality inspections to track quality control</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobCardData.quality_inspections.map((inspection, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{inspection.quality_inspection}</p>
                          <p className="text-sm text-gray-600">
                            {inspection.inspection_type} Inspection
                          </p>
                        </div>
                        <Badge className={getStatusColor(inspection.status)}>
                          {inspection.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInspection(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Quality Inspection Template</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality Inspection Template
              </label>
              <Input
                type="text"
                placeholder="Select Quality Inspection Template"
                value={jobCardData.quality_inspection_template || ''}
                onChange={(e) => onChange({ quality_inspection_template: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Select a template to auto-populate quality parameters
              </p>
            </div>
            
            {jobCardData.quality_inspection_template && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Template Applied</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Quality parameters have been loaded from the template: {jobCardData.quality_inspection_template}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
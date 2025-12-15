'use client';

import React, { useState, useEffect } from 'react';
import { policyService } from '@/lib/policy';
import type { PolicyTemplate, PolicyFormData, PolicyCategory } from '@/types/policy';

interface PolicyTemplateManagerProps {
  landlordId: string;
  onTemplateSelect?: (template: PolicyTemplate) => void;
  mode?: 'select' | 'manage';
}

const POLICY_CATEGORIES: { value: PolicyCategory; label: string }[] = [
  { value: 'rental_terms', label: 'Rental Terms' },
  { value: 'house_rules', label: 'House Rules' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'security', label: 'Security' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'guest_policy', label: 'Guest Policy' },
  { value: 'pet_policy', label: 'Pet Policy' },
  { value: 'smoking_policy', label: 'Smoking Policy' },
  { value: 'cleaning_policy', label: 'Cleaning Policy' },
  { value: 'cancellation_policy', label: 'Cancellation Policy' },
  { value: 'custom', label: 'Custom' }
];

export default function PolicyTemplateManager({ 
  landlordId, 
  onTemplateSelect, 
  mode = 'manage' 
}: PolicyTemplateManagerProps) {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PolicyTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory | 'all'>('all');

  useEffect(() => {
    loadTemplates();
  }, [landlordId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await policyService.getPolicyTemplates(landlordId);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (formData: PolicyFormData) => {
    try {
      await policyService.createPolicyTemplate(formData);
      await loadTemplates();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  const handleUpdateTemplate = async (id: string, formData: Partial<PolicyFormData>) => {
    try {
      await policyService.updatePolicyTemplate(id, formData);
      await loadTemplates();
      setEditingTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await policyService.deletePolicyTemplate(id);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const systemTemplates = filteredTemplates.filter(t => t.isSystemTemplate);
  const customTemplates = filteredTemplates.filter(t => !t.isSystemTemplate);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Policy Templates</h2>
          <p className="text-gray-600">Manage your custom policy templates</p>
        </div>
        {mode === 'manage' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Template
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Categories
        </button>
        {POLICY_CATEGORIES.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedCategory === category.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* System Templates */}
      {systemTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">System Templates</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {systemTemplates.map(template => (
              <PolicyTemplateCard
                key={template.id}
                template={template}
                mode={mode}
                onSelect={onTemplateSelect}
                onEdit={() => {}} // System templates can't be edited
                onDelete={() => {}} // System templates can't be deleted
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Templates</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map(template => (
              <PolicyTemplateCard
                key={template.id}
                template={template}
                mode={mode}
                onSelect={onTemplateSelect}
                onEdit={() => setEditingTemplate(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
              />
            ))}
          </div>
        </div>
      )}

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No templates found for the selected category.</p>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateForm && (
        <PolicyTemplateForm
          onSubmit={handleCreateTemplate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <PolicyTemplateForm
          template={editingTemplate}
          onSubmit={(data) => handleUpdateTemplate(editingTemplate.id, data)}
          onCancel={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}

interface PolicyTemplateCardProps {
  template: PolicyTemplate;
  mode: 'select' | 'manage';
  onSelect?: (template: PolicyTemplate) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PolicyTemplateCard({ template, mode, onSelect, onEdit, onDelete }: PolicyTemplateCardProps) {
  const categoryLabel = POLICY_CATEGORIES.find(c => c.value === template.category)?.label || template.category;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{template.title}</h4>
        <span className={`px-2 py-1 text-xs rounded-full ${
          template.isSystemTemplate 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {template.isSystemTemplate ? 'System' : 'Custom'}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">{categoryLabel}</p>
      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{template.description}</p>
      
      {template.defaultValue && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Default Value:</p>
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded text-xs">
            {template.defaultValue}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        {mode === 'select' && onSelect && (
          <button
            onClick={() => onSelect(template)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Select
          </button>
        )}
        
        {mode === 'manage' && !template.isSystemTemplate && (
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface PolicyTemplateFormProps {
  template?: PolicyTemplate;
  onSubmit: (data: PolicyFormData) => void;
  onCancel: () => void;
}

function PolicyTemplateForm({ template, onSubmit, onCancel }: PolicyTemplateFormProps) {
  const [formData, setFormData] = useState<PolicyFormData>({
    title: template?.title || '',
    description: template?.description || '',
    category: template?.category || 'custom',
    isRequired: false, // Templates don't have isRequired, this is for policies
    defaultValue: template?.defaultValue || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">
          {template ? 'Edit Template' : 'Create Template'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as PolicyCategory })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {POLICY_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Value
            </label>
            <textarea
              value={formData.defaultValue}
              onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Default policy text..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRequired"
              checked={formData.isRequired}
              onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isRequired" className="ml-2 text-sm text-gray-700">
              Required for all properties
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {template ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
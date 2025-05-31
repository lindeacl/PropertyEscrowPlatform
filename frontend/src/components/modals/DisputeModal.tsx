import React, { useState } from 'react';
import { X, AlertTriangle, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string, evidence: File[]) => Promise<void>;
  escrowId: number;
}

const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  escrowId
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const disputeReasons = [
    'Property condition not as described',
    'Seller breach of contract',
    'Buyer breach of contract',
    'Documentation issues',
    'Inspection concerns',
    'Financing problems',
    'Title issues',
    'Other'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setEvidence(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setEvidence(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason || !description.trim()) {
      toast.error('Please provide both reason and description');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(reason, description, evidence);
      setReason('');
      setDescription('');
      setEvidence([]);
      onClose();
    } catch (error) {
      console.error('Failed to submit dispute:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-danger-500 mr-3" />
              <h2 className="text-xl font-semibold text-text-primary">
                Raise Dispute - Escrow #{escrowId}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-background rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Dispute Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary"
                required
              >
                <option value="">Select a reason</option>
                {disputeReasons.map((disputeReason) => (
                  <option key={disputeReason} value={disputeReason}>
                    {disputeReason}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Detailed Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide a detailed explanation of the dispute, including relevant dates, communications, and specific issues..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary"
                rows={5}
                required
              />
              <p className="text-xs text-text-secondary mt-1">
                Minimum 50 characters required
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Supporting Evidence
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-text-secondary mb-2" />
                  <p className="text-sm text-text-secondary mb-2">
                    Upload documents, photos, or other evidence
                  </p>
                  <input
                    type="file"
                    id="evidence-upload"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('evidence-upload')?.click()}
                    className="btn-secondary text-sm"
                  >
                    Choose Files
                  </button>
                </div>
              </div>

              {evidence.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-text-primary">
                    Uploaded Files ({evidence.length})
                  </p>
                  {evidence.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-background rounded-lg"
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-text-secondary mr-2" />
                        <span className="text-sm text-text-primary">{file.name}</span>
                        <span className="text-xs text-text-secondary ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-danger-500 hover:text-danger-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-accent-600 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-accent-700 mb-1">Important Notice</p>
                  <ul className="text-accent-600 space-y-1">
                    <li>• Disputes will be reviewed by the assigned arbiter</li>
                    <li>• All evidence and communications will be recorded on-chain</li>
                    <li>• False or frivolous disputes may result in penalties</li>
                    <li>• The arbiter's decision will be binding and final</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-danger"
                disabled={loading || !reason || description.length < 50}
              >
                {loading ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DisputeModal;
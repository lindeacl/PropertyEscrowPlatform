import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { 
  ArrowLeft, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  DollarSign,
  Users,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CreateEscrowParams } from '../types';

const CreateEscrow: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, signer } = useWallet();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<CreateEscrowParams>({
    buyer: '',
    seller: '',
    agent: '',
    arbiter: '',
    tokenAddress: '',
    depositAmount: '',
    depositDeadline: 0,
    propertyId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.propertyId.trim()) {
          newErrors.propertyId = 'Property ID is required';
        }
        if (!formData.depositAmount || parseFloat(formData.depositAmount) <= 0) {
          newErrors.depositAmount = 'Valid deposit amount is required';
        }
        if (!formData.depositDeadline || formData.depositDeadline <= Date.now() / 1000) {
          newErrors.depositDeadline = 'Deadline must be in the future';
        }
        break;
      
      case 2:
        if (!formData.buyer.trim()) {
          newErrors.buyer = 'Buyer address is required';
        }
        if (!formData.seller.trim()) {
          newErrors.seller = 'Seller address is required';
        }
        if (!formData.agent.trim()) {
          newErrors.agent = 'Agent address is required';
        }
        if (!formData.arbiter.trim()) {
          newErrors.arbiter = 'Arbiter address is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (field: keyof CreateEscrowParams, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCreateEscrow = async () => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!validateStep(2)) {
      return;
    }

    setLoading(true);
    try {
      // This will be implemented once contracts are deployed
      toast.success('Escrow creation will be available once contracts are deployed');
      
      // Placeholder for actual contract interaction:
      // const factory = getContract(CONTRACT_ADDRESSES.ESCROW_FACTORY, ESCROW_FACTORY_ABI, signer);
      // const tx = await factory.createEscrow(...formData);
      // await tx.wait();
      
      // navigate('/');
    } catch (error) {
      console.error('Failed to create escrow:', error);
      toast.error('Failed to create escrow');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-text-secondary mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Wallet Required</h2>
        <p className="text-text-secondary">Please connect your wallet to create an escrow</p>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Property Details', icon: FileText },
    { number: 2, title: 'Participants', icon: Users },
    { number: 3, title: 'Review & Create', icon: CheckCircle }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/')}
          className="mr-4 p-2 text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Create New Escrow</h1>
          <p className="text-text-secondary">Set up a secure property transaction</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number 
                  ? 'bg-primary border-primary text-white' 
                  : 'border-border text-text-secondary'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-text-primary' : 'text-text-secondary'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="card">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Property Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Property ID
              </label>
              <input
                type="text"
                value={formData.propertyId}
                onChange={(e) => handleInputChange('propertyId', e.target.value)}
                className={`input-field ${errors.propertyId ? 'border-danger' : ''}`}
                placeholder="e.g., PROP-2024-001"
              />
              {errors.propertyId && (
                <p className="mt-1 text-sm text-danger">{errors.propertyId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Deposit Amount (ETH)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-text-secondary" />
                <input
                  type="number"
                  step="0.001"
                  value={formData.depositAmount}
                  onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                  className={`input-field pl-10 ${errors.depositAmount ? 'border-danger' : ''}`}
                  placeholder="0.0"
                />
              </div>
              {errors.depositAmount && (
                <p className="mt-1 text-sm text-danger">{errors.depositAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Deposit Deadline
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-text-secondary" />
                <input
                  type="datetime-local"
                  value={formData.depositDeadline ? new Date(formData.depositDeadline * 1000).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('depositDeadline', new Date(e.target.value).getTime() / 1000)}
                  className={`input-field pl-10 ${errors.depositDeadline ? 'border-danger' : ''}`}
                />
              </div>
              {errors.depositDeadline && (
                <p className="mt-1 text-sm text-danger">{errors.depositDeadline}</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Transaction Participants</h2>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Buyer Address
              </label>
              <input
                type="text"
                value={formData.buyer}
                onChange={(e) => handleInputChange('buyer', e.target.value)}
                className={`input-field font-mono ${errors.buyer ? 'border-danger' : ''}`}
                placeholder="0x..."
              />
              {errors.buyer && (
                <p className="mt-1 text-sm text-danger">{errors.buyer}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Seller Address
              </label>
              <input
                type="text"
                value={formData.seller}
                onChange={(e) => handleInputChange('seller', e.target.value)}
                className={`input-field font-mono ${errors.seller ? 'border-danger' : ''}`}
                placeholder="0x..."
              />
              {errors.seller && (
                <p className="mt-1 text-sm text-danger">{errors.seller}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Agent Address
              </label>
              <input
                type="text"
                value={formData.agent}
                onChange={(e) => handleInputChange('agent', e.target.value)}
                className={`input-field font-mono ${errors.agent ? 'border-danger' : ''}`}
                placeholder="0x..."
              />
              {errors.agent && (
                <p className="mt-1 text-sm text-danger">{errors.agent}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Arbiter Address
              </label>
              <input
                type="text"
                value={formData.arbiter}
                onChange={(e) => handleInputChange('arbiter', e.target.value)}
                className={`input-field font-mono ${errors.arbiter ? 'border-danger' : ''}`}
                placeholder="0x..."
              />
              {errors.arbiter && (
                <p className="mt-1 text-sm text-danger">{errors.arbiter}</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Review Escrow Details</h2>
            
            <div className="bg-background rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Property ID:</span>
                <span className="font-medium">{formData.propertyId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Deposit Amount:</span>
                <span className="font-mono">{formData.depositAmount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Deadline:</span>
                <span>{new Date(formData.depositDeadline * 1000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Buyer:</span>
                <span className="font-mono text-sm">{formData.buyer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Seller:</span>
                <span className="font-mono text-sm">{formData.seller}</span>
              </div>
            </div>

            <div className="bg-accent-50 border border-accent-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-accent-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-accent-800">Ready to Create</p>
                  <p className="text-sm text-accent-700">
                    Please review all details carefully. Once created, some information cannot be changed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`btn-secondary ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Back
          </button>
          
          {currentStep < 3 ? (
            <button onClick={handleNext} className="btn-primary">
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateEscrow}
              disabled={loading}
              className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Escrow'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEscrow;
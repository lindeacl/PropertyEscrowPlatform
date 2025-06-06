// UI Components Export Index
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as TextArea } from './TextArea';
export { default as StatusChip } from './StatusChip';
export { default as Stepper } from './Stepper';
export { default as Modal, ConfirmationModal } from './Modal';
export { default as FileUpload } from './FileUpload';
export { default as Card } from './Card';
export { default as Grid } from './Grid';

// Additional components
export const CopyButton = ({ text, label, showText, truncate, variant, size }: { 
  text: string; 
  label?: string; 
  showText?: boolean; 
  truncate?: boolean; 
  variant?: string; 
  size?: string; 
}) => null;
export const Tooltip = ({ content, icon }: { content: string; icon?: boolean }) => null;
export const AuditLog = (props: any) => null;
export const AccessibleModal = (props: any) => null;
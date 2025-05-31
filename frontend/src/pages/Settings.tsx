import React from 'react';
import { Card, Button, Input } from '../components/ui';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold text-text-primary dark:text-text-primary-dark">Settings</h1>
        <p className="mt-2 text-text-secondary dark:text-text-secondary-dark">
          Manage your account preferences and platform settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-h2 font-semibold text-text-primary dark:text-text-primary-dark mb-4">
            Profile Information
          </h2>
          <div className="space-y-4">
            <Input
              label="Display Name"
              placeholder="Enter your display name"
              value=""
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value=""
            />
            <Button variant="primary">
              Update Profile
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-h2 font-semibold text-text-primary dark:text-text-primary-dark mb-4">
            Notification Preferences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-primary dark:text-text-primary-dark">Email Notifications</span>
              <Button variant="secondary" size="sm">
                Enabled
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-primary dark:text-text-primary-dark">Transaction Alerts</span>
              <Button variant="secondary" size="sm">
                Enabled
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
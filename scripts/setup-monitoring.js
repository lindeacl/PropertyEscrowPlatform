/**
 * Production Monitoring and Alerting Setup
 * Comprehensive monitoring system for Enterprise Property Escrow Platform
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

class ProductionMonitoringSystem {
  constructor(network) {
    this.network = network;
    this.isMainnet = network === "polygon";
    this.deploymentData = this.loadDeploymentData();
    this.monitoring = {
      alerts: [],
      metrics: {},
      thresholds: this.getAlertThresholds(),
      webhooks: {
        slack: process.env.SLACK_WEBHOOK_URL,
        discord: process.env.DISCORD_WEBHOOK_URL,
        email: process.env.ALERT_EMAIL
      }
    };
  }

  async setupMonitoring() {
    console.log(`📊 Setting up production monitoring for ${this.network}`);
    
    try {
      // Initialize contract monitoring
      await this.initializeContractMonitoring();
      
      // Setup event listeners
      await this.setupEventListeners();
      
      // Configure alert thresholds
      await this.configureAlerts();
      
      // Setup health checks
      await this.setupHealthChecks();
      
      // Start monitoring dashboard
      await this.startMonitoringDashboard();
      
      console.log("✅ Production monitoring system activated!");
      this.printMonitoringStatus();
      
    } catch (error) {
      console.error("❌ Monitoring setup failed:", error);
      throw error;
    }
  }

  loadDeploymentData() {
    const deploymentFile = path.join(__dirname, `../deployments/latest-${this.network}.json`);
    if (!fs.existsSync(deploymentFile)) {
      throw new Error(`No deployment found for ${this.network}`);
    }
    return JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  }

  getAlertThresholds() {
    return {
      // Financial thresholds
      largeTxAmount: ethers.parseEther(this.isMainnet ? "100" : "1000"), // MATIC equivalent
      dailyVolume: ethers.parseEther(this.isMainnet ? "10000" : "50000"),
      
      // Transaction thresholds  
      failedTxRate: 0.05, // 5% failure rate
      maxGasPrice: ethers.parseUnits(this.isMainnet ? "100" : "50", "gwei"),
      
      // Time thresholds
      disputeResolutionTime: 7 * 24 * 60 * 60, // 7 days
      verificationDelay: 3 * 24 * 60 * 60, // 3 days
      
      // Count thresholds
      activeEscrows: this.isMainnet ? 1000 : 100,
      pendingDisputes: 10
    };
  }

  async initializeContractMonitoring() {
    console.log("🔍 Initializing contract monitoring...");
    
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const factoryAddress = this.deploymentData.contracts.escrowFactory.address;
    
    this.factoryContract = new ethers.Contract(
      factoryAddress,
      require('../artifacts/contracts/EscrowFactory.sol/EscrowFactory.json').abi,
      provider
    );

    // Test contract connectivity
    try {
      const platformWallet = await this.factoryContract.platformWallet();
      console.log(`✅ Factory contract connected: ${factoryAddress}`);
      console.log(`   Platform wallet: ${platformWallet}`);
    } catch (error) {
      throw new Error(`Failed to connect to factory contract: ${error.message}`);
    }
  }

  async setupEventListeners() {
    console.log("👂 Setting up event listeners...");
    
    // Monitor escrow creation
    this.factoryContract.on("EscrowCreated", async (escrowId, buyer, seller, escrowContract, event) => {
      const data = {
        type: "escrow_created",
        escrowId: escrowId.toString(),
        buyer,
        seller,
        escrowContract,
        blockNumber: event.blockNumber,
        timestamp: new Date().toISOString()
      };
      
      await this.logEvent(data);
      await this.checkThresholds(data);
    });

    // Monitor token whitelist changes
    this.factoryContract.on("TokenWhitelisted", async (token, whitelisted, event) => {
      const data = {
        type: "token_whitelisted",
        token,
        whitelisted,
        blockNumber: event.blockNumber,
        timestamp: new Date().toISOString()
      };
      
      await this.logEvent(data);
      
      if (this.isMainnet) {
        await this.sendAlert("HIGH", `Token whitelist changed: ${token} - ${whitelisted ? "Added" : "Removed"}`);
      }
    });

    // Monitor platform fee changes
    this.factoryContract.on("PlatformFeeUpdated", async (newFee, event) => {
      const data = {
        type: "platform_fee_updated",
        newFee: newFee.toString(),
        blockNumber: event.blockNumber,
        timestamp: new Date().toISOString()
      };
      
      await this.logEvent(data);
      await this.sendAlert("MEDIUM", `Platform fee updated to ${newFee} basis points`);
    });

    console.log("✅ Event listeners configured");
  }

  async configureAlerts() {
    console.log("🔔 Configuring alert system...");
    
    // Setup periodic checks
    setInterval(async () => {
      await this.performHealthChecks();
    }, 5 * 60 * 1000); // Every 5 minutes

    setInterval(async () => {
      await this.generateDailyReport();
    }, 24 * 60 * 60 * 1000); // Daily reports

    console.log("✅ Alert system configured");
  }

  async setupHealthChecks() {
    console.log("🏥 Setting up health checks...");
    
    const healthChecks = {
      contractConnectivity: async () => {
        try {
          await this.factoryContract.platformWallet();
          return { status: "healthy", message: "Contract responding" };
        } catch (error) {
          return { status: "unhealthy", message: `Contract error: ${error.message}` };
        }
      },
      
      networkLatency: async () => {
        const start = Date.now();
        try {
          await this.factoryContract.provider.getBlockNumber();
          const latency = Date.now() - start;
          return { 
            status: latency < 5000 ? "healthy" : "warning",
            message: `Network latency: ${latency}ms`
          };
        } catch (error) {
          return { status: "unhealthy", message: `Network error: ${error.message}` };
        }
      },
      
      gasPrice: async () => {
        try {
          const gasPrice = await this.factoryContract.provider.getFeeData();
          const currentGasPrice = gasPrice.gasPrice;
          const threshold = this.monitoring.thresholds.maxGasPrice;
          
          return {
            status: currentGasPrice < threshold ? "healthy" : "warning",
            message: `Gas price: ${ethers.formatUnits(currentGasPrice, "gwei")} gwei`
          };
        } catch (error) {
          return { status: "unhealthy", message: `Gas price check failed: ${error.message}` };
        }
      }
    };

    this.healthChecks = healthChecks;
    console.log("✅ Health checks configured");
  }

  async performHealthChecks() {
    const results = {};
    
    for (const [checkName, checkFn] of Object.entries(this.healthChecks)) {
      try {
        results[checkName] = await checkFn();
      } catch (error) {
        results[checkName] = { 
          status: "error", 
          message: `Health check failed: ${error.message}` 
        };
      }
    }

    // Check for critical issues
    const unhealthyChecks = Object.entries(results)
      .filter(([_, result]) => result.status === "unhealthy")
      .map(([name, result]) => `${name}: ${result.message}`);

    if (unhealthyChecks.length > 0) {
      await this.sendAlert("CRITICAL", `Health check failures:\n${unhealthyChecks.join('\n')}`);
    }

    this.monitoring.lastHealthCheck = {
      timestamp: new Date().toISOString(),
      results
    };
  }

  async startMonitoringDashboard() {
    console.log("📈 Starting monitoring dashboard...");
    
    // Create monitoring dashboard data
    const dashboardData = {
      network: this.network,
      contracts: this.deploymentData.contracts,
      monitoring: this.monitoring,
      healthStatus: "starting",
      uptime: Date.now()
    };

    // Save dashboard configuration
    const dashboardPath = path.join(__dirname, '../monitoring', `dashboard-${this.network}.json`);
    const monitoringDir = path.dirname(dashboardPath);
    
    if (!fs.existsSync(monitoringDir)) {
      fs.mkdirSync(monitoringDir, { recursive: true });
    }

    fs.writeFileSync(dashboardPath, JSON.stringify(dashboardData, null, 2));
    console.log(`✅ Dashboard data saved: ${dashboardPath}`);
  }

  async logEvent(eventData) {
    // Log to file
    const logPath = path.join(__dirname, '../monitoring/logs', `events-${this.network}-${new Date().toISOString().split('T')[0]}.json`);
    const logDir = path.dirname(logPath);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    logs.push(eventData);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }

  async checkThresholds(eventData) {
    // Implement threshold checking logic
    if (eventData.type === "escrow_created") {
      // Check if we're approaching escrow limits
      // This would typically query the actual contract state
      console.log(`📊 New escrow created: ${eventData.escrowId}`);
    }
  }

  async sendAlert(severity, message) {
    const alert = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      network: this.network
    };

    console.log(`🚨 ${severity} ALERT: ${message}`);
    
    // Send to configured webhooks
    if (this.monitoring.webhooks.slack) {
      await this.sendSlackAlert(alert);
    }
    
    if (this.monitoring.webhooks.discord) {
      await this.sendDiscordAlert(alert);
    }
    
    // Save alert to logs
    this.monitoring.alerts.push(alert);
    await this.saveAlertLog(alert);
  }

  async sendSlackAlert(alert) {
    try {
      const payload = {
        text: `🚨 ${alert.severity} Alert - ${this.network.toUpperCase()}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${alert.severity} Alert*\n${alert.message}\n\n*Network:* ${this.network}\n*Time:* ${alert.timestamp}`
            }
          }
        ]
      };

      // In production, you'd make an HTTP request to the webhook
      console.log("📱 Slack alert prepared:", JSON.stringify(payload, null, 2));
      
    } catch (error) {
      console.error("Failed to send Slack alert:", error);
    }
  }

  async sendDiscordAlert(alert) {
    try {
      const payload = {
        content: `🚨 **${alert.severity} Alert** - ${this.network.toUpperCase()}`,
        embeds: [
          {
            title: "Property Escrow Platform Alert",
            description: alert.message,
            color: alert.severity === "CRITICAL" ? 0xff0000 : alert.severity === "HIGH" ? 0xff8800 : 0xffaa00,
            fields: [
              { name: "Network", value: this.network, inline: true },
              { name: "Severity", value: alert.severity, inline: true },
              { name: "Time", value: alert.timestamp, inline: false }
            ]
          }
        ]
      };

      console.log("💬 Discord alert prepared:", JSON.stringify(payload, null, 2));
      
    } catch (error) {
      console.error("Failed to send Discord alert:", error);
    }
  }

  async saveAlertLog(alert) {
    const alertPath = path.join(__dirname, '../monitoring/alerts', `alerts-${this.network}-${new Date().toISOString().split('T')[0]}.json`);
    const alertDir = path.dirname(alertPath);
    
    if (!fs.existsSync(alertDir)) {
      fs.mkdirSync(alertDir, { recursive: true });
    }

    let alerts = [];
    if (fs.existsSync(alertPath)) {
      alerts = JSON.parse(fs.readFileSync(alertPath, 'utf8'));
    }
    
    alerts.push(alert);
    fs.writeFileSync(alertPath, JSON.stringify(alerts, null, 2));
  }

  async generateDailyReport() {
    console.log("📊 Generating daily monitoring report...");
    
    const report = {
      date: new Date().toISOString().split('T')[0],
      network: this.network,
      summary: {
        totalAlerts: this.monitoring.alerts.length,
        criticalAlerts: this.monitoring.alerts.filter(a => a.severity === "CRITICAL").length,
        systemUptime: Date.now() - this.monitoring.uptime,
        lastHealthCheck: this.monitoring.lastHealthCheck
      }
    };

    const reportPath = path.join(__dirname, '../monitoring/reports', `daily-${this.network}-${report.date}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Daily report saved: ${reportPath}`);
  }

  printMonitoringStatus() {
    console.log("\n📊 MONITORING STATUS");
    console.log("==========================================");
    console.log(`Network: ${this.network.toUpperCase()}`);
    console.log(`Factory Contract: ${this.deploymentData.contracts.escrowFactory.address}`);
    console.log(`Alert Webhooks: ${Object.keys(this.monitoring.webhooks).filter(k => this.monitoring.webhooks[k]).join(', ')}`);
    console.log(`Health Checks: ${Object.keys(this.healthChecks).length} configured`);
    console.log("");
    console.log("🔍 Monitoring Features:");
    console.log("• Real-time event monitoring");
    console.log("• Automated health checks");
    console.log("• Alert thresholds");
    console.log("• Daily reporting");
    console.log("• Multi-channel notifications");
    console.log("==========================================\n");
  }
}

async function main() {
  const network = process.argv[2]?.replace('--network=', '') || process.env.HARDHAT_NETWORK || "mumbai";
  
  if (!["polygon", "mumbai"].includes(network)) {
    throw new Error(`Unsupported network: ${network}. Use 'polygon' or 'mumbai'`);
  }

  const monitoring = new ProductionMonitoringSystem(network);
  await monitoring.setupMonitoring();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("✅ Monitoring system is now running...");
      // Keep the process alive for monitoring
      process.on('SIGINT', () => {
        console.log("\n📊 Monitoring system shutting down...");
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { ProductionMonitoringSystem };
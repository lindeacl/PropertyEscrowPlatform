/**
 * Smart Contract Coverage Enforcement Script
 * Ensures test coverage meets minimum threshold requirements
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_THRESHOLD = 90; // Minimum required coverage percentage

async function checkCoverage() {
  try {
    // Read coverage summary
    const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
    
    if (!fs.existsSync(coveragePath)) {
      console.error('❌ Coverage file not found. Run "npx hardhat coverage" first.');
      process.exit(1);
    }

    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const totalCoverage = coverageData.total;

    console.log('\n📊 Smart Contract Coverage Report');
    console.log('=====================================');
    console.log(`Statements: ${totalCoverage.statements.pct}%`);
    console.log(`Branches: ${totalCoverage.branches.pct}%`);
    console.log(`Functions: ${totalCoverage.functions.pct}%`);
    console.log(`Lines: ${totalCoverage.lines.pct}%`);

    // Check each metric against threshold
    const metrics = ['statements', 'branches', 'functions', 'lines'];
    let failed = false;

    metrics.forEach(metric => {
      const percentage = totalCoverage[metric].pct;
      if (percentage < COVERAGE_THRESHOLD) {
        console.log(`❌ ${metric}: ${percentage}% (Required: ${COVERAGE_THRESHOLD}%)`);
        failed = true;
      } else {
        console.log(`✅ ${metric}: ${percentage}%`);
      }
    });

    if (failed) {
      console.log(`\n❌ Coverage below ${COVERAGE_THRESHOLD}% threshold. Please add more tests.`);
      process.exit(1);
    } else {
      console.log(`\n✅ All coverage metrics above ${COVERAGE_THRESHOLD}% threshold.`);
    }

  } catch (error) {
    console.error('Error checking coverage:', error.message);
    process.exit(1);
  }
}

// Generate detailed coverage report
function generateDetailedReport() {
  const coveragePath = path.join(__dirname, '..', 'coverage', 'lcov-report', 'index.html');
  
  if (fs.existsSync(coveragePath)) {
    console.log(`\n📋 Detailed report available at: file://${coveragePath}`);
  }
}

if (require.main === module) {
  checkCoverage().then(generateDetailedReport);
}

module.exports = { checkCoverage, COVERAGE_THRESHOLD };
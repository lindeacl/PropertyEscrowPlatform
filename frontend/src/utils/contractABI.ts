// Import the actual compiled contract ABIs
import EscrowFactoryArtifact from '../../../artifacts/contracts/core/EscrowFactory.sol/EscrowFactory.json';
import PropertyEscrowArtifact from '../../../artifacts/contracts/core/PropertyEscrow.sol/PropertyEscrow.json';
import MockERC20Artifact from '../../../artifacts/contracts/mocks/MockERC20.sol/MockERC20.json';

export const ESCROW_FACTORY_ABI = EscrowFactoryArtifact.abi;
export const PROPERTY_ESCROW_ABI = PropertyEscrowArtifact.abi;
export const MOCK_ERC20_ABI = MockERC20Artifact.abi;
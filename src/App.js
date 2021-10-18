import * as React from 'react';
import { ethers } from 'ethers';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import myEpicNft from './utils/MyEpicNFT.json';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// const OPENSEA_LINK = '';
// const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = '0xc89d365aF1FE082bbebf7507727236C5DEc7f2eC';

const App = () => {

  const [currentAccount, setCurrentAccount] = React.useState('');

  React.useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      const { ethereum } = window;
    
      if (!ethereum) {
        console.log('Need metamask!');
      } else {
        console.log('ethereum object: ', ethereum);
    
        const accounts = await ethereum.request({ method: 'eth_accounts' });
    
        // Users can have multiple authorized accounts, so grab first one
        if (accounts.length) {
          const account = accounts[0];
          console.log('Found an authorized account: ', account);
          setCurrentAccount(account);
        } else {
          console.log('No authorized account found');
        }
      }
    }

    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      // request access to account
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log('Connected! ', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (e) {
      console.log(e);
    }
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log('Going to show wallet to pay for gas...');
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log('Mining... please wait.');
        await nftTxn.wait();

        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

      } else {
        console.log('Ethereum object does not exist!');
      }
    } catch (e) {
      console.log(e);
    }
  }
  
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === '' ? (
            <button onClick={connectWallet} className="cta-button connect-wallet-button">
              Connect to Wallet
            </button>
          ) : (
            <>
              <button onClick={askContractToMintNft} className='cta-button connect-wallet-button'>
                Mint NFT
              </button>
              <p className='footer-text'>Connected to: {currentAccount}</p>
            </>
          )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;

import * as React from 'react';
import { ethers } from 'ethers';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import myEpicNft from './utils/MyEpicNFT.json';

// Constants
const FOOTER_LINK = 'https://www.lootgod.com';
const OPENSEA_COLLECTION = 'https://testnets.opensea.io/collection/peoplenft';
const OPENSEA_LINK = 'https://testnets.opensea.io/assets/';
const CONTRACT_ADDRESS = '0x93d19fdcBAD675A4540eb2d46142EFb274678498';
const DEFAULT_NETWORK = 'rinkeby';
const ALCHEMY_KEY = 'v-NC_ovm48SaZ2ZGn7mR-qy6QT2CJkJm';

const App = () => {

  const [currentAccount, setCurrentAccount] = React.useState('');
  const [isDisabled, setIsDisabled] = React.useState(false);
  const [isMinting, setIsMinting] = React.useState(false);
  const [nftCount, setNftCount] = React.useState(null);
  const [nftLimit, setNftLimit] = React.useState(null);
  const [nftName, setNftName] = React.useState('');
  const [mintFeed, setMintFeed] = React.useState([]);
  const [feedIsStale, setFeedIsStale] = React.useState(false);

  const setupEventListener = React.useCallback(async () => {
    // Mostly the same as askContractToMintNft
    try {
      const { ethereum } = window;
      
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
        
        // Capture our event, similar to a webhook
        const mintedListener = (from, tokenId) => {
          const token = tokenId.toNumber();
          console.log('MINTED!');
          console.log({from, token, currentAccount});
          setFeedIsStale(true);
          if (from.toLowerCase() ===  currentAccount.toLowerCase()) {
            setIsMinting(false);
            setIsDisabled(false);
            alert(`Hey there! We've minted your NFT and sent it to your wallet. It might still be blank right now. Sometimes it takes up to 10 min to show up on OpenSea. Here's the link: ${OPENSEA_LINK}${CONTRACT_ADDRESS}/${token}`)
          }
        }
        connectedContract.on('NewEpicNFTMinted', mintedListener);
        
        console.log('Event listener set.');

        return () => {
          connectedContract.off('NewEpicNFTMinted', mintedListener);
        }

      } else {
        console.log('Ethereum object does not exist!');
      }
    } catch (e) {
      console.log(e);
    }
  }, [currentAccount])

  React.useEffect(() => {
    const checkNetwork = async () => {
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log('Need metamask!');
      } else {
        let chainId = await ethereum.request({ method: 'eth_chainId' });
        console.log('Connected to chain ', chainId);

        // Check against known id of Rinkeby network
        const rinkebyChainId = '0x4';
        if (chainId !== rinkebyChainId) {
          alert('You are not connected to the Rinkeby Test Network!');
        }
      }
    }
    
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

          // Set up listener! This is for the case when a user comes to our site
          // and ALREADY had their wallet connected + authorized
          setupEventListener();
        } else {
          console.log('No authorized account found');
        }
      }
    }

    const getNftData = async () => {
        const provider = new ethers.providers.AlchemyProvider(DEFAULT_NETWORK, ALCHEMY_KEY);
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, provider);
        try {
          const [_nftCount, nftLimit, nftName] = await Promise.all([connectedContract.getNFTCount(), connectedContract.getNFTLimit(), connectedContract.name()]);
          const nftCount = ethers.BigNumber.from(_nftCount).toNumber();
          setNftCount(nftCount);
          setNftLimit(nftLimit);
          setNftName(nftName);
          const newFeed = [...Array(nftCount).keys()].reverse().map((each) => each.toString());
          console.log({ nftCount, nftLimit, nftName });
          console.log('newFeed: ', JSON.stringify(newFeed));
          setMintFeed(newFeed);
        } catch (e) {
          console.log('caught error while fetching collection data');
          console.log(e);
        }
    }

    (async function runEffects() {
      try {
        if (!feedIsStale) {
          await checkNetwork();
          await checkIfWalletIsConnected();
        }
        await getNftData();
      } catch (e) {
        console.log(e);
      }
    })();
  }, [feedIsStale, setupEventListener]);

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

      // Set up listener for new user connecting wallet for first time
      setupEventListener();
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
        setIsDisabled(true);
        let nftTxn = await connectedContract.makeAnEpicNFT();
        setIsMinting(true);

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

  console.log(mintFeed);
  
  const nftsRemaining = nftLimit - nftCount;
  const loaded = nftLimit !== null && nftCount !== null;

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">{nftName ? `${nftName} Collection` : '...'}</p>
          <p className='footer-text'>
            <a
              className='footer-text'
              href={OPENSEA_COLLECTION}
              target='_blank'
              rel='noreferrer'
            >🌊 View Collection on OpenSea</a> | <a className='footer-text' href={`https://rinkeby.etherscan.io/address/${CONTRACT_ADDRESS}`} target='_blank' rel='noreferrer'>Etherscan</a>
          </p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          <p className='sub-sub-text'>
            {loaded ? `${nftCount} of ${nftLimit} minted. ${nftsRemaining ? `Only ${nftsRemaining} left!` : `No more!`}` : '...'}
          </p>
          {currentAccount === '' ? (
            <button onClick={connectWallet} className="cta-button connect-wallet-button">
              Connect to Wallet
            </button>
          ) : (
            <>
            <div className={isMinting ? 'el-wrap x' : undefined}>
              <div className={isMinting ? 'el y' : undefined}>
                <button disabled={isDisabled} onClick={askContractToMintNft} className={`cta-button connect-wallet-button${isMinting ? ' spinning' : ''}${isDisabled ? ' disabled-button' : ''}`}>
                  {isMinting ? 'Minting...' : 'Mint NFT'}
                </button>
              </div>
            </div>
              <p className='footer-text'>Connected to wallet: {currentAccount}</p>
            </>
          )}
        <p className='footer-text'>Click on any of these recently minted NFTs to view on OpenSea 😄</p>
        <div className='feed-container'>{mintFeed.length ? mintFeed.map((each) => <FeedItem key={each} id={each} />) : null}</div>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={FOOTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Built by LootGod`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;

const FeedItem = ({ id }) => {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    const getData = async () => {
      const provider = new ethers.providers.AlchemyProvider(DEFAULT_NETWORK, ALCHEMY_KEY);
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, provider);
      const data = await connectedContract.tokenURI(id);
      const json = Buffer.from(data.split(',')[1], 'base64').toString();
      const parsed = JSON.parse(json);
      setData(parsed);
    }

    getData();
  }, [id]);

  let content;
  if (data) {
    const { name, image } = data; // image, description, name
    content = <a
      href={`${OPENSEA_LINK}${CONTRACT_ADDRESS}/${id}`}
      target='_blank'
      rel='noreferrer'  
    ><img src={image} alt={name} className='feed-image' /></a>
  } else {
    content = 'Loading...';
  }

  return <div className='feed-item'>{content}</div>
}

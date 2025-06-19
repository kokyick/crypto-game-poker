import { ethers } from 'ethers';
import React, { useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import LoadingScreen from '../../components/loading/LoadingScreen';
import globalContext from '../../context/global/globalContext';
import socketContext from '../../context/websocket/socketContext';
import { CS_FETCH_LOBBY_INFO } from '../../pokergame/actions';
import './ConnectWallet.scss';

// Custom hook to parse URL query parameters can be placed in utlis folder 
const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const ConnectWallet = () => {
  const { setWalletAddress, setChipsAmount } = useContext(globalContext);
  const { socket } = useContext(socketContext);
  const navigate = useNavigate();
  const query = useQuery();

  // Request wallet connection and sign a test message
  const connectAndSign = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      await Swal.fire({
        title: 'No Ethereum Wallet',
        text: 'Please install MetaMask or another Ethereum wallet!',
        icon: 'warning',
      });
      return null;
    }

    try {
      // Request accounts
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      // Initialize provider and signer
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      // Ensure we're on Ethereum Mainnet (chainId 1)
      const network = await provider.getNetwork();
      if (network.chainId !== 1) {
        await Swal.fire({
          title: 'Wrong Network',
          text: 'Please switch your wallet to Ethereum Mainnet.',
          icon: 'warning',
        });
        return null;
      }

      // Sign a test message
      await signer.signMessage('This is a test');
      return account;
    } catch (err) {
      console.error('Wallet connect/sign failed:', err);
      await Swal.fire({
        title: 'Wallet Connect/Sign Failed',
        text: 'Please try to sign in again.',
        icon: 'error',
      });
      return null;
    }
  };

  useEffect(() => {
    const initConnection = async () => {
      const walletAddress = await connectAndSign();

      setWalletAddress(walletAddress);
      console.log((walletAddress))

      const gameId = query.get('gameId');
      const username = query.get('username');

      try {
        socket.emit(CS_FETCH_LOBBY_INFO, {
          walletAddress,
          socketId: socket.id,
          gameId,
          username,
        });
        navigate('/play');
      } catch (err) {
        console.error('Socket emit error:', err);
      }
    };

    if (socket) {
      initConnection();
    }
  }, [socket, query, setWalletAddress, setChipsAmount, navigate]);

  // Show loading screen while connecting
  return <><LoadingScreen /></>
};

export default ConnectWallet;

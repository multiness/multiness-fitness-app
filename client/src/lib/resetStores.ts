import { usePostStore } from './postStore';
import { useGroupStore } from './groupStore';
import { useChatStore } from './chatService';
import { useUsers } from '../contexts/UserContext';

export const resetAllStores = () => {
  // Clear all localStorage data
  localStorage.clear();

  // Reset individual stores
  usePostStore.getState().reset?.();
  useGroupStore.getState().reset?.();
  useChatStore.getState().messages = {};
  useChatStore.getState().groupGoals = {};

  // Reset users context if available
  const usersContext = useUsers();
  if (usersContext?.resetUsers) {
    usersContext.resetUsers();
  }

  console.log('All stores have been reset');
};
'use client';

import { useCollaborationContext } from './CollaborationProvider';

interface User {
  id: string;
  username: string;
  avatar?: string;
}

export function PresenceIndicator() {
  const { isConnected, onlineUsers } = useCollaborationContext();

  if (!isConnected) {
    return (
      <div className='flex items-center space-x-2 text-sm text-gray-500'>
        <div className='w-2 h-2 bg-red-500 rounded-full'></div>
        <span>Disconnected</span>
      </div>
    );
  }

  return (
    <div className='flex items-center space-x-3'>
      <div className='flex items-center space-x-2 text-sm text-gray-600'>
        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
        <span>Connected</span>
      </div>

      {onlineUsers.length > 0 && (
        <div className='flex items-center space-x-2'>
          <span className='text-sm text-gray-500'>Online:</span>
          <div className='flex -space-x-2'>
            {onlineUsers.slice(0, 5).map((user: User) => (
              <div
                key={user.id}
                className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white'
                title={user.username}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className='w-full h-full rounded-full object-cover'
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <div className='w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white'>
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

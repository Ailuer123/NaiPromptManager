
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DbSetupError, Landing } from './components/Landing';
import { ChainList } from './components/ChainList';
import { ChainEditor } from './components/ChainEditor';
import { ArtistLibrary } from './components/ArtistLibrary';
import { ArtistAdmin } from './components/ArtistAdmin';
import { InspirationGallery } from './components/InspirationGallery';
import { GenHistory } from './components/GenHistory';
import { db } from './services/dbService';
import { useTheme } from './theme';
import { PromptChain, User, Artist, Inspiration, ChainType } from './types';

type ViewState = 'list' | 'characters' | 'edit' | 'library' | 'inspiration' | 'admin' | 'history' | 'playground';

const CACHE_TTL = 60 * 60 * 1000; // 1 Hour Cache

const App = () => {
  const [view, setView] = useState<ViewState>('list');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [chains, setChains] = useState<PromptChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbConfigError, setDbConfigError] = useState(false);

  // Playground State
  const [playgroundChain, setPlaygroundChain] = useState<PromptChain | null>(null);

  // Data Cache State
  const [artistsCache, setArtistsCache] = useState<Artist[] | null>(null);
  const [inspirationsCache, setInspirationsCache] = useState<Inspiration[] | null>(null);
  const [usersCache, setUsersCache] = useState<User[] | null>(null);

  // Cache Timestamps
  const [lastChainFetch, setLastChainFetch] = useState(0);
  const [lastArtistFetch, setLastArtistFetch] = useState(0);
  const [lastInspirationFetch, setLastInspirationFetch] = useState(0);
  const [lastUserFetch, setLastUserFetch] = useState(0);

  // Dirty State for Navigation Guard
  const [isEditorDirty, setIsEditorDirty] = useState(false);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Guest Login State
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestPasscode, setGuestPasscode] = useState('');

  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';

  // Toast State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Check Session on Load
  useEffect(() => {
    db.getMe().then(user => {
      setCurrentUser(user);
      refreshData();
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const refreshData = async (force = false) => {
    // Chains (Always load all chains so we can filter client side and do mutual imports)
    if (!force && chains.length > 0 && Date.now() - lastChainFetch < CACHE_TTL) return;

    setLoading(true);
    try {
      const data = await db.getAllChains();
      setChains(data);
      setLastChainFetch(Date.now());
      setDbConfigError(false);
    } catch (e: any) {
      if (e.message && e.message.includes('Database not configured')) {
        setDbConfigError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadArtists = async (force = false) => {
    if (!force && artistsCache && Date.now() - lastArtistFetch < CACHE_TTL) return;
    const data = await db.getAllArtists();
    setArtistsCache(data.sort((a, b) => a.name.localeCompare(b.name)));
    setLastArtistFetch(Date.now());
  };

  const loadInspirations = async (force = false) => {
    if (!force && inspirationsCache && Date.now() - lastInspirationFetch < CACHE_TTL) return;
    const data = await db.getAllInspirations();
    setInspirationsCache(data);
    setLastInspirationFetch(Date.now());
  };

  const loadUsers = async (force = false) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (!force && usersCache && Date.now() - lastUserFetch < CACHE_TTL) return;
    const data = await db.getUsers();
    setUsersCache(data);
    setLastUserFetch(Date.now());
  };

  const toggleTheme = () => setMode(isDark ? 'light' : 'dark');

  const handleNavigate = (newView: ViewState, id?: string) => {
    if (isEditorDirty) {
      if (!confirm('您有未保存的更改，确定要离开吗？')) {
        return;
      }
      // User confirmed, reset dirty state
      setIsEditorDirty(false);
    }

    setSelectedId(id);
    setView(newView);

    // Auto-load data based on view, respecting cache
    if (newView === 'list' || newView === 'characters') refreshData();
    if (newView === 'library') loadArtists();
    if (newView === 'inspiration') loadInspirations();
    if (newView === 'admin') {
      // Admin view handles both artist and user loading internally via props now, 
      // but we trigger it here to ensure fresh data if needed or respect cache
      loadArtists();
      if (currentUser?.role === 'admin') loadUsers();
    }

    if (newView === 'playground' && !playgroundChain) {
      // Initialize Playground Chain
      setPlaygroundChain({
        id: 'playground',
        name: '生图实验室',
        description: '临时生图实验，点击 Fork 可保存到库',
        userId: currentUser?.id || 'guest',
        basePrompt: '',
        negativePrompt: '',
        modules: [],
        params: {
          width: 832, height: 1216, steps: 28, scale: 5, sampler: 'k_euler_ancestral', seed: undefined, qualityToggle: true, ucPreset: 4, characters: []
        },
        variableValues: { subject: '' },
        type: 'style',
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  };

  const handleUpdatePlaygroundChain = async (id: string, updates: Partial<PromptChain>) => {
    setPlaygroundChain(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      let res;
      if (isGuestMode) {
        res = await db.guestLogin(guestPasscode);
      } else {
        res = await db.login(loginUser, loginPass);
      }
      setCurrentUser(res.user);
      // 切换角色后丢弃旧列表，避免前一个账号的私人串短暂残留
      setChains([]);
      setLastChainFetch(0);
      // Force refresh chains to apply guest_hidden/private filters based on new role
      await refreshData(true);
      // Guest should not stay in admin/profile view
      if (res.user.role === 'guest' && (view === 'admin' || view === 'edit')) {
        setView('list');
        setSelectedId(undefined);
      }
    } catch (err: any) {
      setLoginError(err.message || '登录失败');
    }
  };

  const handleLogout = async () => {
    await db.logout();
    setCurrentUser(null);
    setLoginUser(''); setLoginPass(''); setGuestPasscode('');
    setIsGuestMode(false);
    // Clear all cache to prevent stale data after role switch
    setChains([]);
    setLastChainFetch(0);
    setUsersCache(null);
    setInspirationsCache(null);
    // Reset view to list to prevent guest from staying in admin view
    setView('list');
    setSelectedId(undefined);
  };

  const handleCreateChain = async (name: string, desc: string, type: ChainType) => {
    setLoading(true);
    const newId = await db.createChain(name, desc, undefined, type);
    await refreshData(true);
    setLoading(false);
    handleNavigate('edit', newId);
  };

  const handleForkChain = async (chain: PromptChain, targetType?: ChainType) => {
    const finalType = targetType || chain.type;
    const name = chain.name + (chain.id === 'playground' ? '' : ' (Fork)');
    await db.createChain(name, chain.description, chain, finalType); // Persist type on fork
    notify('Fork 成功！已保存到您的列表');
    await refreshData(true);
    // Return to appropriate list based on type
    setView(finalType === 'character' ? 'characters' : 'list');
  };

  const handleUpdateChain = async (id: string, updates: Partial<PromptChain>) => {
    await db.updateChain(id, updates);
    await refreshData(true);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await db.deleteChain(id);
    await refreshData(true);
    // Stay on current list view
    setLoading(false);
  };

  const getSelectedChain = () => chains.find(c => c.id === selectedId);

  if (!currentUser) {
    return (
      <Landing
        isGuestMode={isGuestMode}
        onGuestModeChange={setIsGuestMode}
        loginUser={loginUser}
        loginPass={loginPass}
        guestPasscode={guestPasscode}
        loginError={loginError}
        onLoginUserChange={setLoginUser}
        onLoginPassChange={setLoginPass}
        onGuestPasscodeChange={setGuestPasscode}
        onSubmit={handleLogin}
      />
    );
  }

  if (dbConfigError) {
    return <DbSetupError />;
  }

  const openChainType = (next: ChainType) => {
    handleNavigate(next === 'character' ? 'characters' : 'list');
  };

  const renderChainList = (type: ChainType, isGuest: boolean) => (
    <ChainList
      chains={chains}
      type={type}
      onTypeChange={openChainType}
      onCreate={handleCreateChain}
      onSelect={(id) => handleNavigate('edit', id)}
      onDelete={handleDelete}
      onRefresh={() => refreshData(true)}
      isLoading={loading}
      notify={notify}
      isGuest={isGuest}
    />
  );

  const renderContent = () => {
    // Guest guard for admin view - guest should never see admin panel
    if (view === 'admin' && currentUser?.role === 'guest') {
      return renderChainList('style', true);
    }
    
    switch (view) {
      case 'list':
      case 'characters':
        return renderChainList(view === 'characters' ? 'character' : 'style', currentUser.role === 'guest');
      case 'edit':
        const editChain = getSelectedChain();
        if (!editChain) return <div>Chain not found</div>;
        return <ChainEditor
          chain={editChain}
          allChains={chains}
          currentUser={currentUser}
          onUpdateChain={handleUpdateChain}
          onBack={() => handleNavigate(editChain.type === 'character' ? 'characters' : 'list')}
          onFork={handleForkChain}
          setIsDirty={setIsEditorDirty}
          notify={notify}
        />;
      case 'library':
        return <ArtistLibrary
          isDark={isDark}
          toggleTheme={toggleTheme}
          artistsData={artistsCache}
          onRefresh={() => loadArtists(true)}
          notify={notify}
          currentUser={currentUser}
        />;
      case 'inspiration':
        return <InspirationGallery
          currentUser={currentUser}
          inspirationsData={inspirationsCache}
          onRefresh={() => loadInspirations(true)}
          notify={notify}
          onNavigateToPlayground={() => handleNavigate('playground')}
        />;
      case 'admin':
        return <ArtistAdmin
          currentUser={currentUser}
          artistsData={artistsCache}
          usersData={usersCache}
          onRefreshArtists={() => loadArtists(true)}
          onRefreshUsers={() => loadUsers(true)}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onLogout={handleLogout}
        />;
      case 'history':
        return <GenHistory currentUser={currentUser} notify={notify} onNavigateToPlayground={() => handleNavigate('playground')} onRefreshInspiration={() => loadInspirations(true)} />;
      case 'playground':
        if (!playgroundChain) return <div>Loading...</div>;
        return <ChainEditor
          chain={playgroundChain}
          allChains={chains}
          currentUser={currentUser}
          onUpdateChain={handleUpdatePlaygroundChain}
          onBack={() => handleNavigate('list')}
          onFork={handleForkChain}
          setIsDirty={() => { }}
          notify={notify}
        />;
      default:
        return <div>Unknown View</div>;
    }
  };

  return (
    <Layout
      onNavigate={handleNavigate}
      currentView={view}
      currentUser={currentUser}
      onLogout={handleLogout}
      toast={toast}
      hideNav={view === 'edit' || view === 'playground'}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;

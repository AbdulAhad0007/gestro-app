import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, BackHandler } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { useCustomAppsStore, CustomApp } from '../store/useCustomAppsStore';
import { GestroButton } from '../components/GestroButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Folder, File as FileIcon, FileText, Image as ImageIcon, Play, ChevronDown, ChevronRight, MoreVertical, X, HardDrive, Check } from 'lucide-react-native';
import { colors } from '../theme/colors';

const getFileIcon = (type: string, ext: string, color: string) => {
  if (type === 'folder') {
    if (ext === '') return <HardDrive color={color} size={24} />;
    return <Folder color={color} size={24} />;
  }
  const e = ext.toLowerCase();
  if (['.exe', '.bat', '.cmd', '.lnk'].includes(e)) return <Play color={color} size={24} />;
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp4', '.mkv'].includes(e)) return <ImageIcon color={color} size={24} />;
  if (['.txt', '.doc', '.docx', '.pdf', '.csv'].includes(e)) return <FileText color={color} size={24} />;
  return <FileIcon color={color} size={24} />;
};

export function ApplicationsScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, sendAction, apps, fileSystemItems, selectedDevice } = usePCConnectionStore();
  const { customApps, isMyAppsExpanded, toggleMyAppsExpanded, addCustomApp, removeCustomApp, updateCustomApp } = useCustomAppsStore();
  const insets = useSafeAreaInsets();
  
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const subTextColor = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';
  const iconColor = isDark ? '#FFFFFF' : '#000000';
  const subIconColor = isDark ? '#A1A1AA' : '#71717A';

  const [search, setSearch] = useState('');
  const filteredApps = apps ? apps.filter((a: any) => a.name.toLowerCase().includes(search.toLowerCase())) : [];

  // Browser Modal State
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [isFetchingFS, setIsFetchingFS] = useState(false);

  // Name Modal State
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [customName, setCustomName] = useState('');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [appToEdit, setAppToEdit] = useState<CustomApp | null>(null);

  // Launch state
  const [launchedPath, setLaunchedPath] = useState<string | null>(null);

  const handleLaunch = (path: string, isCustom = false) => {
    if (!isConnected) {
      Alert.alert('Disconnected', 'Please connect to your PC to launch this app.');
      return;
    }
    sendAction(isCustom ? 'LAUNCH_FILE' : 'LAUNCH_APP', { path });
    setLaunchedPath(path);
    setTimeout(() => {
      setLaunchedPath((current) => (current === path ? null : current));
    }, 2000);
  };

  useEffect(() => {
    if (isConnected) {
      sendAction('GET_APPS');
    }
  }, [isConnected]);

  useEffect(() => {
    setIsFetchingFS(false);
  }, [fileSystemItems]);

  useEffect(() => {
    const handleBackPress = () => {
      if (isBrowserOpen) {
        handleBrowserBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [isBrowserOpen, pathHistory]);

  const openBrowser = () => {
    setCurrentPath('');
    setPathHistory([]);
    setIsBrowserOpen(true);
    setIsFetchingFS(true);
    sendAction('LIST_DIRECTORY', { path: '' });
  };

  const navigateToFolder = (path: string) => {
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(path);
    setIsFetchingFS(true);
    sendAction('LIST_DIRECTORY', { path });
  };

  const handleBrowserBack = () => {
    if (pathHistory.length === 0) {
      setIsBrowserOpen(false);
      return;
    }
    const newHistory = [...pathHistory];
    const prevPath = newHistory.pop() || '';
    setPathHistory(newHistory);
    setCurrentPath(prevPath);
    setIsFetchingFS(true);
    sendAction('LIST_DIRECTORY', { path: prevPath });
  };

  const selectFileForShortcut = (item: any) => {
    setSelectedFile(item);
    setCustomName(item.name.replace(item.ext, '')); // Default name
    setIsBrowserOpen(false);
    setIsNameModalOpen(true);
  };

  const saveCustomApp = () => {
    if (!customName.trim()) return;
    addCustomApp({
      name: customName,
      path: selectedFile.path,
      type: selectedFile.type,
      deviceId: selectedDevice?.id,
    });
    setIsNameModalOpen(false);
  };

  const launchCustomApp = (app: CustomApp) => {
    handleLaunch(app.path, true);
  };

  const openEditMenu = (app: CustomApp) => {
    setAppToEdit(app);
    setCustomName(app.name);
    setIsEditModalOpen(true);
  };

  const saveEdit = () => {
    if (appToEdit && customName.trim()) {
      updateCustomApp(appToEdit.id, { name: customName });
      setIsEditModalOpen(false);
    }
  };

  const deleteApp = () => {
    if (appToEdit) {
      removeCustomApp(appToEdit.id);
      setIsEditModalOpen(false);
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 100 + (insets.bottom || 0) }}
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text className={`text-3xl font-bold ${textColor}`}>Apps</Text>
          <TouchableOpacity 
            onPress={openBrowser}
            className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}
          >
            <Plus color={iconColor} size={24} />
          </TouchableOpacity>
        </View>

        {/* My Apps Section */}
        <View className="mb-6">
          <TouchableOpacity 
            onPress={toggleMyAppsExpanded}
            className="flex-row justify-between items-center py-2 mb-2"
          >
            <Text className={`text-xl font-bold ${textColor}`}>My Apps</Text>
            {isMyAppsExpanded ? <ChevronDown color={iconColor} size={24} /> : <ChevronRight color={iconColor} size={24} />}
          </TouchableOpacity>
          
          {isMyAppsExpanded && (
            <View>
              {customApps.length === 0 ? (
                <Text className={`text-center py-4 ${subTextColor}`}>No custom apps yet. Tap '+' to add one.</Text>
              ) : (
                customApps.map(app => (
                  <TouchableOpacity 
                    key={app.id} 
                    onPress={() => launchCustomApp(app)}
                    onLongPress={() => openEditMenu(app)}
                    className={`p-4 rounded-xl border mb-2 flex-row justify-between items-center ${surfaceStyle}`}
                  >
                    <View className="flex-row items-center flex-1 mr-4">
                      <View className="mr-3">
                         {getFileIcon('file', app.path.includes('.') ? `.${app.path.split('.').pop()}` : '', iconColor)}
                      </View>
                      <View className="flex-1">
                        <Text className={`font-bold ${textColor}`} numberOfLines={1}>{app.name}</Text>
                        <Text className={`text-xs ${subTextColor}`} numberOfLines={1} ellipsizeMode="middle">{app.path}</Text>
                      </View>
                    </View>
                    {launchedPath === app.path && (
                      <View className="bg-gestro-green/20 px-2 py-1 rounded-md mr-2 flex-row items-center">
                        <Check color={colors.gestroGreen} size={14} className="mr-1" />
                        <Text className="text-gestro-green text-xs font-bold">Launched</Text>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => openEditMenu(app)} className="p-2">
                      <MoreVertical color={subIconColor} size={20} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Default Apps Section */}
        <Text className={`text-xl font-bold mb-4 ${textColor}`}>Windows Apps</Text>
        <View className={!isConnected ? 'opacity-30' : ''} pointerEvents={!isConnected ? 'none' : 'auto'}>
          <TextInput 
            placeholder="Filter apps..." 
            value={search} 
            onChangeText={setSearch} 
            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
            className={`p-4 rounded-xl mb-4 border ${surfaceStyle} ${textColor}`} 
          />
          {!apps || apps.length === 0 ? (
            <Text className={`text-center py-8 ${textColor}`}>Fetching apps or none found...</Text>
          ) : (
            filteredApps.map((app: any) => (
              <TouchableOpacity 
                key={app.path} 
                onPress={() => handleLaunch(app.path, false)} 
                className={`p-4 rounded-xl border mb-2 flex-row justify-between items-center ${surfaceStyle}`}
              >
                <View className="flex-1 mr-4">
                  <Text className={`font-bold ${textColor}`} numberOfLines={1}>{app.name}</Text>
                  <Text className={`text-xs ${subTextColor}`}>{app.exe}</Text>
                </View>
                <View className="w-32">
                  <GestroButton 
                    label={launchedPath === app.path ? "Launched ✓" : "Launch"} 
                    onPress={() => handleLaunch(app.path, false)} 
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* PC File Browser Modal */}
      <Modal visible={isBrowserOpen} animationType="slide" transparent={true}>
        <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'} pt-12`}>
          <View className="flex-row items-center px-4 pb-4 border-b border-zinc-800">
            <TouchableOpacity onPress={handleBrowserBack} className="p-2 mr-2">
              <Text className={`text-lg ${textColor}`}>Back</Text>
            </TouchableOpacity>
            <Text className={`flex-1 text-lg font-bold ${textColor}`} numberOfLines={1} ellipsizeMode="head">
              {currentPath || 'My PC'}
            </Text>
            <TouchableOpacity onPress={() => setIsBrowserOpen(false)} className="p-2">
              <X color={iconColor} size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            {isFetchingFS ? (
              <Text className={`text-center py-8 ${textColor}`}>Loading...</Text>
            ) : fileSystemItems.length === 0 ? (
              <Text className={`text-center py-8 ${subTextColor}`}>Empty directory</Text>
            ) : (
              fileSystemItems.map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  onPress={() => item.type === 'folder' ? navigateToFolder(item.path) : selectFileForShortcut(item)}
                  className={`flex-row items-center p-4 rounded-xl border mb-2 ${surfaceStyle}`}
                >
                  <View className="mr-4">
                    {getFileIcon(item.type, item.ext, iconColor)}
                  </View>
                  <Text className={`flex-1 text-base ${textColor}`}>{item.name}</Text>
                  {item.type === 'folder' && <ChevronRight color={subIconColor} size={20} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Name Customization Modal */}
      <Modal visible={isNameModalOpen} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className={`p-6 rounded-3xl border ${surfaceStyle}`}>
            <Text className={`text-xl font-bold mb-2 ${textColor}`}>Add Shortcut</Text>
            <Text className={`text-sm mb-6 ${subTextColor}`} numberOfLines={2} ellipsizeMode="middle">
              {selectedFile?.path}
            </Text>
            
            <Text className={`text-sm mb-2 font-semibold ${textColor}`}>Display Name</Text>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="App Name"
              placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
              className={`p-4 rounded-xl border mb-6 ${surfaceStyle} ${textColor}`}
              autoFocus
            />
            
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <GestroButton 
                  label="Cancel" 
                  onPress={() => setIsNameModalOpen(false)}
                  variant={isDark ? 'secondary' : 'primary'}
                />
              </View>
              <View className="flex-1">
                <GestroButton 
                  label="Add App" 
                  onPress={saveCustomApp}
                  variant="primary"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit/Remove Modal */}
      <Modal visible={isEditModalOpen} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className={`p-6 rounded-3xl border ${surfaceStyle}`}>
            <Text className={`text-xl font-bold mb-4 ${textColor}`}>Edit Shortcut</Text>
            
            <Text className={`text-sm mb-2 font-semibold ${textColor}`}>Display Name</Text>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              className={`p-4 rounded-xl border mb-6 ${surfaceStyle} ${textColor}`}
            />
            
            <View className="space-y-4">
              <GestroButton 
                label="Save Changes" 
                onPress={saveEdit}
                variant="primary"
              />
              <GestroButton 
                label="Remove Shortcut" 
                onPress={deleteApp}
                variant="danger" // GestroButton usually handles danger/secondary styles well
              />
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} className="py-2 mt-2 items-center">
                <Text className={subTextColor}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
